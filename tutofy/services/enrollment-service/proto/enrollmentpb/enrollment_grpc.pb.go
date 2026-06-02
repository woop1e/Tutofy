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

type UnenrollRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId   string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	CourseId string `protobuf:"bytes,2,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *UnenrollRequest) Reset()         { *x = UnenrollRequest{} }
func (x *UnenrollRequest) String() string  { return x.UserId }
func (x *UnenrollRequest) ProtoMessage()  {}
func (x *UnenrollRequest) GetUserId() string   { return x.UserId }
func (x *UnenrollRequest) GetCourseId() string { return x.CourseId }

type Empty struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *Empty) Reset()         { *x = Empty{} }
func (x *Empty) String() string  { return "" }
func (x *Empty) ProtoMessage()  {}

type EnrollmentRequestResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id        string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	UserId    string `protobuf:"bytes,2,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	CourseId  string `protobuf:"bytes,3,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	Status    string `protobuf:"bytes,4,opt,name=status,proto3" json:"status,omitempty"`
	CreatedAt string `protobuf:"bytes,5,opt,name=created_at,json=createdAt,proto3" json:"created_at,omitempty"`
}

func (x *EnrollmentRequestResponse) Reset()              { *x = EnrollmentRequestResponse{} }
func (x *EnrollmentRequestResponse) String() string       { return x.Id }
func (x *EnrollmentRequestResponse) ProtoMessage()       {}
func (x *EnrollmentRequestResponse) GetId() string        { return x.Id }
func (x *EnrollmentRequestResponse) GetUserId() string    { return x.UserId }
func (x *EnrollmentRequestResponse) GetCourseId() string  { return x.CourseId }
func (x *EnrollmentRequestResponse) GetStatus() string    { return x.Status }
func (x *EnrollmentRequestResponse) GetCreatedAt() string { return x.CreatedAt }

type EnrollmentRequestsList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Requests []*EnrollmentRequestResponse `protobuf:"bytes,1,rep,name=requests,proto3" json:"requests,omitempty"`
}

func (x *EnrollmentRequestsList) Reset()         { *x = EnrollmentRequestsList{} }
func (x *EnrollmentRequestsList) String() string  { return "" }
func (x *EnrollmentRequestsList) ProtoMessage()  {}
func (x *EnrollmentRequestsList) GetRequests() []*EnrollmentRequestResponse { return x.Requests }

type RequestEnrollmentRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *RequestEnrollmentRequest) Reset()         { *x = RequestEnrollmentRequest{} }
func (x *RequestEnrollmentRequest) String() string  { return x.CourseId }
func (x *RequestEnrollmentRequest) ProtoMessage()  {}
func (x *RequestEnrollmentRequest) GetCourseId() string { return x.CourseId }

type EnrollmentRequestActionRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	RequestId string `protobuf:"bytes,1,opt,name=request_id,json=requestId,proto3" json:"request_id,omitempty"`
}

func (x *EnrollmentRequestActionRequest) Reset()         { *x = EnrollmentRequestActionRequest{} }
func (x *EnrollmentRequestActionRequest) String() string  { return x.RequestId }
func (x *EnrollmentRequestActionRequest) ProtoMessage()  {}
func (x *EnrollmentRequestActionRequest) GetRequestId() string { return x.RequestId }

type CountResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Count int64 `protobuf:"varint,1,opt,name=count,proto3" json:"count,omitempty"`
}

func (x *CountResponse) Reset()        { *x = CountResponse{} }
func (x *CountResponse) String() string { return "" }
func (x *CountResponse) ProtoMessage() {}
func (x *CountResponse) GetCount() int64 { return x.Count }

// ── Server interface ──────────────────────────────────────────────────────────

