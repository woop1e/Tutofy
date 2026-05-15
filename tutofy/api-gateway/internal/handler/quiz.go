package handler

import (
	"net/http"

	"quiz-service/proto/quizpb"
)

type QuizHandler struct{ client quizpb.QuizServiceClient }

func NewQuizHandler(c quizpb.QuizServiceClient) *QuizHandler { return &QuizHandler{c} }

func (h *QuizHandler) CreateQuiz(w http.ResponseWriter, r *http.Request) {
	var req quizpb.CreateQuizRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.client.CreateQuiz(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *QuizHandler) AddQuestion(w http.ResponseWriter, r *http.Request) {
	var req quizpb.AddQuestionRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	req.QuizId = r.PathValue("id")
	resp, err := h.client.AddQuestion(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *QuizHandler) AddOption(w http.ResponseWriter, r *http.Request) {
	var req quizpb.AddOptionRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	req.QuestionId = r.PathValue("id")
	resp, err := h.client.AddOption(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *QuizHandler) DeleteQuiz(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.DeleteQuiz(tokenCtx(r), &quizpb.DeleteQuizRequest{QuizId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *QuizHandler) GetCourseQuizzes(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetCourseQuizzes(tokenCtx(r), &quizpb.GetCourseQuizzesRequest{CourseId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *QuizHandler) GetQuizForAttempt(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetQuizForAttempt(tokenCtx(r), &quizpb.GetQuizForAttemptRequest{QuizId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *QuizHandler) StartAttempt(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.StartAttempt(tokenCtx(r), &quizpb.StartAttemptRequest{QuizId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *QuizHandler) SubmitAttempt(w http.ResponseWriter, r *http.Request) {
	var req quizpb.SubmitAttemptRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	req.AttemptId = r.PathValue("id")
	resp, err := h.client.SubmitAttempt(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *QuizHandler) GetAttemptResult(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetAttemptResult(tokenCtx(r), &quizpb.GetAttemptResultRequest{AttemptId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *QuizHandler) UpdateQuizSettings(w http.ResponseWriter, r *http.Request) {
	var req quizpb.UpdateQuizSettingsRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	req.QuizId = r.PathValue("id")
	resp, err := h.client.UpdateQuizSettings(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *QuizHandler) GetStudentAttempts(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetStudentAttempts(tokenCtx(r), &quizpb.GetStudentAttemptsRequest{QuizId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
