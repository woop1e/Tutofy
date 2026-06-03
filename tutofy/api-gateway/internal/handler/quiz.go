package handler

import (
	"net/http"

	"quiz-service/proto/quizpb"
	"user-service/proto/userpb"
)

type QuizHandler struct {
	client     quizpb.QuizServiceClient
	userClient userpb.UserServiceClient
}

func NewQuizHandler(c quizpb.QuizServiceClient, uc userpb.UserServiceClient) *QuizHandler {
	return &QuizHandler{client: c, userClient: uc}
}

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

func (h *QuizHandler) UpdateQuestion(w http.ResponseWriter, r *http.Request) {
	var req quizpb.UpdateQuestionRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	req.QuestionId = r.PathValue("id")
	resp, err := h.client.UpdateQuestion(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *QuizHandler) DeleteQuestion(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.DeleteQuestion(tokenCtx(r), &quizpb.DeleteQuestionRequest{QuestionId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *QuizHandler) UpdateOption(w http.ResponseWriter, r *http.Request) {
	var req quizpb.UpdateOptionRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	req.OptionId = r.PathValue("id")
	resp, err := h.client.UpdateOption(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *QuizHandler) DeleteOption(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.DeleteOption(tokenCtx(r), &quizpb.DeleteOptionRequest{OptionId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *QuizHandler) GetQuizAttempts(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetQuizAttempts(tokenCtx(r), &quizpb.GetQuizAttemptsRequest{QuizId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}

	// Enrich with student names
	type enrichedAttempt struct {
		AttemptId   string  `json:"attempt_id"`
		StudentId   string  `json:"student_id"`
		StudentName string  `json:"student_name"`
		Score       int32   `json:"score"`
		Total       int32   `json:"total"`
		Percentage  float32 `json:"percentage"`
		StartedAt   string  `json:"started_at"`
		CompletedAt string  `json:"completed_at"`
	}

	nameCache := map[string]string{}
	result := make([]enrichedAttempt, 0, len(resp.GetAttempts()))
	for _, a := range resp.GetAttempts() {
		name := nameCache[a.GetStudentId()]
		if name == "" && h.userClient != nil {
			if u, err2 := h.userClient.GetUser(tokenCtx(r), &userpb.GetUserRequest{UserId: a.GetStudentId()}); err2 == nil {
				name = u.GetName()
				nameCache[a.GetStudentId()] = name
			}
		}
		result = append(result, enrichedAttempt{
			AttemptId:   a.GetAttemptId(),
			StudentId:   a.GetStudentId(),
			StudentName: name,
			Score:       a.GetScore(),
			Total:       a.GetTotal(),
			Percentage:  a.GetPercentage(),
			StartedAt:   a.GetStartedAt(),
			CompletedAt: a.GetCompletedAt(),
		})
	}
	jsonResp(w, http.StatusOK, map[string]interface{}{"attempts": result})
}
