package gcal

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// CreateMeetLink creates a Google Calendar event with an auto-generated Google Meet link.
// accessToken must be a valid OAuth2 access token with calendar.events scope.
// Returns the Meet URL or an empty string with an error.
func CreateMeetLink(accessToken, title string, start time.Time, durationMinutes int32) (string, error) {
	end := start.Add(time.Duration(durationMinutes) * time.Minute)

	requestID := fmt.Sprintf("tutofy-%d", start.UnixNano())

	event := map[string]interface{}{
		"summary": title,
		"start": map[string]string{
			"dateTime": start.UTC().Format(time.RFC3339),
			"timeZone": "UTC",
		},
		"end": map[string]string{
			"dateTime": end.UTC().Format(time.RFC3339),
			"timeZone": "UTC",
		},
		"conferenceData": map[string]interface{}{
			"createRequest": map[string]interface{}{
				"requestId":             requestID,
				"conferenceSolutionKey": map[string]string{"type": "hangoutsMeet"},
			},
		},
	}

	body, err := json.Marshal(event)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST",
		"https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
		bytes.NewReader(body),
	)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("calendar API error %d: %s", resp.StatusCode, string(raw))
	}

	var result struct {
		ConferenceData struct {
			EntryPoints []struct {
				EntryPointType string `json:"entryPointType"`
				URI            string `json:"uri"`
			} `json:"entryPoints"`
		} `json:"conferenceData"`
	}
	if err := json.Unmarshal(raw, &result); err != nil {
		return "", err
	}

	for _, ep := range result.ConferenceData.EntryPoints {
		if ep.EntryPointType == "video" {
			return ep.URI, nil
		}
	}
	return "", fmt.Errorf("no video entry point in calendar response")
}
