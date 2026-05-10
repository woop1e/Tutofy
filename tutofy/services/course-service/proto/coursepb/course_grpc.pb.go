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
	Title       string  `protobuf:"bytes,1,opt,name=title,proto3" json:"title,omitempty"`
	Description string  `protobuf:"bytes,2,opt,name=description,proto3" json:"description,omitempty"`
	Price       float64 `protobuf:"fixed64,3,opt,name=price,proto3" json:"price,omitempty"`
}

func (x *CreateCourseRequest) Reset()         { *x = CreateCourseRequest{} }
func (x *CreateCourseRequest) String() string  { return x.Title }
func (x *CreateCourseRequest) ProtoMessage()  {}
func (x *CreateCourseRequest) GetTitle() string       { return x.Title }
func (x *CreateCourseRequest) GetDescription() string { return x.Description }
func (x *CreateCourseRequest) GetPrice() float64      { return x.Price }

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

type UpdateCourseRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId    string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	Title       string `protobuf:"bytes,2,opt,name=title,proto3" json:"title,omitempty"`
	Description string `protobuf:"bytes,3,opt,name=description,proto3" json:"description,omitempty"`
}

func (x *UpdateCourseRequest) Reset()         { *x = UpdateCourseRequest{} }
func (x *UpdateCourseRequest) String() string  { return x.CourseId }
func (x *UpdateCourseRequest) ProtoMessage()  {}
func (x *UpdateCourseRequest) GetCourseId() string    { return x.CourseId }
func (x *UpdateCourseRequest) GetTitle() string       { return x.Title }
func (x *UpdateCourseRequest) GetDescription() string { return x.Description }

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
	Id          string  `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Title       string  `protobuf:"bytes,2,opt,name=title,proto3" json:"title,omitempty"`
	Description string  `protobuf:"bytes,3,opt,name=description,proto3" json:"description,omitempty"`
	TutorId     string  `protobuf:"bytes,4,opt,name=tutor_id,json=tutorId,proto3" json:"tutor_id,omitempty"`
	Price       float64 `protobuf:"fixed64,5,opt,name=price,proto3" json:"price,omitempty"`
}

func (x *CourseResponse) Reset()         { *x = CourseResponse{} }
func (x *CourseResponse) String() string  { return x.Id }
func (x *CourseResponse) ProtoMessage()  {}
func (x *CourseResponse) GetId() string          { return x.Id }
func (x *CourseResponse) GetTitle() string       { return x.Title }
func (x *CourseResponse) GetDescription() string { return x.Description }
func (x *CourseResponse) GetTutorId() string     { return x.TutorId }
func (x *CourseResponse) GetPrice() float64      { return x.Price }

type GetAllCoursesRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Limit  int32 `protobuf:"varint,1,opt,name=limit,proto3" json:"limit,omitempty"`
	Offset int32 `protobuf:"varint,2,opt,name=offset,proto3" json:"offset,omitempty"`
}

func (x *GetAllCoursesRequest) Reset()         { *x = GetAllCoursesRequest{} }
func (x *GetAllCoursesRequest) String() string  { return "" }
func (x *GetAllCoursesRequest) ProtoMessage()  {}
func (x *GetAllCoursesRequest) GetLimit() int32  { return x.Limit }
func (x *GetAllCoursesRequest) GetOffset() int32 { return x.Offset }

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

type TagRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	TagName  string `protobuf:"bytes,2,opt,name=tag_name,json=tagName,proto3" json:"tag_name,omitempty"`
}

func (x *TagRequest) Reset()         { *x = TagRequest{} }
func (x *TagRequest) String() string  { return x.CourseId }
func (x *TagRequest) ProtoMessage()  {}
func (x *TagRequest) GetCourseId() string { return x.CourseId }
func (x *TagRequest) GetTagName() string  { return x.TagName }

type GetCoursesByTagRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	TagName string `protobuf:"bytes,1,opt,name=tag_name,json=tagName,proto3" json:"tag_name,omitempty"`
	Limit   int32  `protobuf:"varint,2,opt,name=limit,proto3" json:"limit,omitempty"`
	Offset  int32  `protobuf:"varint,3,opt,name=offset,proto3" json:"offset,omitempty"`
}

func (x *GetCoursesByTagRequest) Reset()          { *x = GetCoursesByTagRequest{} }
func (x *GetCoursesByTagRequest) String() string   { return x.TagName }
func (x *GetCoursesByTagRequest) ProtoMessage()   {}
func (x *GetCoursesByTagRequest) GetTagName() string { return x.TagName }
func (x *GetCoursesByTagRequest) GetLimit() int32   { return x.Limit }
func (x *GetCoursesByTagRequest) GetOffset() int32  { return x.Offset }

type CourseServiceServer interface {
	CreateCourse(context.Context, *CreateCourseRequest) (*CourseResponse, error)
	GetCourse(context.Context, *GetCourseRequest) (*CourseResponse, error)
	GetAllCourses(context.Context, *GetAllCoursesRequest) (*CoursesList, error)
	UpdateCourse(context.Context, *UpdateCourseRequest) (*CourseResponse, error)
	DeleteCourse(context.Context, *DeleteCourseRequest) (*Empty, error)
	AddTag(context.Context, *TagRequest) (*Empty, error)
	RemoveTag(context.Context, *TagRequest) (*Empty, error)
	GetCoursesByTag(context.Context, *GetCoursesByTagRequest) (*CoursesList, error)
	mustEmbedUnimplementedCourseServiceServer()
}

type UnimplementedCourseServiceServer struct{}

func (UnimplementedCourseServiceServer) CreateCourse(context.Context, *CreateCourseRequest) (*CourseResponse, error) {
	return nil, nil
}
func (UnimplementedCourseServiceServer) GetCourse(context.Context, *GetCourseRequest) (*CourseResponse, error) {
	return nil, nil
}
func (UnimplementedCourseServiceServer) GetAllCourses(context.Context, *GetAllCoursesRequest) (*CoursesList, error) {
	return nil, nil
}
func (UnimplementedCourseServiceServer) UpdateCourse(context.Context, *UpdateCourseRequest) (*CourseResponse, error) {
	return nil, nil
}
func (UnimplementedCourseServiceServer) DeleteCourse(context.Context, *DeleteCourseRequest) (*Empty, error) {
	return nil, nil
}
func (UnimplementedCourseServiceServer) AddTag(context.Context, *TagRequest) (*Empty, error) {
	return nil, nil
}
func (UnimplementedCourseServiceServer) RemoveTag(context.Context, *TagRequest) (*Empty, error) {
	return nil, nil
}
func (UnimplementedCourseServiceServer) GetCoursesByTag(context.Context, *GetCoursesByTagRequest) (*CoursesList, error) {
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
		{MethodName: "UpdateCourse", Handler: _CourseService_UpdateCourse_Handler},
		{MethodName: "DeleteCourse", Handler: _CourseService_DeleteCourse_Handler},
		{MethodName: "AddTag", Handler: _CourseService_AddTag_Handler},
		{MethodName: "RemoveTag", Handler: _CourseService_RemoveTag_Handler},
		{MethodName: "GetCoursesByTag", Handler: _CourseService_GetCoursesByTag_Handler},
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
	in := new(GetAllCoursesRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CourseServiceServer).GetAllCourses(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/course.CourseService/GetAllCourses"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CourseServiceServer).GetAllCourses(ctx, req.(*GetAllCoursesRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _CourseService_UpdateCourse_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateCourseRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CourseServiceServer).UpdateCourse(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/course.CourseService/UpdateCourse"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CourseServiceServer).UpdateCourse(ctx, req.(*UpdateCourseRequest))
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

func _CourseService_AddTag_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(TagRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CourseServiceServer).AddTag(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/course.CourseService/AddTag"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(CourseServiceServer).AddTag(ctx, req.(*TagRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _CourseService_RemoveTag_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(TagRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CourseServiceServer).RemoveTag(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/course.CourseService/RemoveTag"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(CourseServiceServer).RemoveTag(ctx, req.(*TagRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _CourseService_GetCoursesByTag_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetCoursesByTagRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CourseServiceServer).GetCoursesByTag(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/course.CourseService/GetCoursesByTag"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(CourseServiceServer).GetCoursesByTag(ctx, req.(*GetCoursesByTagRequest)) }
	return interceptor(ctx, in, info, handler)
}

type CourseServiceClient interface {
	CreateCourse(ctx context.Context, in *CreateCourseRequest, opts ...grpc.CallOption) (*CourseResponse, error)
	GetCourse(ctx context.Context, in *GetCourseRequest, opts ...grpc.CallOption) (*CourseResponse, error)
	GetAllCourses(ctx context.Context, in *GetAllCoursesRequest, opts ...grpc.CallOption) (*CoursesList, error)
	UpdateCourse(ctx context.Context, in *UpdateCourseRequest, opts ...grpc.CallOption) (*CourseResponse, error)
	DeleteCourse(ctx context.Context, in *DeleteCourseRequest, opts ...grpc.CallOption) (*Empty, error)
	AddTag(ctx context.Context, in *TagRequest, opts ...grpc.CallOption) (*Empty, error)
	RemoveTag(ctx context.Context, in *TagRequest, opts ...grpc.CallOption) (*Empty, error)
	GetCoursesByTag(ctx context.Context, in *GetCoursesByTagRequest, opts ...grpc.CallOption) (*CoursesList, error)
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

func (c *courseServiceClient) GetAllCourses(ctx context.Context, in *GetAllCoursesRequest, opts ...grpc.CallOption) (*CoursesList, error) {
	out := new(CoursesList)
	err := c.cc.Invoke(ctx, "/course.CourseService/GetAllCourses", in, out, opts...)
	return out, err
}

func (c *courseServiceClient) UpdateCourse(ctx context.Context, in *UpdateCourseRequest, opts ...grpc.CallOption) (*CourseResponse, error) {
	out := new(CourseResponse)
	err := c.cc.Invoke(ctx, "/course.CourseService/UpdateCourse", in, out, opts...)
	return out, err
}

func (c *courseServiceClient) DeleteCourse(ctx context.Context, in *DeleteCourseRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty)
	err := c.cc.Invoke(ctx, "/course.CourseService/DeleteCourse", in, out, opts...)
	return out, err
}

func (c *courseServiceClient) AddTag(ctx context.Context, in *TagRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty)
	err := c.cc.Invoke(ctx, "/course.CourseService/AddTag", in, out, opts...)
	return out, err
}

func (c *courseServiceClient) RemoveTag(ctx context.Context, in *TagRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty)
	err := c.cc.Invoke(ctx, "/course.CourseService/RemoveTag", in, out, opts...)
	return out, err
}

func (c *courseServiceClient) GetCoursesByTag(ctx context.Context, in *GetCoursesByTagRequest, opts ...grpc.CallOption) (*CoursesList, error) {
	out := new(CoursesList)
	err := c.cc.Invoke(ctx, "/course.CourseService/GetCoursesByTag", in, out, opts...)
	return out, err
}
