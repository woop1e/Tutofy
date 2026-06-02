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

	Token             string `protobuf:"bytes,1,opt,name=token,proto3" json:"token,omitempty"`
	Message           string `protobuf:"bytes,2,opt,name=message,proto3" json:"message,omitempty"`
	NeedsVerification bool   `protobuf:"varint,3,opt,name=needs_verification,json=needsVerification,proto3" json:"needs_verification,omitempty"`
}

func (x *AuthResponse) Reset()                    {}
func (x *AuthResponse) String() string            { return x.Token }
func (x *AuthResponse) ProtoMessage()             {}
func (x *AuthResponse) GetToken() string          { return x.Token }
func (x *AuthResponse) GetMessage() string        { return x.Message }
func (x *AuthResponse) GetNeedsVerification() bool { return x.NeedsVerification }

type DeleteUserRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
}

func (x *DeleteUserRequest) Reset()            {}
func (x *DeleteUserRequest) String() string    { return x.UserId }
func (x *DeleteUserRequest) ProtoMessage()     {}
func (x *DeleteUserRequest) GetUserId() string { return x.UserId }

type DeleteUserResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *DeleteUserResponse) Reset()        {}
func (x *DeleteUserResponse) String() string { return "" }
func (x *DeleteUserResponse) ProtoMessage() {}

type VerifyEmailRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Token string `protobuf:"bytes,1,opt,name=token,proto3" json:"token,omitempty"`
}

func (x *VerifyEmailRequest) Reset()           {}
func (x *VerifyEmailRequest) String() string   { return x.Token }
func (x *VerifyEmailRequest) ProtoMessage()    {}
func (x *VerifyEmailRequest) GetToken() string { return x.Token }

type GetUserInfoRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
}

func (x *GetUserInfoRequest) Reset()            {}
func (x *GetUserInfoRequest) String() string    { return x.UserId }
func (x *GetUserInfoRequest) ProtoMessage()     {}
func (x *GetUserInfoRequest) GetUserId() string { return x.UserId }

type UserInfoResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	Email  string `protobuf:"bytes,2,opt,name=email,proto3" json:"email,omitempty"`
	Name   string `protobuf:"bytes,3,opt,name=name,proto3" json:"name,omitempty"`
	Role   string `protobuf:"bytes,4,opt,name=role,proto3" json:"role,omitempty"`
}

func (x *UserInfoResponse) Reset()           {}
func (x *UserInfoResponse) String() string   { return x.UserId }
func (x *UserInfoResponse) ProtoMessage()    {}
func (x *UserInfoResponse) GetUserId() string { return x.UserId }
func (x *UserInfoResponse) GetEmail() string  { return x.Email }
func (x *UserInfoResponse) GetName() string   { return x.Name }
func (x *UserInfoResponse) GetRole() string   { return x.Role }

type ResendVerificationRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Email string `protobuf:"bytes,1,opt,name=email,proto3" json:"email,omitempty"`
}

func (x *ResendVerificationRequest) Reset()           {}
func (x *ResendVerificationRequest) String() string   { return x.Email }
func (x *ResendVerificationRequest) ProtoMessage()    {}
func (x *ResendVerificationRequest) GetEmail() string { return x.Email }

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

type StoreGoogleTokenRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId       string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	AccessToken  string `protobuf:"bytes,2,opt,name=access_token,json=accessToken,proto3" json:"access_token,omitempty"`
	RefreshToken string `protobuf:"bytes,3,opt,name=refresh_token,json=refreshToken,proto3" json:"refresh_token,omitempty"`
	Expiry       string `protobuf:"bytes,4,opt,name=expiry,proto3" json:"expiry,omitempty"`
}

func (x *StoreGoogleTokenRequest) Reset()                  {}
func (x *StoreGoogleTokenRequest) String() string           { return x.UserId }
func (x *StoreGoogleTokenRequest) ProtoMessage()            {}
func (x *StoreGoogleTokenRequest) GetUserId() string        { return x.UserId }
func (x *StoreGoogleTokenRequest) GetAccessToken() string   { return x.AccessToken }
func (x *StoreGoogleTokenRequest) GetRefreshToken() string  { return x.RefreshToken }
func (x *StoreGoogleTokenRequest) GetExpiry() string        { return x.Expiry }

type StoreGoogleTokenResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *StoreGoogleTokenResponse) Reset()        {}
func (x *StoreGoogleTokenResponse) String() string { return "" }
func (x *StoreGoogleTokenResponse) ProtoMessage() {}

type GetGoogleTokenRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
}

func (x *GetGoogleTokenRequest) Reset()         {}
func (x *GetGoogleTokenRequest) String() string  { return x.UserId }
func (x *GetGoogleTokenRequest) ProtoMessage()  {}
func (x *GetGoogleTokenRequest) GetUserId() string { return x.UserId }

type GoogleTokenResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId       string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	AccessToken  string `protobuf:"bytes,2,opt,name=access_token,json=accessToken,proto3" json:"access_token,omitempty"`
	RefreshToken string `protobuf:"bytes,3,opt,name=refresh_token,json=refreshToken,proto3" json:"refresh_token,omitempty"`
	Expiry       string `protobuf:"bytes,4,opt,name=expiry,proto3" json:"expiry,omitempty"`
}

func (x *GoogleTokenResponse) Reset()                  {}
func (x *GoogleTokenResponse) String() string           { return x.UserId }
func (x *GoogleTokenResponse) ProtoMessage()            {}
func (x *GoogleTokenResponse) GetUserId() string        { return x.UserId }
func (x *GoogleTokenResponse) GetAccessToken() string   { return x.AccessToken }
func (x *GoogleTokenResponse) GetRefreshToken() string  { return x.RefreshToken }
func (x *GoogleTokenResponse) GetExpiry() string        { return x.Expiry }
