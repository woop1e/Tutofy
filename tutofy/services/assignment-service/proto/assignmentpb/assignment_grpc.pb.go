package assignmentpb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

// ── Messages ──────────────────────────────────────────────────────────────────

type CreateAssignmentRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Title       string `protobuf:"bytes,1,opt,name=title,proto3" json:"title,omitempty"`
	Description string `protobuf:"bytes,2,opt,name=description,proto3" json:"description,omitempty"`
	CourseId    string `protobuf:"bytes,3,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *CreateAssignmentRequest) Reset()         { *x = CreateAssignmentRequest{} }
func (x *CreateAssignmentRequest) String() string  { return x.Title }
func (x *CreateAssignmentRequest) ProtoMessage()  {}
func (x *CreateAssignmentRequest) GetTitle() string       { return x.Title }
func (x *CreateAssignmentRequest) GetDescription() string { return x.Description }
func (x *CreateAssignmentRequest) GetCourseId() string    { return x.CourseId }

type CourseRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *CourseRequest) Reset()         { *x = CourseRequest{} }
func (x *CourseRequest) String() string  { return x.CourseId }
func (x *CourseRequest) ProtoMessage()  {}
func (x *CourseRequest) GetCourseId() string { return x.CourseId }

type DeleteAssignmentRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	AssignmentId string `protobuf:"bytes,1,opt,name=assignment_id,json=assignmentId,proto3" json:"assignment_id,omitempty"`
}

func (x *DeleteAssignmentRequest) Reset()         { *x = DeleteAssignmentRequest{} }
func (x *DeleteAssignmentRequest) String() string  { return x.AssignmentId }
func (x *DeleteAssignmentRequest) ProtoMessage()  {}
func (x *DeleteAssignmentRequest) GetAssignmentId() string { return x.AssignmentId }

type AssignmentResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id          string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Title       string `protobuf:"bytes,2,opt,name=title,proto3" json:"title,omitempty"`
	Description string `protobuf:"bytes,3,opt,name=description,proto3" json:"description,omitempty"`
	CourseId    string `protobuf:"bytes,4,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *AssignmentResponse) Reset()         { *x = AssignmentResponse{} }
func (x *AssignmentResponse) String() string  { return x.Id }
func (x *AssignmentResponse) ProtoMessage()  {}
func (x *AssignmentResponse) GetId() string          { return x.Id }
func (x *AssignmentResponse) GetTitle() string       { return x.Title }
func (x *AssignmentResponse) GetDescription() string { return x.Description }
func (x *AssignmentResponse) GetCourseId() string    { return x.CourseId }

type AssignmentsList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Assignments []*AssignmentResponse `protobuf:"bytes,1,rep,name=assignments,proto3" json:"assignments,omitempty"`
}

func (x *AssignmentsList) Reset()         { *x = AssignmentsList{} }
func (x *AssignmentsList) String() string  { return "" }
func (x *AssignmentsList) ProtoMessage()  {}
func (x *AssignmentsList) GetAssignments() []*AssignmentResponse { return x.Assignments }

type Empty struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *Empty) Reset()         { *x = Empty{} }
func (x *Empty) String() string  { return "" }
func (x *Empty) ProtoMessage()  {}

// ── Server interface ──────────────────────────────────────────────────────────

type AssignmentServiceServer interface {
	CreateAssignment(context.Context, *CreateAssignmentRequest) (*AssignmentResponse, error)
	GetAssignmentsByCourse(context.Context, *CourseRequest) (*AssignmentsList, error)
	DeleteAssignment(context.Context, *DeleteAssignmentRequest) (*Empty, error)
	mustEmbedUnimplementedAssignmentServiceServer()
}

type UnimplementedAssignmentServiceServer struct{}

func (UnimplementedAssignmentServiceServer) CreateAssignment(context.Context, *CreateAssignmentRequest) (*AssignmentResponse, error) {
	return nil, nil
}
func (UnimplementedAssignmentServiceServer) GetAssignmentsByCourse(context.Context, *CourseRequest) (*AssignmentsList, error) {
	return nil, nil
}
func (UnimplementedAssignmentServiceServer) DeleteAssignment(context.Context, *DeleteAssignmentRequest) (*Empty, error) {
	return nil, nil
}
func (UnimplementedAssignmentServiceServer) mustEmbedUnimplementedAssignmentServiceServer() {}

// ── Registration ──────────────────────────────────────────────────────────────

func RegisterAssignmentServiceServer(s grpc.ServiceRegistrar, srv AssignmentServiceServer) {
	s.RegisterService(&AssignmentService_ServiceDesc, srv)
}

var AssignmentService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "assignment.AssignmentService",
	HandlerType: (*AssignmentServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "CreateAssignment", Handler: _AssignmentService_CreateAssignment_Handler},
		{MethodName: "GetAssignmentsByCourse", Handler: _AssignmentService_GetAssignmentsByCourse_Handler},
		{MethodName: "DeleteAssignment", Handler: _AssignmentService_DeleteAssignment_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "assignment.proto",
}

func _AssignmentService_CreateAssignment_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CreateAssignmentRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(AssignmentServiceServer).CreateAssignment(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/assignment.AssignmentService/CreateAssignment"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(AssignmentServiceServer).CreateAssignment(ctx, req.(*CreateAssignmentRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _AssignmentService_GetAssignmentsByCourse_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CourseRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(AssignmentServiceServer).GetAssignmentsByCourse(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/assignment.AssignmentService/GetAssignmentsByCourse"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(AssignmentServiceServer).GetAssignmentsByCourse(ctx, req.(*CourseRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _AssignmentService_DeleteAssignment_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(DeleteAssignmentRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(AssignmentServiceServer).DeleteAssignment(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/assignment.AssignmentService/DeleteAssignment"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(AssignmentServiceServer).DeleteAssignment(ctx, req.(*DeleteAssignmentRequest))
	}
	return interceptor(ctx, in, info, handler)
}
