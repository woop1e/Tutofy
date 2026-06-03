package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"enrollment-service/proto/enrollmentpb"
	"quiz-service/internal/model"
	"quiz-service/internal/repository"

	"github.com/google/uuid"
	"google.golang.org/grpc/metadata"
)

var (
	ErrForbidden           = errors.New("forbidden")
	ErrNotTutorAdmin       = errors.New("only tutors and admins can manage quizzes")
	ErrNotEnrolled         = errors.New("must be enrolled to attempt this quiz")
	ErrAlreadyDone         = errors.New("attempt already completed")
	ErrDeadlinePassed      = errors.New("quiz deadline has passed")
	ErrNoAttemptsRemaining = errors.New("no attempts remaining")
	ErrAttemptInProgress   = errors.New("you already have an in-progress attempt for this quiz")
	ErrInvalidOption       = errors.New("one or more submitted options do not belong to the specified question")
	ErrTimeLimitExceeded   = errors.New("time limit for this attempt has been exceeded")
	ErrNoQuestions         = errors.New("quiz has no questions — cannot start an attempt")
	ErrInvalidInput        = errors.New("invalid input")
)

type QuizService interface {
	CreateQuiz(ctx context.Context, callerID, callerRole, courseID, title string, timeLimitMinutes, maxAttempts int32, deadline, scheduledAt *time.Time) (*model.Quiz, error)
	AddQuestion(ctx context.Context, callerRole, quizID, text string, position int32) (*model.Question, error)
	AddOption(ctx context.Context, callerRole, questionID, text string, isCorrect bool) (*model.Option, error)
	DeleteQuiz(ctx context.Context, callerRole, quizID string) error
	GetCourseQuizzes(ctx context.Context, courseID string) ([]*model.Quiz, error)
	GetQuizForAttempt(ctx context.Context, quizID string) (*model.Quiz, []*model.Question, error)
	StartAttempt(ctx context.Context, callerID, callerRole, quizID string) (*model.QuizAttempt, error)
	SubmitAttempt(ctx context.Context, callerID, attemptID string, answers map[string]string) (*model.QuizAttempt, []*GradeItem, error)
	GetAttemptResult(ctx context.Context, callerID, callerRole, attemptID string) (*model.QuizAttempt, []*GradeItem, error)
	UpdateQuizSettings(ctx context.Context, callerRole, quizID string, timeLimitMinutes, maxAttempts int32, deadline *time.Time) (*model.Quiz, error)
	GetStudentAttempts(ctx context.Context, callerID, quizID string) (int, error)
	GetStudentCompletedAttempts(ctx context.Context, callerID, quizID string) ([]*model.QuizAttempt, error)
	UpdateQuestion(ctx context.Context, callerRole, questionID, text string, position int32) (*model.Question, error)
	DeleteQuestion(ctx context.Context, callerRole, questionID string) error
	UpdateOption(ctx context.Context, callerRole, optionID, text string, isCorrect bool) (*model.Option, error)
	DeleteOption(ctx context.Context, callerRole, optionID string) error
	GetQuizAttempts(ctx context.Context, callerRole, quizID string) ([]*model.QuizAttempt, error)
}

type GradeItem struct {
	QuestionID      string
	ChosenOptionID  string
	CorrectOptionID string
	IsCorrect       bool
}

type quizService struct {
	repo             repository.QuizRepository
	enrollmentClient enrollmentpb.EnrollmentServiceClient
}

func NewQuizService(repo repository.QuizRepository, enrollmentClient enrollmentpb.EnrollmentServiceClient) QuizService {
	return &quizService{repo: repo, enrollmentClient: enrollmentClient}
}

func outCtx(ctx context.Context) context.Context {
	md, _ := metadata.FromIncomingContext(ctx)
	return metadata.NewOutgoingContext(ctx, md)
}

