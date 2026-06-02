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
	Title               string  `protobuf:"bytes,1,opt,name=title,proto3" json:"title,omitempty"`
	Description         string  `protobuf:"bytes,2,opt,name=description,proto3" json:"description,omitempty"`
	Price               float64 `protobuf:"fixed64,3,opt,name=price,proto3" json:"price,omitempty"`
	CourseType          string  `protobuf:"bytes,4,opt,name=course_type,json=courseType,proto3" json:"course_type,omitempty"`
	MaxStudents         int32   `protobuf:"varint,5,opt,name=max_students,json=maxStudents,proto3" json:"max_students,omitempty"`
	EnrollmentDeadline  string  `protobuf:"bytes,6,opt,name=enrollment_deadline,json=enrollmentDeadline,proto3" json:"enrollment_deadline,omitempty"`
	TotalLessons        int32   `protobuf:"varint,7,opt,name=total_lessons,json=totalLessons,proto3" json:"total_lessons,omitempty"`
	TotalWeeks          int32   `protobuf:"varint,8,opt,name=total_weeks,json=totalWeeks,proto3" json:"total_weeks,omitempty"`
	ReleaseType         string  `protobuf:"bytes,9,opt,name=release_type,json=releaseType,proto3" json:"release_type,omitempty"`
	StartDate           string  `protobuf:"bytes,10,opt,name=start_date,json=startDate,proto3" json:"start_date,omitempty"`
	EndDate             string  `protobuf:"bytes,11,opt,name=end_date,json=endDate,proto3" json:"end_date,omitempty"`
}

func (x *CreateCourseRequest) Reset()         { *x = CreateCourseRequest{} }
func (x *CreateCourseRequest) String() string  { return x.Title }
func (x *CreateCourseRequest) ProtoMessage()  {}
func (x *CreateCourseRequest) GetTitle() string              { return x.Title }
func (x *CreateCourseRequest) GetDescription() string        { return x.Description }
func (x *CreateCourseRequest) GetPrice() float64             { return x.Price }
func (x *CreateCourseRequest) GetCourseType() string         { return x.CourseType }
func (x *CreateCourseRequest) GetMaxStudents() int32         { return x.MaxStudents }
func (x *CreateCourseRequest) GetEnrollmentDeadline() string { return x.EnrollmentDeadline }
func (x *CreateCourseRequest) GetTotalLessons() int32        { return x.TotalLessons }
func (x *CreateCourseRequest) GetTotalWeeks() int32          { return x.TotalWeeks }
func (x *CreateCourseRequest) GetReleaseType() string        { return x.ReleaseType }
func (x *CreateCourseRequest) GetStartDate() string          { return x.StartDate }
func (x *CreateCourseRequest) GetEndDate() string            { return x.EndDate }

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
	CourseId           string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	Title              string `protobuf:"bytes,2,opt,name=title,proto3" json:"title,omitempty"`
	Description        string `protobuf:"bytes,3,opt,name=description,proto3" json:"description,omitempty"`
	CourseType         string `protobuf:"bytes,4,opt,name=course_type,json=courseType,proto3" json:"course_type,omitempty"`
	MaxStudents        int32  `protobuf:"varint,5,opt,name=max_students,json=maxStudents,proto3" json:"max_students,omitempty"`
	EnrollmentDeadline string `protobuf:"bytes,6,opt,name=enrollment_deadline,json=enrollmentDeadline,proto3" json:"enrollment_deadline,omitempty"`
	TotalLessons       int32  `protobuf:"varint,7,opt,name=total_lessons,json=totalLessons,proto3" json:"total_lessons,omitempty"`
	TotalWeeks         int32  `protobuf:"varint,8,opt,name=total_weeks,json=totalWeeks,proto3" json:"total_weeks,omitempty"`
	ReleaseType        string `protobuf:"bytes,9,opt,name=release_type,json=releaseType,proto3" json:"release_type,omitempty"`
	StartDate          string  `protobuf:"bytes,10,opt,name=start_date,json=startDate,proto3" json:"start_date,omitempty"`
	EndDate            string  `protobuf:"bytes,11,opt,name=end_date,json=endDate,proto3" json:"end_date,omitempty"`
	Price              float64 `protobuf:"fixed64,12,opt,name=price,proto3" json:"price,omitempty"`
}

