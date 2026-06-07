package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"auth-service/proto/authpb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// GoogleAuthHandler handles Google OAuth2 connect/callback for tutors.
type GoogleAuthHandler struct {
	clientID     string
	clientSecret string
	redirectURI  string
	authClient   authpb.AuthServiceClient
}

func NewGoogleAuthHandler(clientID, clientSecret, redirectURI string, authClient authpb.AuthServiceClient) *GoogleAuthHandler {
	return &GoogleAuthHandler{
		clientID:     clientID,
		clientSecret: clientSecret,
		redirectURI:  redirectURI,
		authClient:   authClient,
	}
}

// Connect redirects the tutor to the Google OAuth consent screen.
// The callerID is embedded in the state param so the callback can attribute the token.
func (h *GoogleAuthHandler) Connect(w http.ResponseWriter, r *http.Request) {
	callerID := userIDFromToken(r)
	if callerID == "" {
		// Fallback: accept JWT as ?token= query param for browser-redirect flow.
		if t := r.URL.Query().Get("token"); t != "" {
			callerID = userIDFromQueryToken(t)
		}
	}
	if callerID == "" {
		jsonResp(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	params := url.Values{
		"client_id":     {h.clientID},
		"redirect_uri":  {h.redirectURI},
		"response_type": {"code"},
		"scope":         {"https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly"},
		"access_type":   {"offline"},
		"prompt":        {"consent"},
		"state":         {callerID},
	}
	http.Redirect(w, r, "https://accounts.google.com/o/oauth2/v2/auth?"+params.Encode(), http.StatusFound)
}

type googleTokenResp struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	Error        string `json:"error"`
}

// Callback handles the Google OAuth2 redirect, exchanges the code for tokens, and stores them.
func (h *GoogleAuthHandler) Callback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	userID := r.URL.Query().Get("state")
	if code == "" || userID == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "missing code or state"})
		return
	}

	body := url.Values{
		"code":          {code},
		"client_id":     {h.clientID},
		"client_secret": {h.clientSecret},
		"redirect_uri":  {h.redirectURI},
		"grant_type":    {"authorization_code"},
	}

	resp, err := http.PostForm("https://oauth2.googleapis.com/token", body)
	if err != nil {
		jsonResp(w, http.StatusBadGateway, map[string]string{"error": "token exchange failed"})
		return
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)

	var tok googleTokenResp
	if err := json.Unmarshal(raw, &tok); err != nil || tok.Error != "" {
		jsonResp(w, http.StatusBadGateway, map[string]string{"error": "invalid token response: " + tok.Error})
		return
	}

	expiry := time.Now().Add(time.Duration(tok.ExpiresIn) * time.Second).Format(time.RFC3339)
	_, err = h.authClient.StoreGoogleToken(r.Context(), &authpb.StoreGoogleTokenRequest{
		UserId:       userID,
		AccessToken:  tok.AccessToken,
		RefreshToken: tok.RefreshToken,
		Expiry:       expiry,
	})
	if err != nil {
		jsonResp(w, http.StatusInternalServerError, map[string]string{"error": "could not store token"})
		return
	}

	fmt.Fprintln(w, "Google account connected successfully. You can close this window.")
}

