package handler

import (
	"context"
	"errors"
	"time"

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

func (h *QuizHandler) mustEmbedUnimplementedQuizServiceServer() {}

func (h *QuizHandler) CreateQuiz(ctx context.Context, req *quizpb.CreateQuizRequest) (*quizpb.QuizResponse, error) {
	if req.GetCourseId() == "" || req.GetTitle() == "" {
		return nil, status.Error(codes.InvalidArgument, "course_id and title are required")
	}
	if req.GetTimeLimitMinutes() < 0 {
		return nil, status.Error(codes.InvalidArgument, "time_limit_minutes must be >= 0")
	}
	if req.GetMaxAttempts() < 0 {
		return nil, status.Error(codes.InvalidArgument, "max_attempts must be >= 0")
	}
	callerID, callerRole := middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx)
	deadline := parseDeadline(req.GetDeadline())
	scheduledAt := parseDeadline(req.GetScheduledAt())
	q, err := h.svc.CreateQuiz(ctx, callerID, callerRole, req.GetCourseId(), req.GetTitle(), req.GetTimeLimitMinutes(), req.GetMaxAttempts(), deadline, scheduledAt)
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

func (h *QuizHandler) GetQuizForAttempt(ctx context.Context, req *quizpb.GetQuizForAttemptRequest) (*quizpb.QuizForAttemptResponse, error) {
	if req.GetQuizId() == "" {
		return nil, status.Error(codes.InvalidArgument, "quiz_id is required")
	}
	quiz, questions, err := h.svc.GetQuizForAttempt(ctx, req.GetQuizId())
	if err != nil {
		return nil, mapErr(err)
	}
	qProtos := make([]*quizpb.QuestionWithOptionsResponse, 0, len(questions))
	for _, q := range questions {
		opts := make([]*quizpb.OptionForAttemptResponse, 0, len(q.Options))
		for _, o := range q.Options {
			opts = append(opts, &quizpb.OptionForAttemptResponse{Id: o.ID, Text: o.Text, IsCorrect: o.IsCorrect})
		}
		qProtos = append(qProtos, &quizpb.QuestionWithOptionsResponse{
			Id: q.ID, Text: q.Text, Position: int32(q.Position), Options: opts,
		})
	}
	return &quizpb.QuizForAttemptResponse{
		Id:               quiz.ID,
		CourseId:         quiz.CourseID,
		Title:            quiz.Title,
		TimeLimitMinutes: quiz.TimeLimitMinutes,
		MaxAttempts:      quiz.MaxAttempts,
		Deadline:         formatDeadline(quiz.Deadline),
		Questions:        qProtos,
	}, nil
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

func (h *QuizHandler) UpdateQuizSettings(ctx context.Context, req *quizpb.UpdateQuizSettingsRequest) (*quizpb.QuizResponse, error) {
	if req.GetQuizId() == "" {
		return nil, status.Error(codes.InvalidArgument, "quiz_id is required")
	}
	if req.GetTimeLimitMinutes() < 0 {
		return nil, status.Error(codes.InvalidArgument, "time_limit_minutes must be >= 0")
	}
	if req.GetMaxAttempts() < 0 {
		return nil, status.Error(codes.InvalidArgument, "max_attempts must be >= 0")
	}
	callerRole := middleware.RoleFromContext(ctx)
	deadline := parseDeadline(req.GetDeadline())
	q, err := h.svc.UpdateQuizSettings(ctx, callerRole, req.GetQuizId(), req.GetTimeLimitMinutes(), req.GetMaxAttempts(), deadline)
	if err != nil {
		return nil, mapErr(err)
	}
	return quizToProto(q), nil
}

func (h *QuizHandler) GetStudentAttempts(ctx context.Context, req *quizpb.GetStudentAttemptsRequest) (*quizpb.StudentAttemptsResponse, error) {
	if req.GetQuizId() == "" {
		return nil, status.Error(codes.InvalidArgument, "quiz_id is required")
	}
	callerID := middleware.UserIDFromContext(ctx)
	count, err := h.svc.GetStudentAttempts(ctx, callerID, req.GetQuizId())
	if err != nil {
		return nil, mapErr(err)
	}
	attempts, _ := h.svc.GetStudentCompletedAttempts(ctx, callerID, req.GetQuizId())
	summaries := make([]*quizpb.QuizAttemptSummary, 0, len(attempts))
	for _, a := range attempts {
		completedAt := ""
		if a.CompletedAt != nil {
			completedAt = a.CompletedAt.UTC().Format("2006-01-02T15:04:05Z")
		}
		pct := float32(0)
		if a.Total > 0 {
			pct = float32(a.Score) / float32(a.Total) * 100
		}
		summaries = append(summaries, &quizpb.QuizAttemptSummary{
			AttemptId:   a.ID,
			StudentId:   a.StudentID,
			Score:       int32(a.Score),
			Total:       int32(a.Total),
			Percentage:  pct,
			StartedAt:   a.StartedAt.UTC().Format("2006-01-02T15:04:05Z"),
			CompletedAt: completedAt,
		})
	}
	return &quizpb.StudentAttemptsResponse{AttemptsUsed: int32(count), Results: summaries}, nil
}

func (h *QuizHandler) UpdateQuestion(ctx context.Context, req *quizpb.UpdateQuestionRequest) (*quizpb.QuestionResponse, error) {
	if req.GetQuestionId() == "" || req.GetText() == "" {
		return nil, status.Error(codes.InvalidArgument, "question_id and text are required")
	}
	callerRole := middleware.RoleFromContext(ctx)
	q, err := h.svc.UpdateQuestion(ctx, callerRole, req.GetQuestionId(), req.GetText(), req.GetPosition())
	if err != nil {
		return nil, mapErr(err)
	}
	return &quizpb.QuestionResponse{Id: q.ID, QuizId: q.QuizID, Text: q.Text, Position: int32(q.Position)}, nil
}

func (h *QuizHandler) DeleteQuestion(ctx context.Context, req *quizpb.DeleteQuestionRequest) (*quizpb.Empty, error) {
	if req.GetQuestionId() == "" {
		return nil, status.Error(codes.InvalidArgument, "question_id is required")
	}
	if err := h.svc.DeleteQuestion(ctx, middleware.RoleFromContext(ctx), req.GetQuestionId()); err != nil {
		return nil, mapErr(err)
	}
	return &quizpb.Empty{}, nil
}

func (h *QuizHandler) UpdateOption(ctx context.Context, req *quizpb.UpdateOptionRequest) (*quizpb.OptionResponse, error) {
	if req.GetOptionId() == "" || req.GetText() == "" {
		return nil, status.Error(codes.InvalidArgument, "option_id and text are required")
	}
	callerRole := middleware.RoleFromContext(ctx)
	o, err := h.svc.UpdateOption(ctx, callerRole, req.GetOptionId(), req.GetText(), req.GetIsCorrect())
	if err != nil {
		return nil, mapErr(err)
	}
	return &quizpb.OptionResponse{Id: o.ID, QuestionId: o.QuestionID, Text: o.Text}, nil
}

func (h *QuizHandler) DeleteOption(ctx context.Context, req *quizpb.DeleteOptionRequest) (*quizpb.Empty, error) {
	if req.GetOptionId() == "" {
		return nil, status.Error(codes.InvalidArgument, "option_id is required")
	}
	if err := h.svc.DeleteOption(ctx, middleware.RoleFromContext(ctx), req.GetOptionId()); err != nil {
		return nil, mapErr(err)
	}
	return &quizpb.Empty{}, nil
}

func (h *QuizHandler) GetQuizAttempts(ctx context.Context, req *quizpb.GetQuizAttemptsRequest) (*quizpb.QuizAttemptsListResponse, error) {
	if req.GetQuizId() == "" {
		return nil, status.Error(codes.InvalidArgument, "quiz_id is required")
	}
	callerRole := middleware.RoleFromContext(ctx)
	attempts, err := h.svc.GetQuizAttempts(ctx, callerRole, req.GetQuizId())
	if err != nil {
		return nil, mapErr(err)
	}
	list := make([]*quizpb.QuizAttemptSummary, 0, len(attempts))
	for _, a := range attempts {
		completedAt := ""
		if a.CompletedAt != nil {
			completedAt = a.CompletedAt.UTC().Format("2006-01-02T15:04:05Z")
		}
		pct := float32(0)
		if a.Total > 0 {
			pct = float32(a.Score) / float32(a.Total) * 100
		}
		list = append(list, &quizpb.QuizAttemptSummary{
			AttemptId:   a.ID,
			StudentId:   a.StudentID,
			Score:       int32(a.Score),
			Total:       int32(a.Total),
			Percentage:  pct,
			StartedAt:   a.StartedAt.UTC().Format("2006-01-02T15:04:05Z"),
			CompletedAt: completedAt,
		})
	}
	return &quizpb.QuizAttemptsListResponse{Attempts: list}, nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

func quizToProto(q *model.Quiz) *quizpb.QuizResponse {
	return &quizpb.QuizResponse{
		Id:               q.ID,
		CourseId:         q.CourseID,
		Title:            q.Title,
		TimeLimitMinutes: q.TimeLimitMinutes,
		MaxAttempts:      q.MaxAttempts,
		Deadline:         formatDeadline(q.Deadline),
		ScheduledAt:      formatDeadline(q.ScheduledAt),
		CreatedAt:        q.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
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

func parseDeadline(s string) *time.Time {
	if s == "" {
		return nil
	}
	// Try RFC3339Nano first — JS toISOString() includes milliseconds (.000Z)
	t, err := time.Parse(time.RFC3339Nano, s)
	if err != nil {
		t, err = time.Parse(time.RFC3339, s)
	}
	if err != nil {
		return nil
	}
	return &t
}

func formatDeadline(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}

func mapErr(err error) error {
	switch {
	case errors.Is(err, service.ErrForbidden), errors.Is(err, service.ErrNotTutorAdmin):
		return status.Error(codes.PermissionDenied, err.Error())
	case errors.Is(err, service.ErrNotEnrolled):
		return status.Error(codes.FailedPrecondition, err.Error())
	case errors.Is(err, service.ErrAlreadyDone):
		return status.Error(codes.AlreadyExists, err.Error())
	case errors.Is(err, service.ErrDeadlinePassed):
		return status.Error(codes.FailedPrecondition, err.Error())
	case errors.Is(err, service.ErrNoAttemptsRemaining):
		return status.Error(codes.ResourceExhausted, err.Error())
	case errors.Is(err, service.ErrAttemptInProgress):
		return status.Error(codes.AlreadyExists, err.Error())
	case errors.Is(err, service.ErrTimeLimitExceeded):
		return status.Error(codes.DeadlineExceeded, err.Error())
	case errors.Is(err, service.ErrNoQuestions):
		return status.Error(codes.FailedPrecondition, err.Error())
	case errors.Is(err, service.ErrInvalidOption):
		return status.Error(codes.InvalidArgument, err.Error())
	case errors.Is(err, service.ErrInvalidInput):
		return status.Error(codes.InvalidArgument, err.Error())
	case errors.Is(err, repository.ErrNotFound):
		return status.Error(codes.NotFound, err.Error())
	default:
		return status.Error(codes.Internal, err.Error())
	}
}
