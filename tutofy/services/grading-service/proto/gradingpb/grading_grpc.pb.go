package gradingpb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

// ── Messages ──────────────────────────────────────────────────────────────────

type SubmitGradeRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AssignmentId string  `protobuf:"bytes,1,opt,name=assignment_id,json=assignmentId,proto3" json:"assignment_id,omitempty"`
	StudentId    string  `protobuf:"bytes,2,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	Grade        float32 `protobuf:"fixed32,3,opt,name=grade,proto3" json:"grade,omitempty"`
}

func (x *SubmitGradeRequest) Reset()         { *x = SubmitGradeRequest{} }
func (x *SubmitGradeRequest) String() string  { return x.AssignmentId }
func (x *SubmitGradeRequest) ProtoMessage()  {}
func (x *SubmitGradeRequest) GetAssignmentId() string { return x.AssignmentId }
func (x *SubmitGradeRequest) GetStudentId() string    { return x.StudentId }
func (x *SubmitGradeRequest) GetGrade() float32       { return x.Grade }

type StudentRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	StudentId string `protobuf:"bytes,1,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
}

func (x *StudentRequest) Reset()         { *x = StudentRequest{} }
func (x *StudentRequest) String() string  { return x.StudentId }
func (x *StudentRequest) ProtoMessage()  {}
func (x *StudentRequest) GetStudentId() string { return x.StudentId }

type AssignmentRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AssignmentId string `protobuf:"bytes,1,opt,name=assignment_id,json=assignmentId,proto3" json:"assignment_id,omitempty"`
}

func (x *AssignmentRequest) Reset()         { *x = AssignmentRequest{} }
func (x *AssignmentRequest) String() string  { return x.AssignmentId }
func (x *AssignmentRequest) ProtoMessage()  {}
func (x *AssignmentRequest) GetAssignmentId() string { return x.AssignmentId }

type GradeResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id           string  `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	AssignmentId string  `protobuf:"bytes,2,opt,name=assignment_id,json=assignmentId,proto3" json:"assignment_id,omitempty"`
	StudentId    string  `protobuf:"bytes,3,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	Grade        float32 `protobuf:"fixed32,4,opt,name=grade,proto3" json:"grade,omitempty"`
}

func (x *GradeResponse) Reset()         { *x = GradeResponse{} }
func (x *GradeResponse) String() string  { return x.Id }
func (x *GradeResponse) ProtoMessage()  {}
func (x *GradeResponse) GetId() string           { return x.Id }
func (x *GradeResponse) GetAssignmentId() string { return x.AssignmentId }
func (x *GradeResponse) GetStudentId() string    { return x.StudentId }
func (x *GradeResponse) GetGrade() float32       { return x.Grade }

type GradesList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Grades []*GradeResponse `protobuf:"bytes,1,rep,name=grades,proto3" json:"grades,omitempty"`
}

func (x *GradesList) Reset()         { *x = GradesList{} }
func (x *GradesList) String() string  { return "" }
func (x *GradesList) ProtoMessage()  {}
func (x *GradesList) GetGrades() []*GradeResponse { return x.Grades }

type Empty struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *Empty) Reset()         { *x = Empty{} }
func (x *Empty) String() string  { return "" }
func (x *Empty) ProtoMessage()  {}

// ── Server interface ──────────────────────────────────────────────────────────

type GradingServiceServer interface {
	SubmitGrade(context.Context, *SubmitGradeRequest) (*GradeResponse, error)
	GetStudentGrades(context.Context, *StudentRequest) (*GradesList, error)
	GetAssignmentGrades(context.Context, *AssignmentRequest) (*GradesList, error)
	mustEmbedUnimplementedGradingServiceServer()
}

type UnimplementedGradingServiceServer struct{}

func (UnimplementedGradingServiceServer) SubmitGrade(context.Context, *SubmitGradeRequest) (*GradeResponse, error) {
	return nil, nil
}
func (UnimplementedGradingServiceServer) GetStudentGrades(context.Context, *StudentRequest) (*GradesList, error) {
	return nil, nil
}
func (UnimplementedGradingServiceServer) GetAssignmentGrades(context.Context, *AssignmentRequest) (*GradesList, error) {
	return nil, nil
}
func (UnimplementedGradingServiceServer) mustEmbedUnimplementedGradingServiceServer() {}

// ── Registration ──────────────────────────────────────────────────────────────

func RegisterGradingServiceServer(s grpc.ServiceRegistrar, srv GradingServiceServer) {
	s.RegisterService(&GradingService_ServiceDesc, srv)
}

var GradingService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "grading.GradingService",
	HandlerType: (*GradingServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "SubmitGrade", Handler: _GradingService_SubmitGrade_Handler},
		{MethodName: "GetStudentGrades", Handler: _GradingService_GetStudentGrades_Handler},
		{MethodName: "GetAssignmentGrades", Handler: _GradingService_GetAssignmentGrades_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "grading.proto",
}

func _GradingService_SubmitGrade_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(SubmitGradeRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(GradingServiceServer).SubmitGrade(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/grading.GradingService/SubmitGrade"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(GradingServiceServer).SubmitGrade(ctx, req.(*SubmitGradeRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _GradingService_GetStudentGrades_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(StudentRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(GradingServiceServer).GetStudentGrades(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/grading.GradingService/GetStudentGrades"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(GradingServiceServer).GetStudentGrades(ctx, req.(*StudentRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _GradingService_GetAssignmentGrades_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(AssignmentRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(GradingServiceServer).GetAssignmentGrades(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/grading.GradingService/GetAssignmentGrades"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(GradingServiceServer).GetAssignmentGrades(ctx, req.(*AssignmentRequest))
	}
	return interceptor(ctx, in, info, handler)
}