// GenerateMeetLink creates a Google Calendar event with Google Meet and returns the meet link.
// POST /calendar/meet-link  body: { title, scheduled_at (RFC3339), duration_minutes }
func (h *GoogleAuthHandler) GenerateMeetLink(w http.ResponseWriter, r *http.Request) {
	callerID := userIDFromToken(r)
	if callerID == "" {
		jsonResp(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	var body struct {
		Title           string `json:"title"`
		ScheduledAt     string `json:"scheduled_at"`
		DurationMinutes int    `json:"duration_minutes"`
	}
	if err := decode(r, &body); err != nil || body.ScheduledAt == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "title and scheduled_at are required"})
		return
	}
	if body.DurationMinutes <= 0 {
		body.DurationMinutes = 60
	}

	// Get stored Google token
	tok, err := h.authClient.GetGoogleToken(r.Context(), &authpb.GetGoogleTokenRequest{UserId: callerID})
	if err != nil {
		st, _ := status.FromError(err)
		if st.Code() == codes.NotFound {
			jsonResp(w, http.StatusPreconditionFailed, map[string]string{"error": "google_not_connected"})
			return
		}
		jsonResp(w, http.StatusInternalServerError, map[string]string{"error": "could not get google token"})
		return
	}

	accessToken := tok.GetAccessToken()

	// Refresh token if expired
	if expiry, err2 := time.Parse(time.RFC3339, tok.GetExpiry()); err2 == nil && time.Now().After(expiry.Add(-60*time.Second)) {
		newTok, refreshErr := h.refreshAccessToken(tok.GetRefreshToken())
		if refreshErr != nil {
			jsonResp(w, http.StatusBadGateway, map[string]string{"error": "token refresh failed"})
			return
		}
		accessToken = newTok.AccessToken
		newExpiry := time.Now().Add(time.Duration(newTok.ExpiresIn) * time.Second).Format(time.RFC3339)
		h.authClient.StoreGoogleToken(r.Context(), &authpb.StoreGoogleTokenRequest{
			UserId:       callerID,
			AccessToken:  newTok.AccessToken,
			RefreshToken: tok.GetRefreshToken(),
			Expiry:       newExpiry,
		})
	}

	// Parse times
	start, err := time.Parse(time.RFC3339, body.ScheduledAt)
	if err != nil {
		start, err = time.Parse(time.RFC3339Nano, body.ScheduledAt)
		if err != nil {
			jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid scheduled_at"})
			return
		}
	}
	end := start.Add(time.Duration(body.DurationMinutes) * time.Minute)

	title := body.Title
	if title == "" {
		title = "Lesson"
	}

	// Build Calendar event payload with Meet
	requestID := fmt.Sprintf("%d", time.Now().UnixNano())
	event := map[string]any{
		"summary": title,
		"start":   map[string]string{"dateTime": start.UTC().Format(time.RFC3339), "timeZone": "UTC"},
		"end":     map[string]string{"dateTime": end.UTC().Format(time.RFC3339), "timeZone": "UTC"},
		"conferenceData": map[string]any{
			"createRequest": map[string]any{
				"requestId":             requestID,
				"conferenceSolutionKey": map[string]string{"type": "hangoutsMeet"},
			},
		},
	}
	payload, _ := json.Marshal(event)

	req, _ := http.NewRequest("POST",
		"https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
		bytes.NewReader(payload),
	)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		jsonResp(w, http.StatusBadGateway, map[string]string{"error": "calendar api error"})
		return
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		jsonResp(w, http.StatusBadGateway, map[string]string{"error": "calendar api returned " + resp.Status, "detail": string(raw)})
		return
	}

	var calEvent struct {
		HtmlLink       string `json:"htmlLink"`
		ConferenceData struct {
			EntryPoints []struct {
				EntryPointType string `json:"entryPointType"`
				Uri            string `json:"uri"`
				Label          string `json:"label"`
			} `json:"entryPoints"`
		} `json:"conferenceData"`
	}
	if err := json.Unmarshal(raw, &calEvent); err != nil {
		jsonResp(w, http.StatusInternalServerError, map[string]string{"error": "could not parse calendar response"})
		return
	}

	meetLink := ""
	for _, ep := range calEvent.ConferenceData.EntryPoints {
		if strings.EqualFold(ep.EntryPointType, "video") {
			meetLink = ep.Uri
			break
		}
	}
	if meetLink == "" {
		jsonResp(w, http.StatusBadGateway, map[string]string{"error": "no meet link in response"})
		return
	}

	jsonResp(w, http.StatusOK, map[string]string{
		"meet_link":       meetLink,
		"calendar_link":   calEvent.HtmlLink,
	})
}

func (h *GoogleAuthHandler) refreshAccessToken(refreshToken string) (*googleTokenResp, error) {
	body := url.Values{
		"client_id":     {h.clientID},
		"client_secret": {h.clientSecret},
		"refresh_token": {refreshToken},
		"grant_type":    {"refresh_token"},
	}
	resp, err := http.PostForm("https://oauth2.googleapis.com/token", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	var tok googleTokenResp
	if err := json.Unmarshal(raw, &tok); err != nil || tok.Error != "" {
		return nil, fmt.Errorf("refresh failed: %s", tok.Error)
	}
	return &tok, nil
}

// ExchangeCode accepts a Google OAuth code + userID (from the state param) sent by the
// frontend callback page, exchanges it for tokens, and stores them.
// POST /auth/google/exchange  body: { code, user_id }
func (h *GoogleAuthHandler) ExchangeCode(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Code   string `json:"code"`
		UserID string `json:"user_id"`
	}
	if err := decode(r, &body); err != nil || body.Code == "" || body.UserID == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "code and user_id are required"})
		return
	}

	vals := url.Values{
		"code":          {body.Code},
		"client_id":     {h.clientID},
		"client_secret": {h.clientSecret},
		"redirect_uri":  {h.redirectURI},
		"grant_type":    {"authorization_code"},
	}

	resp, err := http.PostForm("https://oauth2.googleapis.com/token", vals)
	if err != nil {
		jsonResp(w, http.StatusBadGateway, map[string]string{"error": "token exchange failed"})
		return
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)

	var tok googleTokenResp
	if err := json.Unmarshal(raw, &tok); err != nil || tok.Error != "" {
		jsonResp(w, http.StatusBadGateway, map[string]string{"error": "invalid token response: " + tok.Error})
		return
	}

	expiry := time.Now().Add(time.Duration(tok.ExpiresIn) * time.Second).Format(time.RFC3339)
	_, err = h.authClient.StoreGoogleToken(r.Context(), &authpb.StoreGoogleTokenRequest{
		UserId:       body.UserID,
		AccessToken:  tok.AccessToken,
		RefreshToken: tok.RefreshToken,
		Expiry:       expiry,
	})
	if err != nil {
		jsonResp(w, http.StatusInternalServerError, map[string]string{"error": "could not store token"})
		return
	}

	jsonResp(w, http.StatusOK, map[string]string{"status": "connected"})
}

// Status returns {"connected": true/false} for the authenticated caller.
func (h *GoogleAuthHandler) Status(w http.ResponseWriter, r *http.Request) {
	callerID := userIDFromToken(r)
	if callerID == "" {
		jsonResp(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	_, err := h.authClient.GetGoogleToken(r.Context(), &authpb.GetGoogleTokenRequest{UserId: callerID})
	if err != nil {
		st, _ := status.FromError(err)
		if st.Code() == codes.NotFound {
			jsonResp(w, http.StatusOK, map[string]bool{"connected": false})
			return
		}
		jsonResp(w, http.StatusInternalServerError, map[string]string{"error": "could not check status"})
		return
	}
	jsonResp(w, http.StatusOK, map[string]bool{"connected": true})
}
