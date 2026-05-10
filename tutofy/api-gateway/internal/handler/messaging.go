package handler

import (
	"net/http"

	"messaging-service/proto/messagingpb"
)

type MessagingHandler struct{ client messagingpb.MessagingServiceClient }

func NewMessagingHandler(c messagingpb.MessagingServiceClient) *MessagingHandler {
	return &MessagingHandler{c}
}

func (h *MessagingHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	var req messagingpb.SendMessageRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.client.SendMessage(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *MessagingHandler) GetConversation(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetConversation(tokenCtx(r), &messagingpb.GetConversationRequest{
		OtherUserId: r.PathValue("user_id"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *MessagingHandler) GetUserConversations(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetUserConversations(tokenCtx(r), &messagingpb.GetUserConversationsRequest{})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