func (s *quizService) CreateQuiz(ctx context.Context, callerID, callerRole, courseID, title string, timeLimitMinutes, maxAttempts int32, deadline, scheduledAt *time.Time) (*model.Quiz, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrNotTutorAdmin
	}
	title = strings.TrimSpace(title)
	if title == "" {
		return nil, ErrInvalidInput
	}
	if courseID == "" {
		return nil, ErrInvalidInput
	}
	if timeLimitMinutes < 0 {
		return nil, ErrInvalidInput
	}
	if maxAttempts < 0 {
		return nil, ErrInvalidInput
	}
	if deadline != nil && !deadline.IsZero() && scheduledAt != nil && deadline.Before(*scheduledAt) {
		return nil, errors.New("deadline cannot be before scheduled date")
	}
	q := &model.Quiz{
		ID:               uuid.NewString(),
		CourseID:         courseID,
		Title:            title,
		TimeLimitMinutes: timeLimitMinutes,
		MaxAttempts:      maxAttempts,
		Deadline:         deadline,
		ScheduledAt:      scheduledAt,
		CreatedAt:        time.Now(),
	}
	return q, s.repo.CreateQuiz(ctx, q)
}

func (s *quizService) AddQuestion(ctx context.Context, callerRole, quizID, text string, position int32) (*model.Question, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrNotTutorAdmin
	}
	text = strings.TrimSpace(text)
	if text == "" {
		return nil, ErrInvalidInput
	}
	// Verify quiz exists
	if _, err := s.repo.GetQuizByID(ctx, quizID); err != nil {
		return nil, err
	}
	if position < 1 {
		position = 1
	}
	q := &model.Question{ID: uuid.NewString(), QuizID: quizID, Text: text, Position: int(position)}
	return q, s.repo.AddQuestion(ctx, q)
}

func (s *quizService) AddOption(ctx context.Context, callerRole, questionID, text string, isCorrect bool) (*model.Option, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrNotTutorAdmin
	}
	text = strings.TrimSpace(text)
	if text == "" {
		return nil, ErrInvalidInput
	}
	// Verify question exists
	if _, err := s.repo.GetQuestionByID(ctx, questionID); err != nil {
		return nil, err
	}
	o := &model.Option{ID: uuid.NewString(), QuestionID: questionID, Text: text, IsCorrect: isCorrect}
	return o, s.repo.AddOption(ctx, o)
}

func (s *quizService) DeleteQuiz(ctx context.Context, callerRole, quizID string) error {
	if callerRole != "tutor" && callerRole != "admin" {
		return ErrNotTutorAdmin
	}
	return s.repo.DeleteQuiz(ctx, quizID)
}

func (s *quizService) GetCourseQuizzes(ctx context.Context, courseID string) ([]*model.Quiz, error) {
	return s.repo.GetCourseQuizzes(ctx, courseID)
}

func (s *quizService) GetQuizForAttempt(ctx context.Context, quizID string) (*model.Quiz, []*model.Question, error) {
	quiz, err := s.repo.GetQuizByID(ctx, quizID)
	if err != nil {
		return nil, nil, err
	}
	questions, err := s.repo.GetQuestionsWithOptions(ctx, quizID)
	if err != nil {
		return nil, nil, err
	}
	return quiz, questions, nil
}

func (s *quizService) StartAttempt(ctx context.Context, callerID, callerRole, quizID string) (*model.QuizAttempt, error) {
	if callerRole != "student" {
		return nil, ErrForbidden
	}
	quiz, err := s.repo.GetQuizByID(ctx, quizID)
	if err != nil {
		return nil, err
	}

	// Enforce deadline
	if quiz.Deadline != nil && time.Now().After(*quiz.Deadline) {
		return nil, ErrDeadlinePassed
	}

	// Enforce attempt limit (only count completed attempts)
	if quiz.MaxAttempts > 0 {
		count, err := s.repo.CountCompletedAttempts(ctx, quizID, callerID)
		if err != nil {
			return nil, err
		}
		if count >= int(quiz.MaxAttempts) {
			return nil, ErrNoAttemptsRemaining
		}
	}

	// Prevent concurrent in-progress attempts
	open, err := s.repo.GetOpenAttempt(ctx, quizID, callerID)
	if err != nil {
		return nil, err
	}
	if open != nil {
		return nil, ErrAttemptInProgress
	}

	// Quiz must have questions
	questions, err := s.repo.GetQuestionsWithOptions(ctx, quizID)
	if err != nil {
		return nil, err
	}
	if len(questions) == 0 {
		return nil, ErrNoQuestions
	}

	// Check enrollment
	enrollments, err := s.enrollmentClient.GetUserEnrollments(outCtx(ctx), &enrollmentpb.UserRequest{UserId: callerID})
	if err != nil {
		return nil, errors.New("enrollment service unavailable")
	}
	enrolled := false
	for _, e := range enrollments.GetEnrollments() {
		if e.GetCourseId() == quiz.CourseID {
			enrolled = true
			break
		}
	}
	if !enrolled {
		return nil, ErrNotEnrolled
	}

	a := &model.QuizAttempt{ID: uuid.NewString(), QuizID: quizID, StudentID: callerID, StartedAt: time.Now()}
	return a, s.repo.CreateAttempt(ctx, a)
}

