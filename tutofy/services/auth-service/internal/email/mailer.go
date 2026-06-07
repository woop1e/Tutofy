package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type Mailer struct {
	apiKey string
	from   string
}

func New(_, _, _, apiKey, from string) *Mailer {
	return &Mailer{apiKey: apiKey, from: from}
}

func (m *Mailer) SendEmail(to, subject, body string) error {
	if m.apiKey == "" {
		return nil
	}

	payload := map[string]any{
		"from":    m.from,
		"to":      []string{to},
		"subject": subject,
		"text":    body,
	}

	data, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(data))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+m.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend API error: status %d", resp.StatusCode)
	}
	return nil
}
