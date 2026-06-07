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
		"sender":      map[string]string{"email": m.from},
		"to":          []map[string]string{{"email": to}},
		"subject":     subject,
		"textContent": body,
	}

	data, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", "https://api.brevo.com/v3/smtp/email", bytes.NewBuffer(data))
	if err != nil {
		return err
	}
	req.Header.Set("api-key", m.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var respBody map[string]any
		_ = json.NewDecoder(resp.Body).Decode(&respBody)
		return fmt.Errorf("brevo API error: status %d body=%v", resp.StatusCode, respBody)
	}
	return nil
}