func (s *quizService) SubmitAttempt(ctx context.Context, callerID, attemptID string, answers map[string]string) (*model.QuizAttempt, []*GradeItem, error) {
	attempt, err := s.repo.GetAttempt(ctx, attemptID)
	if err != nil {
		return nil, nil, err
	}
	if attempt.StudentID != callerID {
		return nil, nil, ErrForbidden
	}
	if attempt.CompletedAt != nil {
		return nil, nil, ErrAlreadyDone
	}

	questions, err := s.repo.GetQuestionsWithOptions(ctx, attempt.QuizID)
	if err != nil {
		return nil, nil, err
	}

	// Enforce time limit
	quiz, err := s.repo.GetQuizByID(ctx, attempt.QuizID)
	if err != nil {
		return nil, nil, err
	}
	if quiz.TimeLimitMinutes > 0 {
		elapsed := time.Since(attempt.StartedAt)
		limit := time.Duration(quiz.TimeLimitMinutes) * time.Minute
		if elapsed > limit+30*time.Second { // 30s grace period
			return nil, nil, ErrTimeLimitExceeded
		}
	}

	// Validate that each submitted optionID belongs to the specified questionID
	optionIndex := map[string]string{} // optionID → questionID
	for _, q := range questions {
		for _, o := range q.Options {
			optionIndex[o.ID] = q.ID
		}
	}
	for qID, oID := range answers {
		if oID == "" {
			continue
		}
		if belongsTo, ok := optionIndex[oID]; !ok || belongsTo != qID {
			return nil, nil, ErrInvalidOption
		}
	}

	var savedAnswers []*model.AttemptAnswer
	for qID, oID := range answers {
		if oID == "" {
			continue
		}
		savedAnswers = append(savedAnswers, &model.AttemptAnswer{AttemptID: attemptID, QuestionID: qID, OptionID: oID})
	}
	if len(savedAnswers) > 0 {
		if err := s.repo.SaveAnswers(ctx, savedAnswers); err != nil {
			return nil, nil, err
		}
	}

	// Auto-grade
	score := 0
	var grades []*GradeItem
	for _, q := range questions {
		chosen := answers[q.ID]
		correctID := ""
		isCorrect := false
		for _, o := range q.Options {
			if o.IsCorrect && correctID == "" {
				correctID = o.ID // first correct option (for display)
			}
			if o.ID == chosen && o.IsCorrect {
				isCorrect = true
			}
		}
		if isCorrect {
			score++
		}
		grades = append(grades, &GradeItem{
			QuestionID:      q.ID,
			ChosenOptionID:  chosen,
			CorrectOptionID: correctID,
			IsCorrect:       isCorrect,
		})
	}

	now := time.Now()
	if err := s.repo.CompleteAttempt(ctx, attemptID, score, len(questions), now); err != nil {
		return nil, nil, err
	}
	attempt.Score = score
	attempt.Total = len(questions)
	attempt.CompletedAt = &now
	return attempt, grades, nil
}

