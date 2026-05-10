package handler

import (
	"net/http"

	"notification-service/proto/notificationpb"
)

type NotificationHandler struct{ client notificationpb.NotificationServiceClient }

func NewNotificationHandler(c notificationpb.NotificationServiceClient) *NotificationHandler {
	return &NotificationHandler{c}
}

func (h *NotificationHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	unreadOnly := q.Get("unread_only") == "true"
	resp, err := h.client.GetNotifications(tokenCtx(r), &notificationpb.GetNotificationsRequest{
		UserId:     q.Get("user_id"),
		UnreadOnly: unreadOnly,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *NotificationHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.MarkAsRead(tokenCtx(r), &notificationpb.MarkReadRequest{NotificationId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
