package userpb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

// ── Messages ─────────────────────────────────────────────────────────────────

type GetUserRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
}

func (x *GetUserRequest) Reset()        { *x = GetUserRequest{} }
func (x *GetUserRequest) String() string { return x.UserId }
func (x *GetUserRequest) ProtoMessage() {}
func (x *GetUserRequest) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}

type UpdateUserRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	Name   string `protobuf:"bytes,2,opt,name=name,proto3" json:"name,omitempty"`
	Email  string `protobuf:"bytes,3,opt,name=email,proto3" json:"email,omitempty"`
}

func (x *UpdateUserRequest) Reset()        { *x = UpdateUserRequest{} }
func (x *UpdateUserRequest) String() string { return x.UserId }
func (x *UpdateUserRequest) ProtoMessage() {}
func (x *UpdateUserRequest) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}
func (x *UpdateUserRequest) GetName() string {
	if x != nil {
		return x.Name
	}
	return ""
}
func (x *UpdateUserRequest) GetEmail() string {
	if x != nil {
		return x.Email
	}
	return ""
}

type UserResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id    string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Email string `protobuf:"bytes,2,opt,name=email,proto3" json:"email,omitempty"`
	Name  string `protobuf:"bytes,3,opt,name=name,proto3" json:"name,omitempty"`
	Role  string `protobuf:"bytes,4,opt,name=role,proto3" json:"role,omitempty"`
}

func (x *UserResponse) Reset()        { *x = UserResponse{} }
func (x *UserResponse) String() string { return x.Id }
func (x *UserResponse) ProtoMessage() {}
func (x *UserResponse) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}
func (x *UserResponse) GetEmail() string {
	if x != nil {
		return x.Email
	}
	return ""
}
func (x *UserResponse) GetName() string {
	if x != nil {
		return x.Name
	}
	return ""
}
func (x *UserResponse) GetRole() string {
	if x != nil {
		return x.Role
	}
	return ""
}

type UsersList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Users []*UserResponse `protobuf:"bytes,1,rep,name=users,proto3" json:"users,omitempty"`
}

func (x *UsersList) Reset()        { *x = UsersList{} }
func (x *UsersList) String() string { return "" }
func (x *UsersList) ProtoMessage() {}
func (x *UsersList) GetUsers() []*UserResponse {
	if x != nil {
		return x.Users
	}
	return nil
}

type DeleteUserRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
}

func (x *DeleteUserRequest) Reset()        { *x = DeleteUserRequest{} }
func (x *DeleteUserRequest) String() string { return x.UserId }
func (x *DeleteUserRequest) ProtoMessage() {}
func (x *DeleteUserRequest) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}

type UpdateTutorProfileRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId          string   `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	Bio             string   `protobuf:"bytes,2,opt,name=bio,proto3" json:"bio,omitempty"`
	Age             int32    `protobuf:"varint,3,opt,name=age,proto3" json:"age,omitempty"`
	Location        string   `protobuf:"bytes,4,opt,name=location,proto3" json:"location,omitempty"`
	PhotoUrl        string   `protobuf:"bytes,5,opt,name=photo_url,json=photoUrl,proto3" json:"photo_url,omitempty"`
	Subjects        []string `protobuf:"bytes,6,rep,name=subjects,proto3" json:"subjects,omitempty"`
	ExperienceYears int32    `protobuf:"varint,7,opt,name=experience_years,json=experienceYears,proto3" json:"experience_years,omitempty"`
	Certificates    []string `protobuf:"bytes,8,rep,name=certificates,proto3" json:"certificates,omitempty"`
}

func (x *UpdateTutorProfileRequest) Reset()               { *x = UpdateTutorProfileRequest{} }
func (x *UpdateTutorProfileRequest) String() string        { return x.UserId }
func (x *UpdateTutorProfileRequest) ProtoMessage()         {}
func (x *UpdateTutorProfileRequest) GetUserId() string           { return x.UserId }
func (x *UpdateTutorProfileRequest) GetBio() string              { return x.Bio }
func (x *UpdateTutorProfileRequest) GetAge() int32               { return x.Age }
func (x *UpdateTutorProfileRequest) GetLocation() string         { return x.Location }
func (x *UpdateTutorProfileRequest) GetPhotoUrl() string         { return x.PhotoUrl }
func (x *UpdateTutorProfileRequest) GetSubjects() []string       { return x.Subjects }
func (x *UpdateTutorProfileRequest) GetExperienceYears() int32   { return x.ExperienceYears }
func (x *UpdateTutorProfileRequest) GetCertificates() []string   { return x.Certificates }

type GetTutorProfileRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	TutorId string `protobuf:"bytes,1,opt,name=tutor_id,json=tutorId,proto3" json:"tutor_id,omitempty"`
}

func (x *GetTutorProfileRequest) Reset()         { *x = GetTutorProfileRequest{} }
func (x *GetTutorProfileRequest) String() string  { return x.TutorId }
func (x *GetTutorProfileRequest) ProtoMessage()  {}
func (x *GetTutorProfileRequest) GetTutorId() string { return x.TutorId }

type TutorProfileResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id              string   `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Name            string   `protobuf:"bytes,2,opt,name=name,proto3" json:"name,omitempty"`
	Email           string   `protobuf:"bytes,3,opt,name=email,proto3" json:"email,omitempty"`
	Bio             string   `protobuf:"bytes,4,opt,name=bio,proto3" json:"bio,omitempty"`
	Age             int32    `protobuf:"varint,5,opt,name=age,proto3" json:"age,omitempty"`
	Location        string   `protobuf:"bytes,6,opt,name=location,proto3" json:"location,omitempty"`
	PhotoUrl        string   `protobuf:"bytes,7,opt,name=photo_url,json=photoUrl,proto3" json:"photo_url,omitempty"`
	Subjects        []string `protobuf:"bytes,8,rep,name=subjects,proto3" json:"subjects,omitempty"`
	ExperienceYears int32    `protobuf:"varint,9,opt,name=experience_years,json=experienceYears,proto3" json:"experience_years,omitempty"`
	Certificates    []string `protobuf:"bytes,10,rep,name=certificates,proto3" json:"certificates,omitempty"`
}

func (x *TutorProfileResponse) Reset()               { *x = TutorProfileResponse{} }
func (x *TutorProfileResponse) String() string        { return x.Id }
func (x *TutorProfileResponse) ProtoMessage()         {}
func (x *TutorProfileResponse) GetId() string                { return x.Id }
func (x *TutorProfileResponse) GetName() string              { return x.Name }
func (x *TutorProfileResponse) GetEmail() string             { return x.Email }
func (x *TutorProfileResponse) GetBio() string               { return x.Bio }
func (x *TutorProfileResponse) GetAge() int32                { return x.Age }
func (x *TutorProfileResponse) GetLocation() string          { return x.Location }
func (x *TutorProfileResponse) GetPhotoUrl() string          { return x.PhotoUrl }
func (x *TutorProfileResponse) GetSubjects() []string        { return x.Subjects }
func (x *TutorProfileResponse) GetExperienceYears() int32    { return x.ExperienceYears }
func (x *TutorProfileResponse) GetCertificates() []string    { return x.Certificates }

type GetAllUsersRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Limit  int32 `protobuf:"varint,1,opt,name=limit,proto3" json:"limit,omitempty"`
	Offset int32 `protobuf:"varint,2,opt,name=offset,proto3" json:"offset,omitempty"`
}

func (x *GetAllUsersRequest) Reset()         { *x = GetAllUsersRequest{} }
func (x *GetAllUsersRequest) String() string  { return "" }
func (x *GetAllUsersRequest) ProtoMessage()  {}
func (x *GetAllUsersRequest) GetLimit() int32  { return x.Limit }
func (x *GetAllUsersRequest) GetOffset() int32 { return x.Offset }

type Empty struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *Empty) Reset()        { *x = Empty{} }
func (x *Empty) String() string { return "" }
func (x *Empty) ProtoMessage() {}

// ── Server interface ──────────────────────────────────────────────────────────

type UserServiceServer interface {
	GetUser(context.Context, *GetUserRequest) (*UserResponse, error)
	UpdateUser(context.Context, *UpdateUserRequest) (*UserResponse, error)
	GetAllUsers(context.Context, *GetAllUsersRequest) (*UsersList, error)
	DeleteUser(context.Context, *DeleteUserRequest) (*Empty, error)
	UpdateTutorProfile(context.Context, *UpdateTutorProfileRequest) (*TutorProfileResponse, error)
	GetTutorProfile(context.Context, *GetTutorProfileRequest) (*TutorProfileResponse, error)
	SearchTutors(context.Context, *SearchTutorsRequest) (*TutorCardsList, error)
	mustEmbedUnimplementedUserServiceServer()
}

