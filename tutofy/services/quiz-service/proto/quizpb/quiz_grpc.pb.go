package quizpb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

// ── Messages ──────────────────────────────────────────────────────────────────

type CreateQuizRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId         string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	Title            string `protobuf:"bytes,2,opt,name=title,proto3" json:"title,omitempty"`
	TimeLimitMinutes int32  `protobuf:"varint,3,opt,name=time_limit_minutes,json=timeLimitMinutes,proto3" json:"time_limit_minutes,omitempty"`
	MaxAttempts      int32  `protobuf:"varint,4,opt,name=max_attempts,json=maxAttempts,proto3" json:"max_attempts,omitempty"`
	Deadline         string `protobuf:"bytes,5,opt,name=deadline,proto3" json:"deadline,omitempty"`
	ScheduledAt      string `protobuf:"bytes,6,opt,name=scheduled_at,json=scheduledAt,proto3" json:"scheduled_at,omitempty"`
}

func (x *CreateQuizRequest) Reset()          { *x = CreateQuizRequest{} }
func (x *CreateQuizRequest) String() string   { return x.Title }
func (x *CreateQuizRequest) ProtoMessage()   {}
func (x *CreateQuizRequest) GetCourseId() string        { return x.CourseId }
func (x *CreateQuizRequest) GetTitle() string           { return x.Title }
func (x *CreateQuizRequest) GetTimeLimitMinutes() int32 { return x.TimeLimitMinutes }
func (x *CreateQuizRequest) GetMaxAttempts() int32      { return x.MaxAttempts }
func (x *CreateQuizRequest) GetDeadline() string        { return x.Deadline }
func (x *CreateQuizRequest) GetScheduledAt() string     { return x.ScheduledAt }

type AddQuestionRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	QuizId   string `protobuf:"bytes,1,opt,name=quiz_id,json=quizId,proto3" json:"quiz_id,omitempty"`
	Text     string `protobuf:"bytes,2,opt,name=text,proto3" json:"text,omitempty"`
	Position int32  `protobuf:"varint,3,opt,name=position,proto3" json:"position,omitempty"`
}

func (x *AddQuestionRequest) Reset()          { *x = AddQuestionRequest{} }
func (x *AddQuestionRequest) String() string   { return x.QuizId }
func (x *AddQuestionRequest) ProtoMessage()   {}
func (x *AddQuestionRequest) GetQuizId() string   { return x.QuizId }
func (x *AddQuestionRequest) GetText() string     { return x.Text }
func (x *AddQuestionRequest) GetPosition() int32  { return x.Position }

type AddOptionRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	QuestionId string `protobuf:"bytes,1,opt,name=question_id,json=questionId,proto3" json:"question_id,omitempty"`
	Text       string `protobuf:"bytes,2,opt,name=text,proto3" json:"text,omitempty"`
	IsCorrect  bool   `protobuf:"varint,3,opt,name=is_correct,json=isCorrect,proto3" json:"is_correct,omitempty"`
}

func (x *AddOptionRequest) Reset()             { *x = AddOptionRequest{} }
func (x *AddOptionRequest) String() string      { return x.QuestionId }
func (x *AddOptionRequest) ProtoMessage()      {}
func (x *AddOptionRequest) GetQuestionId() string { return x.QuestionId }
func (x *AddOptionRequest) GetText() string       { return x.Text }
func (x *AddOptionRequest) GetIsCorrect() bool    { return x.IsCorrect }

type DeleteQuizRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	QuizId string `protobuf:"bytes,1,opt,name=quiz_id,json=quizId,proto3" json:"quiz_id,omitempty"`
}

func (x *DeleteQuizRequest) Reset()          { *x = DeleteQuizRequest{} }
func (x *DeleteQuizRequest) String() string   { return x.QuizId }
func (x *DeleteQuizRequest) ProtoMessage()   {}
func (x *DeleteQuizRequest) GetQuizId() string { return x.QuizId }

type GetCourseQuizzesRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *GetCourseQuizzesRequest) Reset()           { *x = GetCourseQuizzesRequest{} }
func (x *GetCourseQuizzesRequest) String() string    { return x.CourseId }
func (x *GetCourseQuizzesRequest) ProtoMessage()    {}
func (x *GetCourseQuizzesRequest) GetCourseId() string { return x.CourseId }

type StartAttemptRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	QuizId string `protobuf:"bytes,1,opt,name=quiz_id,json=quizId,proto3" json:"quiz_id,omitempty"`
}

func (x *StartAttemptRequest) Reset()          { *x = StartAttemptRequest{} }
func (x *StartAttemptRequest) String() string   { return x.QuizId }
func (x *StartAttemptRequest) ProtoMessage()   {}
func (x *StartAttemptRequest) GetQuizId() string { return x.QuizId }

type AnswerInput struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	QuestionId string `protobuf:"bytes,1,opt,name=question_id,json=questionId,proto3" json:"question_id,omitempty"`
	OptionId   string `protobuf:"bytes,2,opt,name=option_id,json=optionId,proto3" json:"option_id,omitempty"`
}

func (x *AnswerInput) Reset()             { *x = AnswerInput{} }
func (x *AnswerInput) String() string      { return "" }
func (x *AnswerInput) ProtoMessage()      {}
func (x *AnswerInput) GetQuestionId() string { return x.QuestionId }
func (x *AnswerInput) GetOptionId() string   { return x.OptionId }

type SubmitAttemptRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AttemptId string         `protobuf:"bytes,1,opt,name=attempt_id,json=attemptId,proto3" json:"attempt_id,omitempty"`
	Answers   []*AnswerInput `protobuf:"bytes,2,rep,name=answers,proto3" json:"answers,omitempty"`
}

