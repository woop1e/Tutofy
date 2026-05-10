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
