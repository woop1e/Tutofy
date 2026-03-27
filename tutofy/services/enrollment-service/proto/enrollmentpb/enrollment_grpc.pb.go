package enrollmentpb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

// ── Messages ──────────────────────────────────────────────────────────────────

type EnrollRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *EnrollRequest) Reset()         { *x = EnrollRequest{} }
func (x *EnrollRequest) String() string  { return x.CourseId }
func (x *EnrollRequest) ProtoMessage()  {}
func (x *EnrollRequest) GetCourseId() string { return x.CourseId }

type UserRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
}

func (x *UserRequest) Reset()         { *x = UserRequest{} }
func (x *UserRequest) String() string  { return x.UserId }
func (x *UserRequest) ProtoMessage()  {}
func (x *UserRequest) GetUserId() string { return x.UserId }

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

type EnrollmentResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id       string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	UserId   string `protobuf:"bytes,2,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	CourseId string `protobuf:"bytes,3,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *EnrollmentResponse) Reset()         { *x = EnrollmentResponse{} }
func (x *EnrollmentResponse) String() string  { return x.Id }
func (x *EnrollmentResponse) ProtoMessage()  {}
func (x *EnrollmentResponse) GetId() string       { return x.Id }
func (x *EnrollmentResponse) GetUserId() string   { return x.UserId }
func (x *EnrollmentResponse) GetCourseId() string { return x.CourseId }

type EnrollmentsList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Enrollments []*EnrollmentResponse `protobuf:"bytes,1,rep,name=enrollments,proto3" json:"enrollments,omitempty"`
}

func (x *EnrollmentsList) Reset()         { *x = EnrollmentsList{} }
func (x *EnrollmentsList) String() string  { return "" }
func (x *EnrollmentsList) ProtoMessage()  {}
func (x *EnrollmentsList) GetEnrollments() []*EnrollmentResponse { return x.Enrollments }

type Empty struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *Empty) Reset()         { *x = Empty{} }
func (x *Empty) String() string  { return "" }
func (x *Empty) ProtoMessage()  {}

// ── Server interface ──────────────────────────────────────────────────────────

type EnrollmentServiceServer interface {
	EnrollUser(context.Context, *EnrollRequest) (*EnrollmentResponse, error)
	GetUserEnrollments(context.Context, *UserRequest) (*EnrollmentsList, error)
	GetCourseEnrollments(context.Context, *CourseRequest) (*EnrollmentsList, error)
	mustEmbedUnimplementedEnrollmentServiceServer()
}

type UnimplementedEnrollmentServiceServer struct{}

func (UnimplementedEnrollmentServiceServer) EnrollUser(context.Context, *EnrollRequest) (*EnrollmentResponse, error) {
	return nil, nil
}
func (UnimplementedEnrollmentServiceServer) GetUserEnrollments(context.Context, *UserRequest) (*EnrollmentsList, error) {
	return nil, nil
}
func (UnimplementedEnrollmentServiceServer) GetCourseEnrollments(context.Context, *CourseRequest) (*EnrollmentsList, error) {
	return nil, nil
}
func (UnimplementedEnrollmentServiceServer) mustEmbedUnimplementedEnrollmentServiceServer() {}

// ── Registration ──────────────────────────────────────────────────────────────

func RegisterEnrollmentServiceServer(s grpc.ServiceRegistrar, srv EnrollmentServiceServer) {
	s.RegisterService(&EnrollmentService_ServiceDesc, srv)
}

var EnrollmentService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "enrollment.EnrollmentService",
	HandlerType: (*EnrollmentServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "EnrollUser", Handler: _EnrollmentService_EnrollUser_Handler},
		{MethodName: "GetUserEnrollments", Handler: _EnrollmentService_GetUserEnrollments_Handler},
		{MethodName: "GetCourseEnrollments", Handler: _EnrollmentService_GetCourseEnrollments_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "enrollment.proto",
}

func _EnrollmentService_EnrollUser_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(EnrollRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(EnrollmentServiceServer).EnrollUser(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/enrollment.EnrollmentService/EnrollUser"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(EnrollmentServiceServer).EnrollUser(ctx, req.(*EnrollRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _EnrollmentService_GetUserEnrollments_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UserRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(EnrollmentServiceServer).GetUserEnrollments(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/enrollment.EnrollmentService/GetUserEnrollments"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(EnrollmentServiceServer).GetUserEnrollments(ctx, req.(*UserRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _EnrollmentService_GetCourseEnrollments_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CourseRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(EnrollmentServiceServer).GetCourseEnrollments(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/enrollment.EnrollmentService/GetCourseEnrollments"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(EnrollmentServiceServer).GetCourseEnrollments(ctx, req.(*CourseRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// ── Client interface ──────────────────────────────────────────────────────────

type EnrollmentServiceClient interface {
	EnrollUser(ctx context.Context, in *EnrollRequest, opts ...grpc.CallOption) (*EnrollmentResponse, error)
	GetUserEnrollments(ctx context.Context, in *UserRequest, opts ...grpc.CallOption) (*EnrollmentsList, error)
	GetCourseEnrollments(ctx context.Context, in *CourseRequest, opts ...grpc.CallOption) (*EnrollmentsList, error)
}

type enrollmentServiceClient struct {
	cc grpc.ClientConnInterface
}

func NewEnrollmentServiceClient(cc grpc.ClientConnInterface) EnrollmentServiceClient {
	return &enrollmentServiceClient{cc}
}

func (c *enrollmentServiceClient) EnrollUser(ctx context.Context, in *EnrollRequest, opts ...grpc.CallOption) (*EnrollmentResponse, error) {
	out := new(EnrollmentResponse)
	err := c.cc.Invoke(ctx, "/enrollment.EnrollmentService/EnrollUser", in, out, opts...)
	return out, err
}

func (c *enrollmentServiceClient) GetUserEnrollments(ctx context.Context, in *UserRequest, opts ...grpc.CallOption) (*EnrollmentsList, error) {
	out := new(EnrollmentsList)
	err := c.cc.Invoke(ctx, "/enrollment.EnrollmentService/GetUserEnrollments", in, out, opts...)
	return out, err
}

func (c *enrollmentServiceClient) GetCourseEnrollments(ctx context.Context, in *CourseRequest, opts ...grpc.CallOption) (*EnrollmentsList, error) {
	out := new(EnrollmentsList)
	err := c.cc.Invoke(ctx, "/enrollment.EnrollmentService/GetCourseEnrollments", in, out, opts...)
	return out, err
}