type UnimplementedUserServiceServer struct{}

func (UnimplementedUserServiceServer) GetUser(context.Context, *GetUserRequest) (*UserResponse, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) UpdateUser(context.Context, *UpdateUserRequest) (*UserResponse, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) GetAllUsers(context.Context, *GetAllUsersRequest) (*UsersList, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) DeleteUser(context.Context, *DeleteUserRequest) (*Empty, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) UpdateTutorProfile(context.Context, *UpdateTutorProfileRequest) (*TutorProfileResponse, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) GetTutorProfile(context.Context, *GetTutorProfileRequest) (*TutorProfileResponse, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) SearchTutors(context.Context, *SearchTutorsRequest) (*TutorCardsList, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) mustEmbedUnimplementedUserServiceServer() {}

// ── Registration ──────────────────────────────────────────────────────────────

func RegisterUserServiceServer(s grpc.ServiceRegistrar, srv UserServiceServer) {
	s.RegisterService(&UserService_ServiceDesc, srv)
}

var UserService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "user.UserService",
	HandlerType: (*UserServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "GetUser", Handler: _UserService_GetUser_Handler},
		{MethodName: "UpdateUser", Handler: _UserService_UpdateUser_Handler},
		{MethodName: "GetAllUsers", Handler: _UserService_GetAllUsers_Handler},
		{MethodName: "DeleteUser", Handler: _UserService_DeleteUser_Handler},
		{MethodName: "UpdateTutorProfile", Handler: _UserService_UpdateTutorProfile_Handler},
		{MethodName: "GetTutorProfile", Handler: _UserService_GetTutorProfile_Handler},
		{MethodName: "SearchTutors", Handler: _UserService_SearchTutors_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "user.proto",
}

