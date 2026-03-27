package proto

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

type TokenRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Token string `protobuf:"bytes,1,opt,name=token,proto3" json:"token,omitempty"`
}

func (x *TokenRequest) Reset()         { *x = TokenRequest{} }
func (x *TokenRequest) String() string { return x.Token }
func (x *TokenRequest) ProtoMessage()  {}
func (x *TokenRequest) GetToken() string {
	if x != nil {
		return x.Token
	}
	return ""
}

type ValidateResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	Role   string `protobuf:"bytes,2,opt,name=role,proto3" json:"role,omitempty"`
}

func (x *ValidateResponse) Reset()         { *x = ValidateResponse{} }
func (x *ValidateResponse) String() string { return x.UserId }
func (x *ValidateResponse) ProtoMessage()  {}
func (x *ValidateResponse) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}
func (x *ValidateResponse) GetRole() string {
	if x != nil {
		return x.Role
	}
	return ""
}

type AuthServiceClient interface {
	ValidateToken(ctx context.Context, in *TokenRequest, opts ...grpc.CallOption) (*ValidateResponse, error)
}

type authServiceClient struct {
	cc grpc.ClientConnInterface
}

func NewAuthServiceClient(cc grpc.ClientConnInterface) AuthServiceClient {
	return &authServiceClient{cc}
}

func (c *authServiceClient) ValidateToken(ctx context.Context, in *TokenRequest, opts ...grpc.CallOption) (*ValidateResponse, error) {
	out := new(ValidateResponse)
	err := c.cc.Invoke(ctx, "/auth.AuthService/ValidateToken", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}
