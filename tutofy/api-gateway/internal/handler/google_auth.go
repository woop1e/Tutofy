package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
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
