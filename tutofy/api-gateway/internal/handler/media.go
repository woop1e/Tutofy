package handler

import (
	"io"
	"net/http"

	"media-service/proto/mediapb"
)

const maxUploadSize = 50 << 20 // 50 MB

type MediaHandler struct{ client mediapb.MediaServiceClient }

func NewMediaHandler(c mediapb.MediaServiceClient) *MediaHandler { return &MediaHandler{c} }

// UploadFile accepts multipart/form-data with fields:
//
//	course_id  string
//	file_type  string  ("assignment" | "course_material")
//	file       binary  (the actual file)
func (h *MediaHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "file too large or invalid multipart body (max 50 MB)"})
		return
	}

	courseID := r.FormValue("course_id")
	if courseID == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "course_id is required"})
		return
	}

	fileTypeStr := r.FormValue("file_type")
	fileType := mediapb.FileType_FILE_TYPE_COURSE_MATERIAL
	if fileTypeStr == "assignment" {
		fileType = mediapb.FileType_FILE_TYPE_ASSIGNMENT
	}

	f, header, err := r.FormFile("file")
	if err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "file field is required"})
		return
	}
	defer f.Close()

	data, err := io.ReadAll(f)
	if err != nil {
		jsonResp(w, http.StatusInternalServerError, map[string]string{"error": "failed to read file"})
		return
	}

	resp, err := h.client.UploadFile(tokenCtx(r), &mediapb.UploadFileRequest{
		CourseId: courseID,
		FileName: header.Filename,
		FileType: fileType,
		Data:     data,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

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
