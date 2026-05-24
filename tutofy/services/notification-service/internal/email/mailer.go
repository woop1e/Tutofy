package email

import (
	"fmt"
	"net/smtp"
	"strings"
)

// Mailer sends emails via SMTP.
type Mailer struct {
	host string
	port string
	user string
	pass string
	from string
}

// New creates a Mailer. If host is empty, SendEmail is a no-op (useful in dev).
func New(host, port, user, pass, from string) *Mailer {
	return &Mailer{host: host, port: port, user: user, pass: pass, from: from}
}

// SendEmail sends a plain-text email. Returns nil if SMTP is unconfigured.
func (m *Mailer) SendEmail(to, subject, body string) error {
	if m.host == "" {
		return nil
	}
	addr := fmt.Sprintf("%s:%s", m.host, m.port)
	auth := smtp.PlainAuth("", m.user, m.pass, m.host)
	msg := buildMessage(m.from, to, subject, body)
	return smtp.SendMail(addr, auth, m.from, []string{to}, []byte(msg))
}

func buildMessage(from, to, subject, body string) string {
	var sb strings.Builder
	sb.WriteString("From: " + from + "\r\n")
	sb.WriteString("To: " + to + "\r\n")
	sb.WriteString("Subject: " + subject + "\r\n")
	sb.WriteString("MIME-Version: 1.0\r\n")
	sb.WriteString("Content-Type: text/plain; charset=utf-8\r\n")
	sb.WriteString("\r\n")
	sb.WriteString(body)
	return sb.String()
}
