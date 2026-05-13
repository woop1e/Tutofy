package notificationpb

// NotifyUserRequest is a generic notification message — added without protoc regeneration.

import "google.golang.org/protobuf/runtime/protoimpl"

type NotifyUserRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId  string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	Type    int32  `protobuf:"varint,2,opt,name=type,proto3" json:"type,omitempty"`
	Message string `protobuf:"bytes,3,opt,name=message,proto3" json:"message,omitempty"`
}

func (x *NotifyUserRequest) Reset()          { *x = NotifyUserRequest{} }
func (x *NotifyUserRequest) String() string   { return x.UserId }
func (x *NotifyUserRequest) ProtoMessage()   {}
func (x *NotifyUserRequest) GetUserId() string  { return x.UserId }
func (x *NotifyUserRequest) GetType() int32     { return x.Type }
func (x *NotifyUserRequest) GetMessage() string { return x.Message }