type EnrollmentServiceServer interface {
	EnrollUser(context.Context, *EnrollRequest) (*EnrollmentResponse, error)
	GetUserEnrollments(context.Context, *UserRequest) (*EnrollmentsList, error)
	GetCourseEnrollments(context.Context, *CourseRequest) (*EnrollmentsList, error)
	UnenrollUser(context.Context, *UnenrollRequest) (*Empty, error)
	RequestEnrollment(context.Context, *RequestEnrollmentRequest) (*EnrollmentRequestResponse, error)
	GetCourseEnrollmentRequests(context.Context, *CourseRequest) (*EnrollmentRequestsList, error)
	ApproveEnrollmentRequest(context.Context, *EnrollmentRequestActionRequest) (*Empty, error)
	RejectEnrollmentRequest(context.Context, *EnrollmentRequestActionRequest) (*Empty, error)
	CountEnrollments(context.Context, *CourseRequest) (*CountResponse, error)
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
func (UnimplementedEnrollmentServiceServer) UnenrollUser(context.Context, *UnenrollRequest) (*Empty, error) {
	return nil, nil
}
func (UnimplementedEnrollmentServiceServer) RequestEnrollment(context.Context, *RequestEnrollmentRequest) (*EnrollmentRequestResponse, error) {
	return nil, nil
}
func (UnimplementedEnrollmentServiceServer) GetCourseEnrollmentRequests(context.Context, *CourseRequest) (*EnrollmentRequestsList, error) {
	return nil, nil
}
func (UnimplementedEnrollmentServiceServer) ApproveEnrollmentRequest(context.Context, *EnrollmentRequestActionRequest) (*Empty, error) {
	return nil, nil
}
func (UnimplementedEnrollmentServiceServer) RejectEnrollmentRequest(context.Context, *EnrollmentRequestActionRequest) (*Empty, error) {
	return nil, nil
}
func (UnimplementedEnrollmentServiceServer) CountEnrollments(context.Context, *CourseRequest) (*CountResponse, error) {
	return &CountResponse{}, nil
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
		{MethodName: "UnenrollUser", Handler: _EnrollmentService_UnenrollUser_Handler},
		{MethodName: "RequestEnrollment", Handler: _EnrollmentService_RequestEnrollment_Handler},
		{MethodName: "GetCourseEnrollmentRequests", Handler: _EnrollmentService_GetCourseEnrollmentRequests_Handler},
		{MethodName: "ApproveEnrollmentRequest", Handler: _EnrollmentService_ApproveEnrollmentRequest_Handler},
		{MethodName: "RejectEnrollmentRequest", Handler: _EnrollmentService_RejectEnrollmentRequest_Handler},
		{MethodName: "CountEnrollments", Handler: _EnrollmentService_CountEnrollments_Handler},
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

func _EnrollmentService_UnenrollUser_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UnenrollRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(EnrollmentServiceServer).UnenrollUser(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/enrollment.EnrollmentService/UnenrollUser"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(EnrollmentServiceServer).UnenrollUser(ctx, req.(*UnenrollRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _EnrollmentService_RequestEnrollment_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(RequestEnrollmentRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(EnrollmentServiceServer).RequestEnrollment(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/enrollment.EnrollmentService/RequestEnrollment"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(EnrollmentServiceServer).RequestEnrollment(ctx, req.(*RequestEnrollmentRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _EnrollmentService_GetCourseEnrollmentRequests_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CourseRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(EnrollmentServiceServer).GetCourseEnrollmentRequests(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/enrollment.EnrollmentService/GetCourseEnrollmentRequests"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(EnrollmentServiceServer).GetCourseEnrollmentRequests(ctx, req.(*CourseRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _EnrollmentService_ApproveEnrollmentRequest_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(EnrollmentRequestActionRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(EnrollmentServiceServer).ApproveEnrollmentRequest(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/enrollment.EnrollmentService/ApproveEnrollmentRequest"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(EnrollmentServiceServer).ApproveEnrollmentRequest(ctx, req.(*EnrollmentRequestActionRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _EnrollmentService_RejectEnrollmentRequest_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(EnrollmentRequestActionRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(EnrollmentServiceServer).RejectEnrollmentRequest(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/enrollment.EnrollmentService/RejectEnrollmentRequest"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(EnrollmentServiceServer).RejectEnrollmentRequest(ctx, req.(*EnrollmentRequestActionRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _EnrollmentService_CountEnrollments_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CourseRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(EnrollmentServiceServer).CountEnrollments(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/enrollment.EnrollmentService/CountEnrollments"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(EnrollmentServiceServer).CountEnrollments(ctx, req.(*CourseRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// ── Client interface ──────────────────────────────────────────────────────────

type EnrollmentServiceClient interface {
	EnrollUser(ctx context.Context, in *EnrollRequest, opts ...grpc.CallOption) (*EnrollmentResponse, error)
	GetUserEnrollments(ctx context.Context, in *UserRequest, opts ...grpc.CallOption) (*EnrollmentsList, error)
	GetCourseEnrollments(ctx context.Context, in *CourseRequest, opts ...grpc.CallOption) (*EnrollmentsList, error)
	UnenrollUser(ctx context.Context, in *UnenrollRequest, opts ...grpc.CallOption) (*Empty, error)
	RequestEnrollment(ctx context.Context, in *RequestEnrollmentRequest, opts ...grpc.CallOption) (*EnrollmentRequestResponse, error)
	GetCourseEnrollmentRequests(ctx context.Context, in *CourseRequest, opts ...grpc.CallOption) (*EnrollmentRequestsList, error)
	ApproveEnrollmentRequest(ctx context.Context, in *EnrollmentRequestActionRequest, opts ...grpc.CallOption) (*Empty, error)
	RejectEnrollmentRequest(ctx context.Context, in *EnrollmentRequestActionRequest, opts ...grpc.CallOption) (*Empty, error)
	CountEnrollments(ctx context.Context, in *CourseRequest, opts ...grpc.CallOption) (*CountResponse, error)
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

func (c *enrollmentServiceClient) UnenrollUser(ctx context.Context, in *UnenrollRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty)
	err := c.cc.Invoke(ctx, "/enrollment.EnrollmentService/UnenrollUser", in, out, opts...)
	return out, err
}

func (c *enrollmentServiceClient) RequestEnrollment(ctx context.Context, in *RequestEnrollmentRequest, opts ...grpc.CallOption) (*EnrollmentRequestResponse, error) {
	out := new(EnrollmentRequestResponse)
	err := c.cc.Invoke(ctx, "/enrollment.EnrollmentService/RequestEnrollment", in, out, opts...)
	return out, err
}

func (c *enrollmentServiceClient) GetCourseEnrollmentRequests(ctx context.Context, in *CourseRequest, opts ...grpc.CallOption) (*EnrollmentRequestsList, error) {
	out := new(EnrollmentRequestsList)
	err := c.cc.Invoke(ctx, "/enrollment.EnrollmentService/GetCourseEnrollmentRequests", in, out, opts...)
	return out, err
}

func (c *enrollmentServiceClient) ApproveEnrollmentRequest(ctx context.Context, in *EnrollmentRequestActionRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty)
	err := c.cc.Invoke(ctx, "/enrollment.EnrollmentService/ApproveEnrollmentRequest", in, out, opts...)
	return out, err
}

func (c *enrollmentServiceClient) RejectEnrollmentRequest(ctx context.Context, in *EnrollmentRequestActionRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty)
	err := c.cc.Invoke(ctx, "/enrollment.EnrollmentService/RejectEnrollmentRequest", in, out, opts...)
	return out, err
}

func (c *enrollmentServiceClient) CountEnrollments(ctx context.Context, in *CourseRequest, opts ...grpc.CallOption) (*CountResponse, error) {
	out := new(CountResponse)
	err := c.cc.Invoke(ctx, "/enrollment.EnrollmentService/CountEnrollments", in, out, opts...)
	return out, err
}