func (x *SubmitAttemptRequest) Reset()            { *x = SubmitAttemptRequest{} }
func (x *SubmitAttemptRequest) String() string     { return x.AttemptId }
func (x *SubmitAttemptRequest) ProtoMessage()     {}
func (x *SubmitAttemptRequest) GetAttemptId() string    { return x.AttemptId }
func (x *SubmitAttemptRequest) GetAnswers() []*AnswerInput { return x.Answers }

type GetAttemptResultRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AttemptId string `protobuf:"bytes,1,opt,name=attempt_id,json=attemptId,proto3" json:"attempt_id,omitempty"`
}

func (x *GetAttemptResultRequest) Reset()             { *x = GetAttemptResultRequest{} }
func (x *GetAttemptResultRequest) String() string      { return x.AttemptId }
func (x *GetAttemptResultRequest) ProtoMessage()      {}
func (x *GetAttemptResultRequest) GetAttemptId() string { return x.AttemptId }

type QuizResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id               string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	CourseId         string `protobuf:"bytes,2,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	Title            string `protobuf:"bytes,3,opt,name=title,proto3" json:"title,omitempty"`
	CreatedAt        string `protobuf:"bytes,4,opt,name=created_at,json=createdAt,proto3" json:"created_at,omitempty"`
	TimeLimitMinutes int32  `protobuf:"varint,5,opt,name=time_limit_minutes,json=timeLimitMinutes,proto3" json:"time_limit_minutes,omitempty"`
	MaxAttempts      int32  `protobuf:"varint,6,opt,name=max_attempts,json=maxAttempts,proto3" json:"max_attempts,omitempty"`
	Deadline         string `protobuf:"bytes,7,opt,name=deadline,proto3" json:"deadline,omitempty"`
	ScheduledAt      string `protobuf:"bytes,8,opt,name=scheduled_at,json=scheduledAt,proto3" json:"scheduled_at,omitempty"`
}

func (x *QuizResponse) Reset()          { *x = QuizResponse{} }
func (x *QuizResponse) String() string   { return x.Id }
func (x *QuizResponse) ProtoMessage()   {}
func (x *QuizResponse) GetId() string               { return x.Id }
func (x *QuizResponse) GetCourseId() string         { return x.CourseId }
func (x *QuizResponse) GetTitle() string            { return x.Title }
func (x *QuizResponse) GetCreatedAt() string        { return x.CreatedAt }
func (x *QuizResponse) GetTimeLimitMinutes() int32  { return x.TimeLimitMinutes }
func (x *QuizResponse) GetMaxAttempts() int32       { return x.MaxAttempts }
func (x *QuizResponse) GetDeadline() string         { return x.Deadline }
func (x *QuizResponse) GetScheduledAt() string      { return x.ScheduledAt }

type QuestionResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id       string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	QuizId   string `protobuf:"bytes,2,opt,name=quiz_id,json=quizId,proto3" json:"quiz_id,omitempty"`
	Text     string `protobuf:"bytes,3,opt,name=text,proto3" json:"text,omitempty"`
	Position int32  `protobuf:"varint,4,opt,name=position,proto3" json:"position,omitempty"`
}

func (x *QuestionResponse) Reset()          { *x = QuestionResponse{} }
func (x *QuestionResponse) String() string   { return x.Id }
func (x *QuestionResponse) ProtoMessage()   {}
func (x *QuestionResponse) GetId() string        { return x.Id }
func (x *QuestionResponse) GetQuizId() string    { return x.QuizId }
func (x *QuestionResponse) GetText() string      { return x.Text }
func (x *QuestionResponse) GetPosition() int32   { return x.Position }

type OptionResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id         string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	QuestionId string `protobuf:"bytes,2,opt,name=question_id,json=questionId,proto3" json:"question_id,omitempty"`
	Text       string `protobuf:"bytes,3,opt,name=text,proto3" json:"text,omitempty"`
}

func (x *OptionResponse) Reset()             { *x = OptionResponse{} }
func (x *OptionResponse) String() string      { return x.Id }
func (x *OptionResponse) ProtoMessage()      {}
func (x *OptionResponse) GetId() string           { return x.Id }
func (x *OptionResponse) GetQuestionId() string   { return x.QuestionId }
func (x *OptionResponse) GetText() string         { return x.Text }

type AttemptResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AttemptId   string `protobuf:"bytes,1,opt,name=attempt_id,json=attemptId,proto3" json:"attempt_id,omitempty"`
	QuizId      string `protobuf:"bytes,2,opt,name=quiz_id,json=quizId,proto3" json:"quiz_id,omitempty"`
	StudentId   string `protobuf:"bytes,3,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	Score       int32  `protobuf:"varint,4,opt,name=score,proto3" json:"score,omitempty"`
	Total       int32  `protobuf:"varint,5,opt,name=total,proto3" json:"total,omitempty"`
	StartedAt   string `protobuf:"bytes,6,opt,name=started_at,json=startedAt,proto3" json:"started_at,omitempty"`
	CompletedAt string `protobuf:"bytes,7,opt,name=completed_at,json=completedAt,proto3" json:"completed_at,omitempty"`
}

