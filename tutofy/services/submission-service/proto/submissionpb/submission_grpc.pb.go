package submissionpb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

// ── Messages ──────────────────────────────────────────────────────────────────

type SubmitAssignmentRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AssignmentId string `protobuf:"bytes,1,opt,name=assignment_id,json=assignmentId,proto3" json:"assignment_id,omitempty"`
	Content      string `protobuf:"bytes,2,opt,name=content,proto3" json:"content,omitempty"`
	FileId       string `protobuf:"bytes,3,opt,name=file_id,json=fileId,proto3" json:"file_id,omitempty"`
}

func (x *SubmitAssignmentRequest) Reset()                { *x = SubmitAssignmentRequest{} }
func (x *SubmitAssignmentRequest) String() string         { return x.AssignmentId }
func (x *SubmitAssignmentRequest) ProtoMessage()         {}
func (x *SubmitAssignmentRequest) GetAssignmentId() string { return x.AssignmentId }
func (x *SubmitAssignmentRequest) GetContent() string      { return x.Content }
func (x *SubmitAssignmentRequest) GetFileId() string       { return x.FileId }

type GetSubmissionRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AssignmentId string `protobuf:"bytes,1,opt,name=assignment_id,json=assignmentId,proto3" json:"assignment_id,omitempty"`
	StudentId    string `protobuf:"bytes,2,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
}

func (x *GetSubmissionRequest) Reset()                { *x = GetSubmissionRequest{} }
func (x *GetSubmissionRequest) String() string         { return x.AssignmentId }
func (x *GetSubmissionRequest) ProtoMessage()         {}
func (x *GetSubmissionRequest) GetAssignmentId() string { return x.AssignmentId }
func (x *GetSubmissionRequest) GetStudentId() string    { return x.StudentId }

type GetAssignmentSubmissionsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AssignmentId string `protobuf:"bytes,1,opt,name=assignment_id,json=assignmentId,proto3" json:"assignment_id,omitempty"`
	Limit        int32  `protobuf:"varint,2,opt,name=limit,proto3" json:"limit,omitempty"`
	Offset       int32  `protobuf:"varint,3,opt,name=offset,proto3" json:"offset,omitempty"`
}

func (x *GetAssignmentSubmissionsRequest) Reset()                { *x = GetAssignmentSubmissionsRequest{} }
func (x *GetAssignmentSubmissionsRequest) String() string         { return x.AssignmentId }
func (x *GetAssignmentSubmissionsRequest) ProtoMessage()         {}
func (x *GetAssignmentSubmissionsRequest) GetAssignmentId() string { return x.AssignmentId }
func (x *GetAssignmentSubmissionsRequest) GetLimit() int32         { return x.Limit }
func (x *GetAssignmentSubmissionsRequest) GetOffset() int32        { return x.Offset }

type MarkGradedRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AssignmentId string `protobuf:"bytes,1,opt,name=assignment_id,json=assignmentId,proto3" json:"assignment_id,omitempty"`
	StudentId    string `protobuf:"bytes,2,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
}

func (x *MarkGradedRequest) Reset()                { *x = MarkGradedRequest{} }
func (x *MarkGradedRequest) String() string         { return x.AssignmentId }
func (x *MarkGradedRequest) ProtoMessage()         {}
func (x *MarkGradedRequest) GetAssignmentId() string { return x.AssignmentId }
func (x *MarkGradedRequest) GetStudentId() string    { return x.StudentId }

type SubmissionResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id           string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	AssignmentId string `protobuf:"bytes,2,opt,name=assignment_id,json=assignmentId,proto3" json:"assignment_id,omitempty"`
	StudentId    string `protobuf:"bytes,3,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	Content      string `protobuf:"bytes,4,opt,name=content,proto3" json:"content,omitempty"`
	FileId       string `protobuf:"bytes,5,opt,name=file_id,json=fileId,proto3" json:"file_id,omitempty"`
	Status       string `protobuf:"bytes,6,opt,name=status,proto3" json:"status,omitempty"`
	SubmittedAt  string `protobuf:"bytes,7,opt,name=submitted_at,json=submittedAt,proto3" json:"submitted_at,omitempty"`
}

func (x *SubmissionResponse) Reset()                { *x = SubmissionResponse{} }
func (x *SubmissionResponse) String() string         { return x.Id }
func (x *SubmissionResponse) ProtoMessage()         {}
func (x *SubmissionResponse) GetId() string           { return x.Id }
func (x *SubmissionResponse) GetAssignmentId() string { return x.AssignmentId }
func (x *SubmissionResponse) GetStudentId() string    { return x.StudentId }
func (x *SubmissionResponse) GetContent() string      { return x.Content }
func (x *SubmissionResponse) GetFileId() string       { return x.FileId }
func (x *SubmissionResponse) GetStatus() string       { return x.Status }
func (x *SubmissionResponse) GetSubmittedAt() string  { return x.SubmittedAt }

type SubmissionsList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Submissions []*SubmissionResponse `protobuf:"bytes,1,rep,name=submissions,proto3" json:"submissions,omitempty"`
}

func (x *SubmissionsList) Reset()          { *x = SubmissionsList{} }
func (x *SubmissionsList) String() string   { return "" }
func (x *SubmissionsList) ProtoMessage()   {}
func (x *SubmissionsList) GetSubmissions() []*SubmissionResponse { return x.Submissions }

// ── Server interface ──────────────────────────────────────────────────────────

type SubmissionServiceServer interface {
	SubmitAssignment(context.Context, *SubmitAssignmentRequest) (*SubmissionResponse, error)
	GetSubmission(context.Context, *GetSubmissionRequest) (*SubmissionResponse, error)
	GetAssignmentSubmissions(context.Context, *GetAssignmentSubmissionsRequest) (*SubmissionsList, error)
	MarkGraded(context.Context, *MarkGradedRequest) (*SubmissionResponse, error)
	mustEmbedUnimplementedSubmissionServiceServer()
}

type UnimplementedSubmissionServiceServer struct{}

func (UnimplementedSubmissionServiceServer) SubmitAssignment(context.Context, *SubmitAssignmentRequest) (*SubmissionResponse, error) {
	return nil, nil
}
func (UnimplementedSubmissionServiceServer) GetSubmission(context.Context, *GetSubmissionRequest) (*SubmissionResponse, error) {
	return nil, nil
}
func (UnimplementedSubmissionServiceServer) GetAssignmentSubmissions(context.Context, *GetAssignmentSubmissionsRequest) (*SubmissionsList, error) {
	return nil, nil
}
func (UnimplementedSubmissionServiceServer) MarkGraded(context.Context, *MarkGradedRequest) (*SubmissionResponse, error) {
	return nil, nil
}
func (UnimplementedSubmissionServiceServer) mustEmbedUnimplementedSubmissionServiceServer() {}

// ── Registration ──────────────────────────────────────────────────────────────

func RegisterSubmissionServiceServer(s grpc.ServiceRegistrar, srv SubmissionServiceServer) {
	s.RegisterService(&SubmissionService_ServiceDesc, srv)
}

var SubmissionService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "submission.SubmissionService",
	HandlerType: (*SubmissionServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "SubmitAssignment", Handler: _SubmissionService_SubmitAssignment_Handler},
		{MethodName: "GetSubmission", Handler: _SubmissionService_GetSubmission_Handler},
		{MethodName: "GetAssignmentSubmissions", Handler: _SubmissionService_GetAssignmentSubmissions_Handler},
		{MethodName: "MarkGraded", Handler: _SubmissionService_MarkGraded_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "submission.proto",
}

func _SubmissionService_SubmitAssignment_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(SubmitAssignmentRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SubmissionServiceServer).SubmitAssignment(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/submission.SubmissionService/SubmitAssignment"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SubmissionServiceServer).SubmitAssignment(ctx, req.(*SubmitAssignmentRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SubmissionService_GetSubmission_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetSubmissionRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SubmissionServiceServer).GetSubmission(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/submission.SubmissionService/GetSubmission"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SubmissionServiceServer).GetSubmission(ctx, req.(*GetSubmissionRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SubmissionService_GetAssignmentSubmissions_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetAssignmentSubmissionsRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SubmissionServiceServer).GetAssignmentSubmissions(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/submission.SubmissionService/GetAssignmentSubmissions"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SubmissionServiceServer).GetAssignmentSubmissions(ctx, req.(*GetAssignmentSubmissionsRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SubmissionService_MarkGraded_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(MarkGradedRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SubmissionServiceServer).MarkGraded(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/submission.SubmissionService/MarkGraded"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SubmissionServiceServer).MarkGraded(ctx, req.(*MarkGradedRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// ── Client interface ──────────────────────────────────────────────────────────

type SubmissionServiceClient interface {
	SubmitAssignment(ctx context.Context, in *SubmitAssignmentRequest, opts ...grpc.CallOption) (*SubmissionResponse, error)
	GetSubmission(ctx context.Context, in *GetSubmissionRequest, opts ...grpc.CallOption) (*SubmissionResponse, error)
	GetAssignmentSubmissions(ctx context.Context, in *GetAssignmentSubmissionsRequest, opts ...grpc.CallOption) (*SubmissionsList, error)
	MarkGraded(ctx context.Context, in *MarkGradedRequest, opts ...grpc.CallOption) (*SubmissionResponse, error)
}

type submissionServiceClient struct{ cc grpc.ClientConnInterface }

func NewSubmissionServiceClient(cc grpc.ClientConnInterface) SubmissionServiceClient {
	return &submissionServiceClient{cc}
}

func (c *submissionServiceClient) SubmitAssignment(ctx context.Context, in *SubmitAssignmentRequest, opts ...grpc.CallOption) (*SubmissionResponse, error) {
	out := new(SubmissionResponse)
	err := c.cc.Invoke(ctx, "/submission.SubmissionService/SubmitAssignment", in, out, opts...)
	return out, err
}

func (c *submissionServiceClient) GetSubmission(ctx context.Context, in *GetSubmissionRequest, opts ...grpc.CallOption) (*SubmissionResponse, error) {
	out := new(SubmissionResponse)
	err := c.cc.Invoke(ctx, "/submission.SubmissionService/GetSubmission", in, out, opts...)
	return out, err
}

func (c *submissionServiceClient) GetAssignmentSubmissions(ctx context.Context, in *GetAssignmentSubmissionsRequest, opts ...grpc.CallOption) (*SubmissionsList, error) {
	out := new(SubmissionsList)
	err := c.cc.Invoke(ctx, "/submission.SubmissionService/GetAssignmentSubmissions", in, out, opts...)
	return out, err
}

func (c *submissionServiceClient) MarkGraded(ctx context.Context, in *MarkGradedRequest, opts ...grpc.CallOption) (*SubmissionResponse, error) {
	out := new(SubmissionResponse)
	err := c.cc.Invoke(ctx, "/submission.SubmissionService/MarkGraded", in, out, opts...)
	return out, err
}
