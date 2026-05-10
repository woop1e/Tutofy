package handler

import (
	"context"
	"errors"

	"quiz-service/internal/middleware"
	"quiz-service/internal/model"
	"quiz-service/internal/repository"
	"quiz-service/internal/service"
	"quiz-service/proto/quizpb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type QuizHandler struct {
	quizpb.UnimplementedQuizServiceServer
	svc service.QuizService
}

func NewQuizHandler(svc service.QuizService) *QuizHandler { return &QuizHandler{svc: svc} }

func (h *QuizHandler) CreateQuiz(ctx context.Context, req *quizpb.CreateQuizRequest) (*quizpb.QuizResponse, error) {
	if req.GetCourseId() == "" || req.GetTitle() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id and title are required")
	}
	callerID, callerRole := middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx)
	q, err := h.svc.CreateQuiz(ctx, callerID, callerRole, req.GetCourseId(), req.GetTitle())
	if err != nil {
		return nil, mapErr(err)
	}
	return quizToProto(q), nil
}

func (h *QuizHandler) AddQuestion(ctx context.Context, req *quizpb.AddQuestionRequest) (*quizpb.QuestionResponse, error) {
	if req.GetQuizId() == "" || req.GetText() == "" {
		return nil, status.Error(codes.InvalidArgument, "quiz_id and text are required")
	}
	callerRole := middleware.RoleFromContext(ctx)
	q, err := h.svc.AddQuestion(ctx, callerRole, req.GetQuizId(), req.GetText(), req.GetPosition())
	if err != nil {
		return nil, mapErr(err)
	}
	return &quizpb.QuestionResponse{Id: q.ID, QuizId: q.QuizID, Text: q.Text, Position: int32(q.Position)}, nil
}

func (h *QuizHandler) AddOption(ctx context.Context, req *quizpb.AddOptionRequest) (*quizpb.OptionResponse, error) {
	if req.GetQuestionId() == "" || req.GetText() == "" {
		return nil, status.Error(codes.InvalidArgument, "question_id and text are required")
	}
	callerRole := middleware.RoleFromContext(ctx)
	o, err := h.svc.AddOption(ctx, callerRole, req.GetQuestionId(), req.GetText(), req.GetIsCorrect())
	if err != nil {
		return nil, mapErr(err)
	}
	return &quizpb.OptionResponse{Id: o.ID, QuestionId: o.QuestionID, Text: o.Text}, nil
}

func (h *QuizHandler) DeleteQuiz(ctx context.Context, req *quizpb.DeleteQuizRequest) (*quizpb.Empty, error) {
	if req.GetQuizId() == "" {
		return nil, status.Error(codes.InvalidArgument, "quiz_id is required")
	}
	if err := h.svc.DeleteQuiz(ctx, middleware.RoleFromContext(ctx), req.GetQuizId()); err != nil {
		return nil, mapErr(err)
	}
	return &quizpb.Empty{}, nil
}

func (h *QuizHandler) GetCourseQuizzes(ctx context.Context, req *quizpb.GetCourseQuizzesRequest) (*quizpb.QuizzesList, error) {
	if req.GetCourseId() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id is required")
	}
	quizzes, err := h.svc.GetCourseQuizzes(ctx, req.GetCourseId())
	if err != nil {
		return nil, mapErr(err)
	}
	list := make([]*quizpb.QuizResponse, 0, len(quizzes))
	for _, q := range quizzes {
		list = append(list, quizToProto(q))
	}
	return &quizpb.QuizzesList{Quizzes: list}, nil
}

func (h *QuizHandler) StartAttempt(ctx context.Context, req *quizpb.StartAttemptRequest) (*quizpb.AttemptResponse, error) {
	if req.GetQuizId() == "" {
		return nil, status.Error(codes.InvalidArgument, "quiz_id is required")
	}
	callerID, callerRole := middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx)
	a, err := h.svc.StartAttempt(ctx, callerID, callerRole, req.GetQuizId())
	if err != nil {
		return nil, mapErr(err)
	}
	return attemptToProto(a), nil
}

func (h *QuizHandler) SubmitAttempt(ctx context.Context, req *quizpb.SubmitAttemptRequest) (*quizpb.AttemptResultResponse, error) {
	if req.GetAttemptId() == "" {
		return nil, status.Error(codes.InvalidArgument, "attempt_id is required")
	}
	callerID := middleware.UserIDFromContext(ctx)
	answerMap := map[string]string{}
	for _, a := range req.GetAnswers() {
		answerMap[a.GetQuestionId()] = a.GetOptionId()
	}
	attempt, grades, err := h.svc.SubmitAttempt(ctx, callerID, req.GetAttemptId(), answerMap)
	if err != nil {
		return nil, mapErr(err)
	}
	return resultToProto(attempt, grades), nil
}

func (h *QuizHandler) GetAttemptResult(ctx context.Context, req *quizpb.GetAttemptResultRequest) (*quizpb.AttemptResultResponse, error) {
	if req.GetAttemptId() == "" {
		return nil, status.Error(codes.InvalidArgument, "attempt_id is required")
	}
	callerID, callerRole := middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx)
	attempt, grades, err := h.svc.GetAttemptResult(ctx, callerID, callerRole, req.GetAttemptId())
	if err != nil {
		return nil, mapErr(err)
	}
	return resultToProto(attempt, grades), nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

func quizToProto(q *model.Quiz) *quizpb.QuizResponse {
	return &quizpb.QuizResponse{
		Id:        q.ID,
		CourseId:  q.CourseID,
		Title:     q.Title,
		CreatedAt: q.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}

func attemptToProto(a *model.QuizAttempt) *quizpb.AttemptResponse {
	completedAt := ""
	if a.CompletedAt != nil {
		completedAt = a.CompletedAt.UTC().Format("2006-01-02T15:04:05Z")
	}
	return &quizpb.AttemptResponse{
		AttemptId:   a.ID,
		QuizId:      a.QuizID,
		StudentId:   a.StudentID,
		Score:       int32(a.Score),
		Total:       int32(a.Total),
		StartedAt:   a.StartedAt.UTC().Format("2006-01-02T15:04:05Z"),
		CompletedAt: completedAt,
	}
}

func resultToProto(a *model.QuizAttempt, grades []*service.GradeItem) *quizpb.AttemptResultResponse {
	pct := float32(0)
	if a.Total > 0 {
		pct = float32(a.Score) / float32(a.Total) * 100
	}
	items := make([]*quizpb.AnswerResultItem, 0, len(grades))
	for _, g := range grades {
		items = append(items, &quizpb.AnswerResultItem{
			QuestionId:      g.QuestionID,
			ChosenOptionId:  g.ChosenOptionID,
			CorrectOptionId: g.CorrectOptionID,
			IsCorrect:       g.IsCorrect,
		})
	}
	return &quizpb.AttemptResultResponse{
		AttemptId:  a.ID,
		Score:      int32(a.Score),
		Total:      int32(a.Total),
		Percentage: pct,
		Answers:    items,
	}
}

func mapErr(err error) error {
	switch {
	case errors.Is(err, service.ErrForbidden), errors.Is(err, service.ErrNotTutorAdmin):
		return status.Error(codes.PermissionDenied, err.Error())
	case errors.Is(err, service.ErrNotEnrolled):
		return status.Error(codes.FailedPrecondition, err.Error())
	case errors.Is(err, service.ErrAlreadyDone):
		return status.Error(codes.AlreadyExists, err.Error())
	case errors.Is(err, repository.ErrNotFound):
		return status.Error(codes.NotFound, err.Error())
	default:
		return status.Error(codes.Internal, err.Error())
	}
}