func (x *AttemptResponse) Reset()             { *x = AttemptResponse{} }
func (x *AttemptResponse) String() string      { return x.AttemptId }
func (x *AttemptResponse) ProtoMessage()      {}
func (x *AttemptResponse) GetAttemptId() string   { return x.AttemptId }
func (x *AttemptResponse) GetQuizId() string      { return x.QuizId }
func (x *AttemptResponse) GetStudentId() string   { return x.StudentId }
func (x *AttemptResponse) GetScore() int32        { return x.Score }
func (x *AttemptResponse) GetTotal() int32        { return x.Total }
func (x *AttemptResponse) GetStartedAt() string   { return x.StartedAt }
func (x *AttemptResponse) GetCompletedAt() string { return x.CompletedAt }

type AnswerResultItem struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	QuestionId      string `protobuf:"bytes,1,opt,name=question_id,json=questionId,proto3" json:"question_id,omitempty"`
	ChosenOptionId  string `protobuf:"bytes,2,opt,name=chosen_option_id,json=chosenOptionId,proto3" json:"chosen_option_id,omitempty"`
	CorrectOptionId string `protobuf:"bytes,3,opt,name=correct_option_id,json=correctOptionId,proto3" json:"correct_option_id,omitempty"`
	IsCorrect       bool   `protobuf:"varint,4,opt,name=is_correct,json=isCorrect,proto3" json:"is_correct,omitempty"`
}

func (x *AnswerResultItem) Reset()               { *x = AnswerResultItem{} }
func (x *AnswerResultItem) String() string        { return "" }
func (x *AnswerResultItem) ProtoMessage()        {}
func (x *AnswerResultItem) GetQuestionId() string      { return x.QuestionId }
func (x *AnswerResultItem) GetChosenOptionId() string  { return x.ChosenOptionId }
func (x *AnswerResultItem) GetCorrectOptionId() string { return x.CorrectOptionId }
func (x *AnswerResultItem) GetIsCorrect() bool         { return x.IsCorrect }

type AttemptResultResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AttemptId  string              `protobuf:"bytes,1,opt,name=attempt_id,json=attemptId,proto3" json:"attempt_id,omitempty"`
	Score      int32               `protobuf:"varint,2,opt,name=score,proto3" json:"score,omitempty"`
	Total      int32               `protobuf:"varint,3,opt,name=total,proto3" json:"total,omitempty"`
	Percentage float32             `protobuf:"fixed32,4,opt,name=percentage,proto3" json:"percentage,omitempty"`
	Answers    []*AnswerResultItem  `protobuf:"bytes,5,rep,name=answers,proto3" json:"answers,omitempty"`
}

func (x *AttemptResultResponse) Reset()             { *x = AttemptResultResponse{} }
func (x *AttemptResultResponse) String() string      { return x.AttemptId }
func (x *AttemptResultResponse) ProtoMessage()      {}
func (x *AttemptResultResponse) GetAttemptId() string          { return x.AttemptId }
func (x *AttemptResultResponse) GetScore() int32               { return x.Score }
func (x *AttemptResultResponse) GetTotal() int32               { return x.Total }
func (x *AttemptResultResponse) GetPercentage() float32        { return x.Percentage }
func (x *AttemptResultResponse) GetAnswers() []*AnswerResultItem { return x.Answers }

type QuizzesList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Quizzes []*QuizResponse `protobuf:"bytes,1,rep,name=quizzes,proto3" json:"quizzes,omitempty"`
}

func (x *QuizzesList) Reset()          { *x = QuizzesList{} }
func (x *QuizzesList) String() string   { return "" }
func (x *QuizzesList) ProtoMessage()   {}
func (x *QuizzesList) GetQuizzes() []*QuizResponse { return x.Quizzes }

type Empty struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *Empty) Reset()          { *x = Empty{} }
func (x *Empty) String() string   { return "" }
func (x *Empty) ProtoMessage()   {}

type GetQuizForAttemptRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	QuizId string `protobuf:"bytes,1,opt,name=quiz_id,json=quizId,proto3" json:"quiz_id,omitempty"`
}

func (x *GetQuizForAttemptRequest) Reset()          { *x = GetQuizForAttemptRequest{} }
func (x *GetQuizForAttemptRequest) String() string   { return x.QuizId }
func (x *GetQuizForAttemptRequest) ProtoMessage()   {}
func (x *GetQuizForAttemptRequest) GetQuizId() string { return x.QuizId }

type OptionForAttemptResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id        string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Text      string `protobuf:"bytes,2,opt,name=text,proto3" json:"text,omitempty"`
	IsCorrect bool   `protobuf:"varint,3,opt,name=is_correct,json=isCorrect,proto3" json:"is_correct,omitempty"`
}

func (x *OptionForAttemptResponse) Reset()          { *x = OptionForAttemptResponse{} }
func (t *OptionForAttemptResponse) String() string   { return t.Id }
func (t *OptionForAttemptResponse) ProtoMessage()   {}
func (t *OptionForAttemptResponse) GetId() string        { return t.Id }
func (t *OptionForAttemptResponse) GetText() string      { return t.Text }
func (t *OptionForAttemptResponse) GetIsCorrect() bool   { return t.IsCorrect }

type QuestionWithOptionsResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id       string                      `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Text     string                      `protobuf:"bytes,2,opt,name=text,proto3" json:"text,omitempty"`
	Position int32                       `protobuf:"varint,3,opt,name=position,proto3" json:"position,omitempty"`
	Options  []*OptionForAttemptResponse `protobuf:"bytes,4,rep,name=options,proto3" json:"options,omitempty"`
}

func (x *QuestionWithOptionsResponse) Reset()          { *x = QuestionWithOptionsResponse{} }
func (x *QuestionWithOptionsResponse) String() string   { return x.Id }
func (x *QuestionWithOptionsResponse) ProtoMessage()   {}
func (x *QuestionWithOptionsResponse) GetId() string        { return x.Id }
func (x *QuestionWithOptionsResponse) GetText() string      { return x.Text }
func (x *QuestionWithOptionsResponse) GetPosition() int32   { return x.Position }
func (x *QuestionWithOptionsResponse) GetOptions() []*OptionForAttemptResponse { return x.Options }

type QuizForAttemptResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id               string                        `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	CourseId         string                        `protobuf:"bytes,2,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	Title            string                        `protobuf:"bytes,3,opt,name=title,proto3" json:"title,omitempty"`
	Questions        []*QuestionWithOptionsResponse `protobuf:"bytes,4,rep,name=questions,proto3" json:"questions,omitempty"`
	TimeLimitMinutes int32                         `protobuf:"varint,5,opt,name=time_limit_minutes,json=timeLimitMinutes,proto3" json:"time_limit_minutes,omitempty"`
	MaxAttempts      int32                         `protobuf:"varint,6,opt,name=max_attempts,json=maxAttempts,proto3" json:"max_attempts,omitempty"`
	Deadline         string                        `protobuf:"bytes,7,opt,name=deadline,proto3" json:"deadline,omitempty"`
}

func (x *QuizForAttemptResponse) Reset()          { *x = QuizForAttemptResponse{} }
func (x *QuizForAttemptResponse) String() string   { return x.Id }
func (x *QuizForAttemptResponse) ProtoMessage()   {}
func (x *QuizForAttemptResponse) GetId() string               { return x.Id }
func (x *QuizForAttemptResponse) GetCourseId() string         { return x.CourseId }
func (x *QuizForAttemptResponse) GetTitle() string            { return x.Title }
func (x *QuizForAttemptResponse) GetQuestions() []*QuestionWithOptionsResponse { return x.Questions }
func (x *QuizForAttemptResponse) GetTimeLimitMinutes() int32  { return x.TimeLimitMinutes }
func (x *QuizForAttemptResponse) GetMaxAttempts() int32       { return x.MaxAttempts }
func (x *QuizForAttemptResponse) GetDeadline() string         { return x.Deadline }

type UpdateQuizSettingsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	QuizId           string `protobuf:"bytes,1,opt,name=quiz_id,json=quizId,proto3" json:"quiz_id,omitempty"`
	TimeLimitMinutes int32  `protobuf:"varint,2,opt,name=time_limit_minutes,json=timeLimitMinutes,proto3" json:"time_limit_minutes,omitempty"`
	MaxAttempts      int32  `protobuf:"varint,3,opt,name=max_attempts,json=maxAttempts,proto3" json:"max_attempts,omitempty"`
	Deadline         string `protobuf:"bytes,4,opt,name=deadline,proto3" json:"deadline,omitempty"`
}

func (x *UpdateQuizSettingsRequest) Reset()          { *x = UpdateQuizSettingsRequest{} }
func (x *UpdateQuizSettingsRequest) String() string   { return x.QuizId }
func (x *UpdateQuizSettingsRequest) ProtoMessage()   {}
func (x *UpdateQuizSettingsRequest) GetQuizId() string        { return x.QuizId }
func (x *UpdateQuizSettingsRequest) GetTimeLimitMinutes() int32 { return x.TimeLimitMinutes }
func (x *UpdateQuizSettingsRequest) GetMaxAttempts() int32    { return x.MaxAttempts }
func (x *UpdateQuizSettingsRequest) GetDeadline() string      { return x.Deadline }

type GetStudentAttemptsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	QuizId string `protobuf:"bytes,1,opt,name=quiz_id,json=quizId,proto3" json:"quiz_id,omitempty"`
}

func (x *GetStudentAttemptsRequest) Reset()          { *x = GetStudentAttemptsRequest{} }
func (x *GetStudentAttemptsRequest) String() string   { return x.QuizId }
func (x *GetStudentAttemptsRequest) ProtoMessage()   {}
func (x *GetStudentAttemptsRequest) GetQuizId() string { return x.QuizId }

type StudentAttemptsResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AttemptsUsed int32                  `protobuf:"varint,1,opt,name=attempts_used,json=attemptsUsed,proto3" json:"attempts_used,omitempty"`
	Results      []*QuizAttemptSummary  `protobuf:"bytes,2,rep,name=results,proto3" json:"results,omitempty"`
}

func (x *StudentAttemptsResponse) Reset()          { *x = StudentAttemptsResponse{} }
func (x *StudentAttemptsResponse) String() string   { return "" }
func (x *StudentAttemptsResponse) ProtoMessage()   {}
func (x *StudentAttemptsResponse) GetAttemptsUsed() int32                 { return x.AttemptsUsed }
func (x *StudentAttemptsResponse) GetResults() []*QuizAttemptSummary      { return x.Results }

// ── Edit messages ─────────────────────────────────────────────────────────────

type UpdateQuestionRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	QuestionId string `protobuf:"bytes,1,opt,name=question_id,json=questionId,proto3" json:"question_id,omitempty"`
	Text       string `protobuf:"bytes,2,opt,name=text,proto3" json:"text,omitempty"`
	Position   int32  `protobuf:"varint,3,opt,name=position,proto3" json:"position,omitempty"`
}

func (x *UpdateQuestionRequest) Reset()             { *x = UpdateQuestionRequest{} }
func (x *UpdateQuestionRequest) String() string      { return x.QuestionId }
func (x *UpdateQuestionRequest) ProtoMessage()      {}
func (x *UpdateQuestionRequest) GetQuestionId() string { return x.QuestionId }
func (x *UpdateQuestionRequest) GetText() string       { return x.Text }
func (x *UpdateQuestionRequest) GetPosition() int32    { return x.Position }

type DeleteQuestionRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	QuestionId string `protobuf:"bytes,1,opt,name=question_id,json=questionId,proto3" json:"question_id,omitempty"`
}

func (x *DeleteQuestionRequest) Reset()             { *x = DeleteQuestionRequest{} }
func (x *DeleteQuestionRequest) String() string      { return x.QuestionId }
func (x *DeleteQuestionRequest) ProtoMessage()      {}
func (x *DeleteQuestionRequest) GetQuestionId() string { return x.QuestionId }

type UpdateOptionRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	OptionId  string `protobuf:"bytes,1,opt,name=option_id,json=optionId,proto3" json:"option_id,omitempty"`
	Text      string `protobuf:"bytes,2,opt,name=text,proto3" json:"text,omitempty"`
	IsCorrect bool   `protobuf:"varint,3,opt,name=is_correct,json=isCorrect,proto3" json:"is_correct,omitempty"`
}

func (x *UpdateOptionRequest) Reset()            { *x = UpdateOptionRequest{} }
func (x *UpdateOptionRequest) String() string     { return x.OptionId }
func (x *UpdateOptionRequest) ProtoMessage()     {}
func (x *UpdateOptionRequest) GetOptionId() string  { return x.OptionId }
func (x *UpdateOptionRequest) GetText() string      { return x.Text }
func (x *UpdateOptionRequest) GetIsCorrect() bool   { return x.IsCorrect }

type DeleteOptionRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	OptionId string `protobuf:"bytes,1,opt,name=option_id,json=optionId,proto3" json:"option_id,omitempty"`
}

func (x *DeleteOptionRequest) Reset()            { *x = DeleteOptionRequest{} }
func (x *DeleteOptionRequest) String() string     { return x.OptionId }
func (x *DeleteOptionRequest) ProtoMessage()     {}
func (x *DeleteOptionRequest) GetOptionId() string { return x.OptionId }

type GetQuizAttemptsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	QuizId string `protobuf:"bytes,1,opt,name=quiz_id,json=quizId,proto3" json:"quiz_id,omitempty"`
}

func (x *GetQuizAttemptsRequest) Reset()           { *x = GetQuizAttemptsRequest{} }
func (x *GetQuizAttemptsRequest) String() string    { return x.QuizId }
func (x *GetQuizAttemptsRequest) ProtoMessage()    {}
func (x *GetQuizAttemptsRequest) GetQuizId() string { return x.QuizId }

type QuizAttemptSummary struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AttemptId   string  `protobuf:"bytes,1,opt,name=attempt_id,json=attemptId,proto3" json:"attempt_id,omitempty"`
	StudentId   string  `protobuf:"bytes,2,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	Score       int32   `protobuf:"varint,3,opt,name=score,proto3" json:"score,omitempty"`
	Total       int32   `protobuf:"varint,4,opt,name=total,proto3" json:"total,omitempty"`
	Percentage  float32 `protobuf:"fixed32,5,opt,name=percentage,proto3" json:"percentage,omitempty"`
	StartedAt   string  `protobuf:"bytes,6,opt,name=started_at,json=startedAt,proto3" json:"started_at,omitempty"`
	CompletedAt string  `protobuf:"bytes,7,opt,name=completed_at,json=completedAt,proto3" json:"completed_at,omitempty"`
}