func (x *UpdateCourseRequest) Reset()         { *x = UpdateCourseRequest{} }
func (x *UpdateCourseRequest) String() string  { return x.CourseId }
func (x *UpdateCourseRequest) ProtoMessage()  {}
func (x *UpdateCourseRequest) GetCourseId() string           { return x.CourseId }
func (x *UpdateCourseRequest) GetTitle() string              { return x.Title }
func (x *UpdateCourseRequest) GetDescription() string        { return x.Description }
func (x *UpdateCourseRequest) GetCourseType() string         { return x.CourseType }
func (x *UpdateCourseRequest) GetMaxStudents() int32         { return x.MaxStudents }
func (x *UpdateCourseRequest) GetEnrollmentDeadline() string { return x.EnrollmentDeadline }
func (x *UpdateCourseRequest) GetTotalLessons() int32        { return x.TotalLessons }
func (x *UpdateCourseRequest) GetTotalWeeks() int32          { return x.TotalWeeks }
func (x *UpdateCourseRequest) GetReleaseType() string        { return x.ReleaseType }
func (x *UpdateCourseRequest) GetStartDate() string          { return x.StartDate }
func (x *UpdateCourseRequest) GetEndDate() string            { return x.EndDate }
func (x *UpdateCourseRequest) GetPrice() float64             { return x.Price }

type PublishCourseRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *PublishCourseRequest) Reset()         { *x = PublishCourseRequest{} }
func (x *PublishCourseRequest) String() string  { return x.CourseId }
func (x *PublishCourseRequest) ProtoMessage()  {}
func (x *PublishCourseRequest) GetCourseId() string { return x.CourseId }

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
	Id                 string  `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Title              string  `protobuf:"bytes,2,opt,name=title,proto3" json:"title,omitempty"`
	Description        string  `protobuf:"bytes,3,opt,name=description,proto3" json:"description,omitempty"`
	TutorId            string  `protobuf:"bytes,4,opt,name=tutor_id,json=tutorId,proto3" json:"tutor_id,omitempty"`
	Price              float64 `protobuf:"fixed64,5,opt,name=price,proto3" json:"price,omitempty"`
	CourseType         string  `protobuf:"bytes,6,opt,name=course_type,json=courseType,proto3" json:"course_type,omitempty"`
	MaxStudents        int32   `protobuf:"varint,7,opt,name=max_students,json=maxStudents,proto3" json:"max_students,omitempty"`
	EnrollmentDeadline string  `protobuf:"bytes,8,opt,name=enrollment_deadline,json=enrollmentDeadline,proto3" json:"enrollment_deadline,omitempty"`
	IsPublished        bool    `protobuf:"varint,9,opt,name=is_published,json=isPublished,proto3" json:"is_published,omitempty"`
	TotalLessons       int32   `protobuf:"varint,10,opt,name=total_lessons,json=totalLessons,proto3" json:"total_lessons,omitempty"`
	TotalWeeks         int32   `protobuf:"varint,11,opt,name=total_weeks,json=totalWeeks,proto3" json:"total_weeks,omitempty"`
	ReleaseType        string  `protobuf:"bytes,12,opt,name=release_type,json=releaseType,proto3" json:"release_type,omitempty"`
	StartDate          string  `protobuf:"bytes,13,opt,name=start_date,json=startDate,proto3" json:"start_date,omitempty"`
	EndDate            string  `protobuf:"bytes,14,opt,name=end_date,json=endDate,proto3" json:"end_date,omitempty"`
}

func (x *CourseResponse) Reset()         { *x = CourseResponse{} }
func (x *CourseResponse) String() string  { return x.Id }
func (x *CourseResponse) ProtoMessage()  {}
func (x *CourseResponse) GetId() string                  { return x.Id }
func (x *CourseResponse) GetTitle() string               { return x.Title }
func (x *CourseResponse) GetDescription() string         { return x.Description }
func (x *CourseResponse) GetTutorId() string             { return x.TutorId }
func (x *CourseResponse) GetPrice() float64              { return x.Price }
func (x *CourseResponse) GetCourseType() string          { return x.CourseType }
func (x *CourseResponse) GetMaxStudents() int32          { return x.MaxStudents }
func (x *CourseResponse) GetEnrollmentDeadline() string  { return x.EnrollmentDeadline }
func (x *CourseResponse) GetIsPublished() bool           { return x.IsPublished }
func (x *CourseResponse) GetTotalLessons() int32         { return x.TotalLessons }
func (x *CourseResponse) GetTotalWeeks() int32           { return x.TotalWeeks }
func (x *CourseResponse) GetReleaseType() string         { return x.ReleaseType }
func (x *CourseResponse) GetStartDate() string           { return x.StartDate }
func (x *CourseResponse) GetEndDate() string             { return x.EndDate }

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
	PublishCourse(context.Context, *PublishCourseRequest) (*CourseResponse, error)
	SearchCourses(context.Context, *SearchCoursesRequest) (*CoursesList, error)
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
func (UnimplementedCourseServiceServer) PublishCourse(context.Context, *PublishCourseRequest) (*CourseResponse, error) {
	return nil, nil
}
func (UnimplementedCourseServiceServer) SearchCourses(context.Context, *SearchCoursesRequest) (*CoursesList, error) {
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
		{MethodName: "PublishCourse", Handler: _CourseService_PublishCourse_Handler},
		{MethodName: "SearchCourses", Handler: _CourseService_SearchCourses_Handler},
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

func _CourseService_PublishCourse_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(PublishCourseRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CourseServiceServer).PublishCourse(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/course.CourseService/PublishCourse"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CourseServiceServer).PublishCourse(ctx, req.(*PublishCourseRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _CourseService_SearchCourses_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(SearchCoursesRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CourseServiceServer).SearchCourses(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/course.CourseService/SearchCourses"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CourseServiceServer).SearchCourses(ctx, req.(*SearchCoursesRequest))
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
	PublishCourse(ctx context.Context, in *PublishCourseRequest, opts ...grpc.CallOption) (*CourseResponse, error)
	SearchCourses(ctx context.Context, in *SearchCoursesRequest, opts ...grpc.CallOption) (*CoursesList, error)
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

func (c *courseServiceClient) PublishCourse(ctx context.Context, in *PublishCourseRequest, opts ...grpc.CallOption) (*CourseResponse, error) {
	out := new(CourseResponse)
	err := c.cc.Invoke(ctx, "/course.CourseService/PublishCourse", in, out, opts...)
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

// ── SearchCourses ─────────────────────────────────────────────────────────────

type SearchCoursesRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	TutorId    string  `protobuf:"bytes,1,opt,name=tutor_id,json=tutorId,proto3" json:"tutor_id,omitempty"`
	Tag        string  `protobuf:"bytes,2,opt,name=tag,proto3" json:"tag,omitempty"`
	CourseType string  `protobuf:"bytes,3,opt,name=course_type,json=courseType,proto3" json:"course_type,omitempty"`
	MinPrice   float64 `protobuf:"fixed64,4,opt,name=min_price,json=minPrice,proto3" json:"min_price,omitempty"`
	MaxPrice   float64 `protobuf:"fixed64,5,opt,name=max_price,json=maxPrice,proto3" json:"max_price,omitempty"`
	Limit      int32   `protobuf:"varint,6,opt,name=limit,proto3" json:"limit,omitempty"`
	Offset     int32   `protobuf:"varint,7,opt,name=offset,proto3" json:"offset,omitempty"`
}

func (x *SearchCoursesRequest) Reset()             { *x = SearchCoursesRequest{} }
func (x *SearchCoursesRequest) String() string      { return "" }
func (x *SearchCoursesRequest) ProtoMessage()       {}
func (x *SearchCoursesRequest) GetTutorId() string    { return x.TutorId }
func (x *SearchCoursesRequest) GetTag() string        { return x.Tag }
func (x *SearchCoursesRequest) GetCourseType() string { return x.CourseType }
func (x *SearchCoursesRequest) GetMinPrice() float64  { return x.MinPrice }
func (x *SearchCoursesRequest) GetMaxPrice() float64  { return x.MaxPrice }
func (x *SearchCoursesRequest) GetLimit() int32       { return x.Limit }
func (x *SearchCoursesRequest) GetOffset() int32      { return x.Offset }

func (c *courseServiceClient) SearchCourses(ctx context.Context, in *SearchCoursesRequest, opts ...grpc.CallOption) (*CoursesList, error) {
	out := new(CoursesList)
	err := c.cc.Invoke(ctx, "/course.CourseService/SearchCourses", in, out, opts...)
	return out, err
}
