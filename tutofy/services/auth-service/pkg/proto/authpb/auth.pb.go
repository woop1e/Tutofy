// Code generated manually. DO NOT EDIT by hand unless necessary.
package authpb

import (
	"google.golang.org/protobuf/runtime/protoimpl"
)

type RegisterRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Email    string `protobuf:"bytes,1,opt,name=email,proto3" json:"email,omitempty"`
	Password string `protobuf:"bytes,2,opt,name=password,proto3" json:"password,omitempty"`
	Name     string `protobuf:"bytes,3,opt,name=name,proto3" json:"name,omitempty"`
	Role     string `protobuf:"bytes,4,opt,name=role,proto3" json:"role,omitempty"`
}

func (x *RegisterRequest) Reset()          {}
func (x *RegisterRequest) String() string  { return x.Email }
func (x *RegisterRequest) ProtoMessage()   {}
func (x *RegisterRequest) GetEmail() string    { return x.Email }
func (x *RegisterRequest) GetPassword() string { return x.Password }
func (x *RegisterRequest) GetName() string     { return x.Name }
func (x *RegisterRequest) GetRole() string     { return x.Role }

type LoginRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Email    string `protobuf:"bytes,1,opt,name=email,proto3" json:"email,omitempty"`
	Password string `protobuf:"bytes,2,opt,name=password,proto3" json:"password,omitempty"`
}

func (x *LoginRequest) Reset()          {}
func (x *LoginRequest) String() string  { return x.Email }
func (x *LoginRequest) ProtoMessage()   {}
func (x *LoginRequest) GetEmail() string    { return x.Email }
func (x *LoginRequest) GetPassword() string { return x.Password }

type AuthResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Token   string `protobuf:"bytes,1,opt,name=token,proto3" json:"token,omitempty"`
	Message string `protobuf:"bytes,2,opt,name=message,proto3" json:"message,omitempty"`
}

func (x *AuthResponse) Reset()          {}
func (x *AuthResponse) String() string  { return x.Token }
func (x *AuthResponse) ProtoMessage()   {}
func (x *AuthResponse) GetToken() string   { return x.Token }
func (x *AuthResponse) GetMessage() string { return x.Message }

type TokenRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Token string `protobuf:"bytes,1,opt,name=token,proto3" json:"token,omitempty"`
}

func (x *TokenRequest) Reset()          {}
func (x *TokenRequest) String() string  { return x.Token }
func (x *TokenRequest) ProtoMessage()   {}
func (x *TokenRequest) GetToken() string { return x.Token }

type ValidateResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	Role   string `protobuf:"bytes,2,opt,name=role,proto3" json:"role,omitempty"`
}

func (x *ValidateResponse) Reset()          {}
func (x *ValidateResponse) String() string  { return x.UserId }
func (x *ValidateResponse) ProtoMessage()   {}
func (x *ValidateResponse) GetUserId() string { return x.UserId }
func (x *ValidateResponse) GetRole() string   { return x.Role }