func (x *QuizAttemptSummary) Reset()                { *x = QuizAttemptSummary{} }
func (x *QuizAttemptSummary) String() string         { return x.AttemptId }
func (x *QuizAttemptSummary) ProtoMessage()          {}
func (x *QuizAttemptSummary) GetAttemptId() string   { return x.AttemptId }
func (x *QuizAttemptSummary) GetStudentId() string   { return x.StudentId }
func (x *QuizAttemptSummary) GetScore() int32        { return x.Score }
func (x *QuizAttemptSummary) GetTotal() int32        { return x.Total }
func (x *QuizAttemptSummary) GetPercentage() float32 { return x.Percentage }
func (x *QuizAttemptSummary) GetStartedAt() string   { return x.StartedAt }
func (x *QuizAttemptSummary) GetCompletedAt() string { return x.CompletedAt }

type QuizAttemptsListResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Attempts []*QuizAttemptSummary `protobuf:"bytes,1,rep,name=attempts,proto3" json:"attempts,omitempty"`
}

func (x *QuizAttemptsListResponse) Reset()                       { *x = QuizAttemptsListResponse{} }
func (x *QuizAttemptsListResponse) String() string               { return "" }
func (x *QuizAttemptsListResponse) ProtoMessage()               {}
func (x *QuizAttemptsListResponse) GetAttempts() []*QuizAttemptSummary { return x.Attempts }

// ── Server interface ──────────────────────────────────────────────────────────

type QuizServiceServer interface {
	CreateQuiz(context.Context, *CreateQuizRequest) (*QuizResponse, error)
	AddQuestion(context.Context, *AddQuestionRequest) (*QuestionResponse, error)
	AddOption(context.Context, *AddOptionRequest) (*OptionResponse, error)
	DeleteQuiz(context.Context, *DeleteQuizRequest) (*Empty, error)
	GetCourseQuizzes(context.Context, *GetCourseQuizzesRequest) (*QuizzesList, error)
	GetQuizForAttempt(context.Context, *GetQuizForAttemptRequest) (*QuizForAttemptResponse, error)
	StartAttempt(context.Context, *StartAttemptRequest) (*AttemptResponse, error)
	SubmitAttempt(context.Context, *SubmitAttemptRequest) (*AttemptResultResponse, error)
	GetAttemptResult(context.Context, *GetAttemptResultRequest) (*AttemptResultResponse, error)
	UpdateQuizSettings(context.Context, *UpdateQuizSettingsRequest) (*QuizResponse, error)
	GetStudentAttempts(context.Context, *GetStudentAttemptsRequest) (*StudentAttemptsResponse, error)
	UpdateQuestion(context.Context, *UpdateQuestionRequest) (*QuestionResponse, error)
	DeleteQuestion(context.Context, *DeleteQuestionRequest) (*Empty, error)
	UpdateOption(context.Context, *UpdateOptionRequest) (*OptionResponse, error)
	DeleteOption(context.Context, *DeleteOptionRequest) (*Empty, error)
	GetQuizAttempts(context.Context, *GetQuizAttemptsRequest) (*QuizAttemptsListResponse, error)
	mustEmbedUnimplementedQuizServiceServer()
}