func (s *quizService) GetAttemptResult(ctx context.Context, callerID, callerRole, attemptID string) (*model.QuizAttempt, []*GradeItem, error) {
	attempt, err := s.repo.GetAttempt(ctx, attemptID)
	if err != nil {
		return nil, nil, err
	}
	if callerRole == "student" && attempt.StudentID != callerID {
		return nil, nil, ErrForbidden
	}
	if attempt.CompletedAt == nil {
		return nil, nil, errors.New("attempt is not yet completed")
	}

	rawAnswers, err := s.repo.GetAttemptAnswers(ctx, attemptID)
	if err != nil {
		return nil, nil, err
	}
	chosenMap := map[string]string{}
	for _, a := range rawAnswers {
		chosenMap[a.QuestionID] = a.OptionID
	}

	questions, err := s.repo.GetQuestionsWithOptions(ctx, attempt.QuizID)
	if err != nil {
		return nil, nil, err
	}

	var grades []*GradeItem
	for _, q := range questions {
		chosen := chosenMap[q.ID]
		correctID := ""
		isCorrect := false
		for _, o := range q.Options {
			if o.IsCorrect && correctID == "" {
				correctID = o.ID
			}
			if o.ID == chosen && o.IsCorrect {
				isCorrect = true
			}
		}
		grades = append(grades, &GradeItem{
			QuestionID:      q.ID,
			ChosenOptionID:  chosen,
			CorrectOptionID: correctID,
			IsCorrect:       isCorrect,
		})
	}
	return attempt, grades, nil
}

func (s *quizService) UpdateQuizSettings(ctx context.Context, callerRole, quizID string, timeLimitMinutes, maxAttempts int32, deadline *time.Time) (*model.Quiz, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrNotTutorAdmin
	}
	if timeLimitMinutes < 0 {
		return nil, ErrInvalidInput
	}
	if maxAttempts < 0 {
		return nil, ErrInvalidInput
	}
	if err := s.repo.UpdateQuizSettings(ctx, quizID, timeLimitMinutes, maxAttempts, deadline); err != nil {
		return nil, err
	}
	return s.repo.GetQuizByID(ctx, quizID)
}

func (s *quizService) GetStudentAttempts(ctx context.Context, callerID, quizID string) (int, error) {
	return s.repo.CountCompletedAttempts(ctx, quizID, callerID)
}

func (s *quizService) GetStudentCompletedAttempts(ctx context.Context, callerID, quizID string) ([]*model.QuizAttempt, error) {
	return s.repo.GetStudentCompletedAttempts(ctx, quizID, callerID)
}

func (s *quizService) UpdateQuestion(ctx context.Context, callerRole, questionID, text string, position int32) (*model.Question, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrNotTutorAdmin
	}
	text = strings.TrimSpace(text)
	if text == "" {
		return nil, ErrInvalidInput
	}
	if position < 1 {
		position = 1
	}
	if err := s.repo.UpdateQuestion(ctx, questionID, text, int(position)); err != nil {
		return nil, err
	}
	return s.repo.GetQuestionByID(ctx, questionID)
}

func (s *quizService) DeleteQuestion(ctx context.Context, callerRole, questionID string) error {
	if callerRole != "tutor" && callerRole != "admin" {
		return ErrNotTutorAdmin
	}
	return s.repo.DeleteQuestion(ctx, questionID)
}

func (s *quizService) UpdateOption(ctx context.Context, callerRole, optionID, text string, isCorrect bool) (*model.Option, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrNotTutorAdmin
	}
	text = strings.TrimSpace(text)
	if text == "" {
		return nil, ErrInvalidInput
	}
	if err := s.repo.UpdateOption(ctx, optionID, text, isCorrect); err != nil {
		return nil, err
	}
	return &model.Option{ID: optionID, Text: text, IsCorrect: isCorrect}, nil
}

func (s *quizService) DeleteOption(ctx context.Context, callerRole, optionID string) error {
	if callerRole != "tutor" && callerRole != "admin" {
		return ErrNotTutorAdmin
	}
	return s.repo.DeleteOption(ctx, optionID)
}

func (s *quizService) GetQuizAttempts(ctx context.Context, callerRole, quizID string) ([]*model.QuizAttempt, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrNotTutorAdmin
	}
	return s.repo.GetQuizAttempts(ctx, quizID)
}
