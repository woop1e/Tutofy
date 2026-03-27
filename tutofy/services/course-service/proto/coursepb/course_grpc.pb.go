package coursepb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

// ── Messages ──────────────────────────────────────────────────────────────────

type CreateCourseRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Title       string `protobuf:"bytes,1,opt,name=title,proto3" json:"title,omitempty"`
	Description string `protobuf:"bytes,2,opt,name=description,proto3" json:"description,omitempty"`
}

func (x *CreateCourseRequest) Reset()         { *x = CreateCourseRequest{} }
func (x *CreateCourseRequest) String() string  { return x.Title }
func (x *CreateCourseRequest) ProtoMessage()  {}
func (x *CreateCourseRequest) GetTitle() string       { return x.Title }
func (x *CreateCourseRequest) GetDescription() string { return x.Description }

type GetCourseRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *GetCourseRequest) Reset()         { *x = GetCourseRequest{} }
func (x *GetCourseRequest) String() string  { return x.CourseId }
func (x *GetCourseRequest) ProtoMessage()  {}
func (x *GetCourseRequest) GetCourseId() string { return x.CourseId }

type DeleteCourseRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *DeleteCourseRequest) Reset()         { *x = DeleteCourseRequest{} }
func (x *DeleteCourseRequest) String() string  { return x.CourseId }
func (x *DeleteCourseRequest) ProtoMessage()  {}
func (x *DeleteCourseRequest) GetCourseId() string { return x.CourseId }

type CourseResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id          string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Title       string `protobuf:"bytes,2,opt,name=title,proto3" json:"title,omitempty"`
	Description string `protobuf:"bytes,3,opt,name=description,proto3" json:"description,omitempty"`
	TutorId     string `protobuf:"bytes,4,opt,name=tutor_id,json=tutorId,proto3" json:"tutor_id,omitempty"`
}

func (x *CourseResponse) Reset()         { *x = CourseResponse{} }
func (x *CourseResponse) String() string  { return x.Id }
func (x *CourseResponse) ProtoMessage()  {}
func (x *CourseResponse) GetId() string          { return x.Id }
func (x *CourseResponse) GetTitle() string       { return x.Title }
func (x *CourseResponse) GetDescription() string { return x.Description }
func (x *CourseResponse) GetTutorId() string     { return x.TutorId }

type CoursesList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Courses []*CourseResponse `protobuf:"bytes,1,rep,name=courses,proto3" json:"courses,omitempty"`
}

func (x *CoursesList) Reset()         { *x = CoursesList{} }
func (x *CoursesList) String() string  { return "" }
func (x *CoursesList) ProtoMessage()  {}
func (x *CoursesList) GetCourses() []*CourseResponse { return x.Courses }

type Empty struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *Empty) Reset()         { *x = Empty{} }
func (x *Empty) String() string  { return "" }
func (x *Empty) ProtoMessage()  {}

// ── Server interface ──────────────────────────────────────────────────────────

type CourseServiceServer interface {
	CreateCourse(context.Context, *CreateCourseRequest) (*CourseResponse, error)
	GetCourse(context.Context, *GetCourseRequest) (*CourseResponse, error)
	GetAllCourses(context.Context, *Empty) (*CoursesList, error)
	DeleteCourse(context.Context, *DeleteCourseRequest) (*Empty, error)
	mustEmbedUnimplementedCourseServiceServer()
}

type UnimplementedCourseServiceServer struct{}

func (UnimplementedCourseServiceServer) CreateCourse(context.Context, *CreateCourseRequest) (*CourseResponse, error) {
	return nil, nil
}
func (UnimplementedCourseServiceServer) GetCourse(context.Context, *GetCourseRequest) (*CourseResponse, error) {
	return nil, nil
}
func (UnimplementedCourseServiceServer) GetAllCourses(context.Context, *Empty) (*CoursesList, error) {
	return nil, nil
}
func (UnimplementedCourseServiceServer) DeleteCourse(context.Context, *DeleteCourseRequest) (*Empty, error) {
	return nil, nil
}
func (UnimplementedCourseServiceServer) mustEmbedUnimplementedCourseServiceServer() {}