func _UserService_GetUser_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetUserRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).GetUser(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/GetUser"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).GetUser(ctx, req.(*GetUserRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_UpdateUser_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateUserRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).UpdateUser(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/UpdateUser"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).UpdateUser(ctx, req.(*UpdateUserRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_GetAllUsers_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetAllUsersRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).GetAllUsers(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/GetAllUsers"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).GetAllUsers(ctx, req.(*GetAllUsersRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_DeleteUser_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(DeleteUserRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).DeleteUser(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/DeleteUser"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).DeleteUser(ctx, req.(*DeleteUserRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_UpdateTutorProfile_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateTutorProfileRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).UpdateTutorProfile(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/UpdateTutorProfile"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).UpdateTutorProfile(ctx, req.(*UpdateTutorProfileRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_GetTutorProfile_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetTutorProfileRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).GetTutorProfile(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/GetTutorProfile"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).GetTutorProfile(ctx, req.(*GetTutorProfileRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_SearchTutors_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(SearchTutorsRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).SearchTutors(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/SearchTutors"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).SearchTutors(ctx, req.(*SearchTutorsRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// ── Client interface ──────────────────────────────────────────────────────────

type UserServiceClient interface {
	GetUser(ctx context.Context, in *GetUserRequest, opts ...grpc.CallOption) (*UserResponse, error)
	UpdateUser(ctx context.Context, in *UpdateUserRequest, opts ...grpc.CallOption) (*UserResponse, error)
	GetAllUsers(ctx context.Context, in *GetAllUsersRequest, opts ...grpc.CallOption) (*UsersList, error)
	DeleteUser(ctx context.Context, in *DeleteUserRequest, opts ...grpc.CallOption) (*Empty, error)
	UpdateTutorProfile(ctx context.Context, in *UpdateTutorProfileRequest, opts ...grpc.CallOption) (*TutorProfileResponse, error)
	GetTutorProfile(ctx context.Context, in *GetTutorProfileRequest, opts ...grpc.CallOption) (*TutorProfileResponse, error)
	SearchTutors(ctx context.Context, in *SearchTutorsRequest, opts ...grpc.CallOption) (*TutorCardsList, error)
}

type userServiceClient struct{ cc grpc.ClientConnInterface }

func NewUserServiceClient(cc grpc.ClientConnInterface) UserServiceClient {
	return &userServiceClient{cc}
}

func (c *userServiceClient) GetUser(ctx context.Context, in *GetUserRequest, opts ...grpc.CallOption) (*UserResponse, error) {
	out := new(UserResponse)
	err := c.cc.Invoke(ctx, "/user.UserService/GetUser", in, out, opts...)
	return out, err
}

func (c *userServiceClient) UpdateUser(ctx context.Context, in *UpdateUserRequest, opts ...grpc.CallOption) (*UserResponse, error) {
	out := new(UserResponse)
	err := c.cc.Invoke(ctx, "/user.UserService/UpdateUser", in, out, opts...)
	return out, err
}

func (c *userServiceClient) GetAllUsers(ctx context.Context, in *GetAllUsersRequest, opts ...grpc.CallOption) (*UsersList, error) {
	out := new(UsersList)
	err := c.cc.Invoke(ctx, "/user.UserService/GetAllUsers", in, out, opts...)
	return out, err
}

func (c *userServiceClient) DeleteUser(ctx context.Context, in *DeleteUserRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty)
	err := c.cc.Invoke(ctx, "/user.UserService/DeleteUser", in, out, opts...)
	return out, err
}

func (c *userServiceClient) UpdateTutorProfile(ctx context.Context, in *UpdateTutorProfileRequest, opts ...grpc.CallOption) (*TutorProfileResponse, error) {
	out := new(TutorProfileResponse)
	err := c.cc.Invoke(ctx, "/user.UserService/UpdateTutorProfile", in, out, opts...)
	return out, err
}

func (c *userServiceClient) GetTutorProfile(ctx context.Context, in *GetTutorProfileRequest, opts ...grpc.CallOption) (*TutorProfileResponse, error) {
	out := new(TutorProfileResponse)
	err := c.cc.Invoke(ctx, "/user.UserService/GetTutorProfile", in, out, opts...)
	return out, err
}

// ── SearchTutors ──────────────────────────────────────────────────────────────

type SearchTutorsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Subject  string `protobuf:"bytes,1,opt,name=subject,proto3" json:"subject,omitempty"`
	Location string `protobuf:"bytes,2,opt,name=location,proto3" json:"location,omitempty"`
	Limit    int32  `protobuf:"varint,3,opt,name=limit,proto3" json:"limit,omitempty"`
	Offset   int32  `protobuf:"varint,4,opt,name=offset,proto3" json:"offset,omitempty"`
	MinAge   int32  `protobuf:"varint,5,opt,name=min_age,json=minAge,proto3" json:"min_age,omitempty"`
	MaxAge   int32  `protobuf:"varint,6,opt,name=max_age,json=maxAge,proto3" json:"max_age,omitempty"`
}

func (x *SearchTutorsRequest) Reset()             { *x = SearchTutorsRequest{} }
func (x *SearchTutorsRequest) String() string      { return "" }
func (x *SearchTutorsRequest) ProtoMessage()      {}
func (x *SearchTutorsRequest) GetSubject() string   { return x.Subject }
func (x *SearchTutorsRequest) GetLocation() string  { return x.Location }
func (x *SearchTutorsRequest) GetMinAge() int32     { return x.MinAge }
func (x *SearchTutorsRequest) GetMaxAge() int32     { return x.MaxAge }
func (x *SearchTutorsRequest) GetLimit() int32     { return x.Limit }
func (x *SearchTutorsRequest) GetOffset() int32    { return x.Offset }

type TutorCardsList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Tutors []*TutorProfileResponse `protobuf:"bytes,1,rep,name=tutors,proto3" json:"tutors,omitempty"`
}

func (x *TutorCardsList) Reset()          { *x = TutorCardsList{} }
func (x *TutorCardsList) String() string   { return "" }
func (x *TutorCardsList) ProtoMessage()   {}
func (x *TutorCardsList) GetTutors() []*TutorProfileResponse { return x.Tutors }

func (c *userServiceClient) SearchTutors(ctx context.Context, in *SearchTutorsRequest, opts ...grpc.CallOption) (*TutorCardsList, error) {
	out := new(TutorCardsList)
	err := c.cc.Invoke(ctx, "/user.UserService/SearchTutors", in, out, opts...)
	return out, err
}