type UnimplementedQuizServiceServer struct{}

func (UnimplementedQuizServiceServer) CreateQuiz(context.Context, *CreateQuizRequest) (*QuizResponse, error)                         { return nil, nil }
func (UnimplementedQuizServiceServer) AddQuestion(context.Context, *AddQuestionRequest) (*QuestionResponse, error)                    { return nil, nil }
func (UnimplementedQuizServiceServer) AddOption(context.Context, *AddOptionRequest) (*OptionResponse, error)                          { return nil, nil }
func (UnimplementedQuizServiceServer) DeleteQuiz(context.Context, *DeleteQuizRequest) (*Empty, error)                                 { return nil, nil }
func (UnimplementedQuizServiceServer) GetCourseQuizzes(context.Context, *GetCourseQuizzesRequest) (*QuizzesList, error)               { return nil, nil }
func (UnimplementedQuizServiceServer) GetQuizForAttempt(context.Context, *GetQuizForAttemptRequest) (*QuizForAttemptResponse, error)  { return nil, nil }
func (UnimplementedQuizServiceServer) StartAttempt(context.Context, *StartAttemptRequest) (*AttemptResponse, error)                   { return nil, nil }
func (UnimplementedQuizServiceServer) SubmitAttempt(context.Context, *SubmitAttemptRequest) (*AttemptResultResponse, error)           { return nil, nil }
func (UnimplementedQuizServiceServer) GetAttemptResult(context.Context, *GetAttemptResultRequest) (*AttemptResultResponse, error)     { return nil, nil }
func (UnimplementedQuizServiceServer) UpdateQuizSettings(context.Context, *UpdateQuizSettingsRequest) (*QuizResponse, error)          { return nil, nil }
func (UnimplementedQuizServiceServer) GetStudentAttempts(context.Context, *GetStudentAttemptsRequest) (*StudentAttemptsResponse, error) { return nil, nil }
func (UnimplementedQuizServiceServer) UpdateQuestion(context.Context, *UpdateQuestionRequest) (*QuestionResponse, error)              { return nil, nil }
func (UnimplementedQuizServiceServer) DeleteQuestion(context.Context, *DeleteQuestionRequest) (*Empty, error)                         { return nil, nil }
func (UnimplementedQuizServiceServer) UpdateOption(context.Context, *UpdateOptionRequest) (*OptionResponse, error)                    { return nil, nil }
func (UnimplementedQuizServiceServer) DeleteOption(context.Context, *DeleteOptionRequest) (*Empty, error)                             { return nil, nil }
func (UnimplementedQuizServiceServer) GetQuizAttempts(context.Context, *GetQuizAttemptsRequest) (*QuizAttemptsListResponse, error)    { return nil, nil }
func (UnimplementedQuizServiceServer) mustEmbedUnimplementedQuizServiceServer()                                                       {}

// ── Registration ──────────────────────────────────────────────────────────────

func RegisterQuizServiceServer(s grpc.ServiceRegistrar, srv QuizServiceServer) {
	s.RegisterService(&QuizService_ServiceDesc, srv)
}

var QuizService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "quiz.QuizService",
	HandlerType: (*QuizServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "CreateQuiz",        Handler: _QuizService_CreateQuiz_Handler},
		{MethodName: "AddQuestion",       Handler: _QuizService_AddQuestion_Handler},
		{MethodName: "AddOption",         Handler: _QuizService_AddOption_Handler},
		{MethodName: "DeleteQuiz",        Handler: _QuizService_DeleteQuiz_Handler},
		{MethodName: "GetCourseQuizzes",  Handler: _QuizService_GetCourseQuizzes_Handler},
		{MethodName: "GetQuizForAttempt", Handler: _QuizService_GetQuizForAttempt_Handler},
		{MethodName: "StartAttempt",      Handler: _QuizService_StartAttempt_Handler},
		{MethodName: "SubmitAttempt",     Handler: _QuizService_SubmitAttempt_Handler},
		{MethodName: "GetAttemptResult",  Handler: _QuizService_GetAttemptResult_Handler},
		{MethodName: "UpdateQuizSettings",Handler: _QuizService_UpdateQuizSettings_Handler},
		{MethodName: "GetStudentAttempts",Handler: _QuizService_GetStudentAttempts_Handler},
		{MethodName: "UpdateQuestion",    Handler: _QuizService_UpdateQuestion_Handler},
		{MethodName: "DeleteQuestion",    Handler: _QuizService_DeleteQuestion_Handler},
		{MethodName: "UpdateOption",      Handler: _QuizService_UpdateOption_Handler},
		{MethodName: "DeleteOption",      Handler: _QuizService_DeleteOption_Handler},
		{MethodName: "GetQuizAttempts",   Handler: _QuizService_GetQuizAttempts_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "quiz.proto",
}

