package lessonpb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/runtime/protoimpl"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// BookIndividualLessonRequest is used to book a 1-on-1 lesson with a tutor.
// Replaces the course_id==empty hack in CreateLessonRequest.
type BookIndividualLessonRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	TutorId         string                 `protobuf:"bytes,1,opt,name=tutor_id,json=tutorId,proto3" json:"tutor_id,omitempty"`
	Title           string                 `protobuf:"bytes,2,opt,name=title,proto3" json:"title,omitempty"`
	ScheduledAt     *timestamppb.Timestamp `protobuf:"bytes,3,opt,name=scheduled_at,json=scheduledAt,proto3" json:"scheduled_at,omitempty"`
	DurationMinutes int32                  `protobuf:"varint,4,opt,name=duration_minutes,json=durationMinutes,proto3" json:"duration_minutes,omitempty"`
	Price           float64                `protobuf:"fixed64,5,opt,name=price,proto3" json:"price,omitempty"`
}

func (x *BookIndividualLessonRequest) Reset()                       { *x = BookIndividualLessonRequest{} }
func (x *BookIndividualLessonRequest) String() string               { return x.TutorId }
func (x *BookIndividualLessonRequest) ProtoMessage()                {}
func (x *BookIndividualLessonRequest) GetTutorId() string           { return x.TutorId }
func (x *BookIndividualLessonRequest) GetTitle() string             { return x.Title }
func (x *BookIndividualLessonRequest) GetScheduledAt() *timestamppb.Timestamp { return x.ScheduledAt }
func (x *BookIndividualLessonRequest) GetDurationMinutes() int32    { return x.DurationMinutes }
func (x *BookIndividualLessonRequest) GetPrice() float64            { return x.Price }

// ConfirmLessonRequest is sent by a tutor to accept a pending individual lesson booking.
type ConfirmLessonRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	LessonId string `protobuf:"bytes,1,opt,name=lesson_id,json=lessonId,proto3" json:"lesson_id,omitempty"`
}

func (x *ConfirmLessonRequest) Reset()              { *x = ConfirmLessonRequest{} }
func (x *ConfirmLessonRequest) String() string      { return x.LessonId }
func (x *ConfirmLessonRequest) ProtoMessage()       {}
func (x *ConfirmLessonRequest) GetLessonId() string { return x.LessonId }

// DeclineLessonRequest is sent by a tutor to reject a pending individual lesson booking.
type DeclineLessonRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	LessonId string `protobuf:"bytes,1,opt,name=lesson_id,json=lessonId,proto3" json:"lesson_id,omitempty"`
}

func (x *DeclineLessonRequest) Reset()              { *x = DeclineLessonRequest{} }
func (x *DeclineLessonRequest) String() string      { return x.LessonId }
func (x *DeclineLessonRequest) ProtoMessage()       {}
func (x *DeclineLessonRequest) GetLessonId() string { return x.LessonId }

// ActivateLessonRequest transitions a lesson from AWAITING_PAYMENT → PLANNED
// after the student's payment is confirmed.
type ActivateLessonRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	LessonId string `protobuf:"bytes,1,opt,name=lesson_id,json=lessonId,proto3" json:"lesson_id,omitempty"`
}

func (x *ActivateLessonRequest) Reset()              { *x = ActivateLessonRequest{} }
func (x *ActivateLessonRequest) String() string      { return x.LessonId }
func (x *ActivateLessonRequest) ProtoMessage()       {}
func (x *ActivateLessonRequest) GetLessonId() string { return x.LessonId }

// ── Client-side method implementations ───────────────────────────────────────

func (c *lessonServiceClient) BookIndividualLesson(ctx context.Context, in *BookIndividualLessonRequest, opts ...grpc.CallOption) (*Lesson, error) {
	out := new(Lesson)
	err := c.cc.Invoke(ctx, "/lesson.LessonService/BookIndividualLesson", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *lessonServiceClient) ConfirmLesson(ctx context.Context, in *ConfirmLessonRequest, opts ...grpc.CallOption) (*Lesson, error) {
	out := new(Lesson)
	err := c.cc.Invoke(ctx, "/lesson.LessonService/ConfirmLesson", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *lessonServiceClient) DeclineLesson(ctx context.Context, in *DeclineLessonRequest, opts ...grpc.CallOption) (*Lesson, error) {
	out := new(Lesson)
	err := c.cc.Invoke(ctx, "/lesson.LessonService/DeclineLesson", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *lessonServiceClient) ActivateLesson(ctx context.Context, in *ActivateLessonRequest, opts ...grpc.CallOption) (*Lesson, error) {
	out := new(Lesson)
	err := c.cc.Invoke(ctx, "/lesson.LessonService/ActivateLesson", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// ── Server-side interface additions ──────────────────────────────────────────

func (UnimplementedLessonServiceServer) BookIndividualLesson(context.Context, *BookIndividualLessonRequest) (*Lesson, error) {
	return nil, status.Errorf(codes.Unimplemented, "method BookIndividualLesson not implemented")
}

func (UnimplementedLessonServiceServer) ConfirmLesson(context.Context, *ConfirmLessonRequest) (*Lesson, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ConfirmLesson not implemented")
}

func (UnimplementedLessonServiceServer) DeclineLesson(context.Context, *DeclineLessonRequest) (*Lesson, error) {
	return nil, status.Errorf(codes.Unimplemented, "method DeclineLesson not implemented")
}

func (UnimplementedLessonServiceServer) ActivateLesson(context.Context, *ActivateLessonRequest) (*Lesson, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ActivateLesson not implemented")
}

// ── Server-side handlers ──────────────────────────────────────────────────────

func _LessonService_BookIndividualLesson_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(BookIndividualLessonRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(LessonServiceServer).BookIndividualLesson(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/lesson.LessonService/BookIndividualLesson"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(LessonServiceServer).BookIndividualLesson(ctx, req.(*BookIndividualLessonRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _LessonService_ConfirmLesson_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ConfirmLessonRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(LessonServiceServer).ConfirmLesson(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/lesson.LessonService/ConfirmLesson"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(LessonServiceServer).ConfirmLesson(ctx, req.(*ConfirmLessonRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _LessonService_DeclineLesson_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(DeclineLessonRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(LessonServiceServer).DeclineLesson(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/lesson.LessonService/DeclineLesson"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(LessonServiceServer).DeclineLesson(ctx, req.(*DeclineLessonRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _LessonService_ActivateLesson_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ActivateLessonRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(LessonServiceServer).ActivateLesson(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/lesson.LessonService/ActivateLesson"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(LessonServiceServer).ActivateLesson(ctx, req.(*ActivateLessonRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func init() {
	LessonService_ServiceDesc.Methods = append(LessonService_ServiceDesc.Methods,
		grpc.MethodDesc{MethodName: "BookIndividualLesson", Handler: _LessonService_BookIndividualLesson_Handler},
		grpc.MethodDesc{MethodName: "ConfirmLesson", Handler: _LessonService_ConfirmLesson_Handler},
		grpc.MethodDesc{MethodName: "DeclineLesson", Handler: _LessonService_DeclineLesson_Handler},
		grpc.MethodDesc{MethodName: "ActivateLesson", Handler: _LessonService_ActivateLesson_Handler},
	)
}