// ── Registration ──────────────────────────────────────────────────────────────

func RegisterCourseServiceServer(s grpc.ServiceRegistrar, srv CourseServiceServer) {
	s.RegisterService(&CourseService_ServiceDesc, srv)
}

var CourseService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "course.CourseService",
	HandlerType: (*CourseServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "CreateCourse", Handler: _CourseService_CreateCourse_Handler},
		{MethodName: "GetCourse", Handler: _CourseService_GetCourse_Handler},
		{MethodName: "GetAllCourses", Handler: _CourseService_GetAllCourses_Handler},
		{MethodName: "DeleteCourse", Handler: _CourseService_DeleteCourse_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "course.proto",
}

func _CourseService_CreateCourse_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CreateCourseRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CourseServiceServer).CreateCourse(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/course.CourseService/CreateCourse"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CourseServiceServer).CreateCourse(ctx, req.(*CreateCourseRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _CourseService_GetCourse_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetCourseRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CourseServiceServer).GetCourse(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/course.CourseService/GetCourse"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CourseServiceServer).GetCourse(ctx, req.(*GetCourseRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _CourseService_GetAllCourses_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(Empty)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CourseServiceServer).GetAllCourses(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/course.CourseService/GetAllCourses"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CourseServiceServer).GetAllCourses(ctx, req.(*Empty))
	}
	return interceptor(ctx, in, info, handler)
}

func _CourseService_DeleteCourse_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(DeleteCourseRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CourseServiceServer).DeleteCourse(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/course.CourseService/DeleteCourse"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CourseServiceServer).DeleteCourse(ctx, req.(*DeleteCourseRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// ── Client interface ──────────────────────────────────────────────────────────

type CourseServiceClient interface {
	CreateCourse(ctx context.Context, in *CreateCourseRequest, opts ...grpc.CallOption) (*CourseResponse, error)
	GetCourse(ctx context.Context, in *GetCourseRequest, opts ...grpc.CallOption) (*CourseResponse, error)
	GetAllCourses(ctx context.Context, in *Empty, opts ...grpc.CallOption) (*CoursesList, error)
	DeleteCourse(ctx context.Context, in *DeleteCourseRequest, opts ...grpc.CallOption) (*CourseResponse, error)
}

type courseServiceClient struct {
	cc grpc.ClientConnInterface
}

func NewCourseServiceClient(cc grpc.ClientConnInterface) CourseServiceClient {
	return &courseServiceClient{cc}
}

func (c *courseServiceClient) CreateCourse(ctx context.Context, in *CreateCourseRequest, opts ...grpc.CallOption) (*CourseResponse, error) {
	out := new(CourseResponse)
	err := c.cc.Invoke(ctx, "/course.CourseService/CreateCourse", in, out, opts...)
	return out, err
}

func (c *courseServiceClient) GetCourse(ctx context.Context, in *GetCourseRequest, opts ...grpc.CallOption) (*CourseResponse, error) {
	out := new(CourseResponse)
	err := c.cc.Invoke(ctx, "/course.CourseService/GetCourse", in, out, opts...)
	return out, err
}

func (c *courseServiceClient) GetAllCourses(ctx context.Context, in *Empty, opts ...grpc.CallOption) (*CoursesList, error) {
	out := new(CoursesList)
	err := c.cc.Invoke(ctx, "/course.CourseService/GetAllCourses", in, out, opts...)
	return out, err
}

func (c *courseServiceClient) DeleteCourse(ctx context.Context, in *DeleteCourseRequest, opts ...grpc.CallOption) (*CourseResponse, error) {
	out := new(CourseResponse)
	err := c.cc.Invoke(ctx, "/course.CourseService/DeleteCourse", in, out, opts...)
	return out, err
}