func _QuizService_CreateQuiz_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CreateQuizRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).CreateQuiz(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/CreateQuiz"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).CreateQuiz(ctx, req.(*CreateQuizRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _QuizService_AddQuestion_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(AddQuestionRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).AddQuestion(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/AddQuestion"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).AddQuestion(ctx, req.(*AddQuestionRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _QuizService_AddOption_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(AddOptionRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).AddOption(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/AddOption"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).AddOption(ctx, req.(*AddOptionRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _QuizService_DeleteQuiz_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(DeleteQuizRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).DeleteQuiz(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/DeleteQuiz"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).DeleteQuiz(ctx, req.(*DeleteQuizRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _QuizService_GetCourseQuizzes_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetCourseQuizzesRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).GetCourseQuizzes(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/GetCourseQuizzes"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).GetCourseQuizzes(ctx, req.(*GetCourseQuizzesRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _QuizService_GetQuizForAttempt_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetQuizForAttemptRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).GetQuizForAttempt(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/GetQuizForAttempt"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).GetQuizForAttempt(ctx, req.(*GetQuizForAttemptRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _QuizService_StartAttempt_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(StartAttemptRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).StartAttempt(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/StartAttempt"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).StartAttempt(ctx, req.(*StartAttemptRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _QuizService_SubmitAttempt_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(SubmitAttemptRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).SubmitAttempt(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/SubmitAttempt"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).SubmitAttempt(ctx, req.(*SubmitAttemptRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _QuizService_GetAttemptResult_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetAttemptResultRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).GetAttemptResult(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/GetAttemptResult"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).GetAttemptResult(ctx, req.(*GetAttemptResultRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _QuizService_UpdateQuizSettings_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateQuizSettingsRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).UpdateQuizSettings(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/UpdateQuizSettings"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).UpdateQuizSettings(ctx, req.(*UpdateQuizSettingsRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _QuizService_GetStudentAttempts_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetStudentAttemptsRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).GetStudentAttempts(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/GetStudentAttempts"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).GetStudentAttempts(ctx, req.(*GetStudentAttemptsRequest)) }
	return interceptor(ctx, in, info, handler)
}

// ── Client ────────────────────────────────────────────────────────────────────

type QuizServiceClient interface {
	CreateQuiz(ctx context.Context, in *CreateQuizRequest, opts ...grpc.CallOption) (*QuizResponse, error)
	AddQuestion(ctx context.Context, in *AddQuestionRequest, opts ...grpc.CallOption) (*QuestionResponse, error)
	AddOption(ctx context.Context, in *AddOptionRequest, opts ...grpc.CallOption) (*OptionResponse, error)
	DeleteQuiz(ctx context.Context, in *DeleteQuizRequest, opts ...grpc.CallOption) (*Empty, error)
	GetCourseQuizzes(ctx context.Context, in *GetCourseQuizzesRequest, opts ...grpc.CallOption) (*QuizzesList, error)
	GetQuizForAttempt(ctx context.Context, in *GetQuizForAttemptRequest, opts ...grpc.CallOption) (*QuizForAttemptResponse, error)
	StartAttempt(ctx context.Context, in *StartAttemptRequest, opts ...grpc.CallOption) (*AttemptResponse, error)
	SubmitAttempt(ctx context.Context, in *SubmitAttemptRequest, opts ...grpc.CallOption) (*AttemptResultResponse, error)
	GetAttemptResult(ctx context.Context, in *GetAttemptResultRequest, opts ...grpc.CallOption) (*AttemptResultResponse, error)
	UpdateQuizSettings(ctx context.Context, in *UpdateQuizSettingsRequest, opts ...grpc.CallOption) (*QuizResponse, error)
	GetStudentAttempts(ctx context.Context, in *GetStudentAttemptsRequest, opts ...grpc.CallOption) (*StudentAttemptsResponse, error)
	UpdateQuestion(ctx context.Context, in *UpdateQuestionRequest, opts ...grpc.CallOption) (*QuestionResponse, error)
	DeleteQuestion(ctx context.Context, in *DeleteQuestionRequest, opts ...grpc.CallOption) (*Empty, error)
	UpdateOption(ctx context.Context, in *UpdateOptionRequest, opts ...grpc.CallOption) (*OptionResponse, error)
	DeleteOption(ctx context.Context, in *DeleteOptionRequest, opts ...grpc.CallOption) (*Empty, error)
	GetQuizAttempts(ctx context.Context, in *GetQuizAttemptsRequest, opts ...grpc.CallOption) (*QuizAttemptsListResponse, error)
}

type quizServiceClient struct{ cc grpc.ClientConnInterface }

func NewQuizServiceClient(cc grpc.ClientConnInterface) QuizServiceClient { return &quizServiceClient{cc} }

func (c *quizServiceClient) CreateQuiz(ctx context.Context, in *CreateQuizRequest, opts ...grpc.CallOption) (*QuizResponse, error) {
	out := new(QuizResponse); err := c.cc.Invoke(ctx, "/quiz.QuizService/CreateQuiz", in, out, opts...); return out, err
}
func (c *quizServiceClient) AddQuestion(ctx context.Context, in *AddQuestionRequest, opts ...grpc.CallOption) (*QuestionResponse, error) {
	out := new(QuestionResponse); err := c.cc.Invoke(ctx, "/quiz.QuizService/AddQuestion", in, out, opts...); return out, err
}
func (c *quizServiceClient) AddOption(ctx context.Context, in *AddOptionRequest, opts ...grpc.CallOption) (*OptionResponse, error) {
	out := new(OptionResponse); err := c.cc.Invoke(ctx, "/quiz.QuizService/AddOption", in, out, opts...); return out, err
}
func (c *quizServiceClient) DeleteQuiz(ctx context.Context, in *DeleteQuizRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty); err := c.cc.Invoke(ctx, "/quiz.QuizService/DeleteQuiz", in, out, opts...); return out, err
}
func (c *quizServiceClient) GetCourseQuizzes(ctx context.Context, in *GetCourseQuizzesRequest, opts ...grpc.CallOption) (*QuizzesList, error) {
	out := new(QuizzesList); err := c.cc.Invoke(ctx, "/quiz.QuizService/GetCourseQuizzes", in, out, opts...); return out, err
}
func (c *quizServiceClient) GetQuizForAttempt(ctx context.Context, in *GetQuizForAttemptRequest, opts ...grpc.CallOption) (*QuizForAttemptResponse, error) {
	out := new(QuizForAttemptResponse); err := c.cc.Invoke(ctx, "/quiz.QuizService/GetQuizForAttempt", in, out, opts...); return out, err
}
func (c *quizServiceClient) StartAttempt(ctx context.Context, in *StartAttemptRequest, opts ...grpc.CallOption) (*AttemptResponse, error) {
	out := new(AttemptResponse); err := c.cc.Invoke(ctx, "/quiz.QuizService/StartAttempt", in, out, opts...); return out, err
}
func (c *quizServiceClient) SubmitAttempt(ctx context.Context, in *SubmitAttemptRequest, opts ...grpc.CallOption) (*AttemptResultResponse, error) {
	out := new(AttemptResultResponse); err := c.cc.Invoke(ctx, "/quiz.QuizService/SubmitAttempt", in, out, opts...); return out, err
}
func (c *quizServiceClient) GetAttemptResult(ctx context.Context, in *GetAttemptResultRequest, opts ...grpc.CallOption) (*AttemptResultResponse, error) {
	out := new(AttemptResultResponse); err := c.cc.Invoke(ctx, "/quiz.QuizService/GetAttemptResult", in, out, opts...); return out, err
}
func (c *quizServiceClient) UpdateQuizSettings(ctx context.Context, in *UpdateQuizSettingsRequest, opts ...grpc.CallOption) (*QuizResponse, error) {
	out := new(QuizResponse); err := c.cc.Invoke(ctx, "/quiz.QuizService/UpdateQuizSettings", in, out, opts...); return out, err
}
func (c *quizServiceClient) GetStudentAttempts(ctx context.Context, in *GetStudentAttemptsRequest, opts ...grpc.CallOption) (*StudentAttemptsResponse, error) {
	out := new(StudentAttemptsResponse); err := c.cc.Invoke(ctx, "/quiz.QuizService/GetStudentAttempts", in, out, opts...); return out, err
}
func (c *quizServiceClient) UpdateQuestion(ctx context.Context, in *UpdateQuestionRequest, opts ...grpc.CallOption) (*QuestionResponse, error) {
	out := new(QuestionResponse); err := c.cc.Invoke(ctx, "/quiz.QuizService/UpdateQuestion", in, out, opts...); return out, err
}
func (c *quizServiceClient) DeleteQuestion(ctx context.Context, in *DeleteQuestionRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty); err := c.cc.Invoke(ctx, "/quiz.QuizService/DeleteQuestion", in, out, opts...); return out, err
}
func (c *quizServiceClient) UpdateOption(ctx context.Context, in *UpdateOptionRequest, opts ...grpc.CallOption) (*OptionResponse, error) {
	out := new(OptionResponse); err := c.cc.Invoke(ctx, "/quiz.QuizService/UpdateOption", in, out, opts...); return out, err
}
func (c *quizServiceClient) DeleteOption(ctx context.Context, in *DeleteOptionRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty); err := c.cc.Invoke(ctx, "/quiz.QuizService/DeleteOption", in, out, opts...); return out, err
}
func (c *quizServiceClient) GetQuizAttempts(ctx context.Context, in *GetQuizAttemptsRequest, opts ...grpc.CallOption) (*QuizAttemptsListResponse, error) {
	out := new(QuizAttemptsListResponse); err := c.cc.Invoke(ctx, "/quiz.QuizService/GetQuizAttempts", in, out, opts...); return out, err
}

func _QuizService_UpdateQuestion_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateQuestionRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).UpdateQuestion(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/UpdateQuestion"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).UpdateQuestion(ctx, req.(*UpdateQuestionRequest)) }
	return interceptor(ctx, in, info, handler)
}
func _QuizService_DeleteQuestion_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(DeleteQuestionRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).DeleteQuestion(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/DeleteQuestion"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).DeleteQuestion(ctx, req.(*DeleteQuestionRequest)) }
	return interceptor(ctx, in, info, handler)
}
func _QuizService_UpdateOption_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateOptionRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).UpdateOption(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/UpdateOption"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).UpdateOption(ctx, req.(*UpdateOptionRequest)) }
	return interceptor(ctx, in, info, handler)
}
func _QuizService_DeleteOption_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(DeleteOptionRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).DeleteOption(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/DeleteOption"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).DeleteOption(ctx, req.(*DeleteOptionRequest)) }
	return interceptor(ctx, in, info, handler)
}
func _QuizService_GetQuizAttempts_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetQuizAttemptsRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(QuizServiceServer).GetQuizAttempts(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/quiz.QuizService/GetQuizAttempts"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(QuizServiceServer).GetQuizAttempts(ctx, req.(*GetQuizAttemptsRequest)) }
	return interceptor(ctx, in, info, handler)
}
