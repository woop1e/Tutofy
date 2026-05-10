package handler

import (
	"net/http"

	"media-service/proto/mediapb"
)

type MediaHandler struct{ client mediapb.MediaServiceClient }

func NewMediaHandler(c mediapb.MediaServiceClient) *MediaHandler { return &MediaHandler{c} }

func (h *MediaHandler) GetDownloadURL(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetDownloadURL(tokenCtx(r), &mediapb.GetDownloadURLRequest{FileId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *MediaHandler) DeleteFile(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.DeleteFile(tokenCtx(r), &mediapb.DeleteFileRequest{FileId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
