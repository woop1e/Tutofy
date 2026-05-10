package messagingpb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

// ── Messages ──────────────────────────────────────────────────────────────────

type SendMessageRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	ReceiverId string `protobuf:"bytes,1,opt,name=receiver_id,json=receiverId,proto3" json:"receiver_id,omitempty"`
	Content    string `protobuf:"bytes,2,opt,name=content,proto3" json:"content,omitempty"`
}

func (x *SendMessageRequest) Reset()           { *x = SendMessageRequest{} }
func (x *SendMessageRequest) String() string    { return x.ReceiverId }
func (x *SendMessageRequest) ProtoMessage()    {}
func (x *SendMessageRequest) GetReceiverId() string { return x.ReceiverId }
func (x *SendMessageRequest) GetContent() string    { return x.Content }

type GetConversationRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	OtherUserId string `protobuf:"bytes,1,opt,name=other_user_id,json=otherUserId,proto3" json:"other_user_id,omitempty"`
	Limit       int32  `protobuf:"varint,2,opt,name=limit,proto3" json:"limit,omitempty"`
	Offset      int32  `protobuf:"varint,3,opt,name=offset,proto3" json:"offset,omitempty"`
}

func (x *GetConversationRequest) Reset()             { *x = GetConversationRequest{} }
func (x *GetConversationRequest) String() string      { return x.OtherUserId }
func (x *GetConversationRequest) ProtoMessage()      {}
func (x *GetConversationRequest) GetOtherUserId() string { return x.OtherUserId }
func (x *GetConversationRequest) GetLimit() int32        { return x.Limit }
func (x *GetConversationRequest) GetOffset() int32       { return x.Offset }

type GetUserConversationsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Limit  int32 `protobuf:"varint,1,opt,name=limit,proto3" json:"limit,omitempty"`
	Offset int32 `protobuf:"varint,2,opt,name=offset,proto3" json:"offset,omitempty"`
}

func (x *GetUserConversationsRequest) Reset()         { *x = GetUserConversationsRequest{} }
func (x *GetUserConversationsRequest) String() string  { return "" }
func (x *GetUserConversationsRequest) ProtoMessage()  {}
func (x *GetUserConversationsRequest) GetLimit() int32  { return x.Limit }
func (x *GetUserConversationsRequest) GetOffset() int32 { return x.Offset }

type MessageResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id         string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	SenderId   string `protobuf:"bytes,2,opt,name=sender_id,json=senderId,proto3" json:"sender_id,omitempty"`
	ReceiverId string `protobuf:"bytes,3,opt,name=receiver_id,json=receiverId,proto3" json:"receiver_id,omitempty"`
	Content    string `protobuf:"bytes,4,opt,name=content,proto3" json:"content,omitempty"`
	IsRead     bool   `protobuf:"varint,5,opt,name=is_read,json=isRead,proto3" json:"is_read,omitempty"`
	CreatedAt  string `protobuf:"bytes,6,opt,name=created_at,json=createdAt,proto3" json:"created_at,omitempty"`
}

func (x *MessageResponse) Reset()           { *x = MessageResponse{} }
func (x *MessageResponse) String() string    { return x.Id }
func (x *MessageResponse) ProtoMessage()    {}
func (x *MessageResponse) GetId() string         { return x.Id }
func (x *MessageResponse) GetSenderId() string   { return x.SenderId }
func (x *MessageResponse) GetReceiverId() string { return x.ReceiverId }
func (x *MessageResponse) GetContent() string    { return x.Content }
func (x *MessageResponse) GetIsRead() bool       { return x.IsRead }
func (x *MessageResponse) GetCreatedAt() string  { return x.CreatedAt }

type MessagesList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Messages []*MessageResponse `protobuf:"bytes,1,rep,name=messages,proto3" json:"messages,omitempty"`
}

func (x *MessagesList) Reset()          { *x = MessagesList{} }
func (x *MessagesList) String() string   { return "" }
func (x *MessagesList) ProtoMessage()   {}
func (x *MessagesList) GetMessages() []*MessageResponse { return x.Messages }

type ConversationItem struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	OtherUserId   string `protobuf:"bytes,1,opt,name=other_user_id,json=otherUserId,proto3" json:"other_user_id,omitempty"`
	LastMessage   string `protobuf:"bytes,2,opt,name=last_message,json=lastMessage,proto3" json:"last_message,omitempty"`
	LastMessageAt string `protobuf:"bytes,3,opt,name=last_message_at,json=lastMessageAt,proto3" json:"last_message_at,omitempty"`
}

func (x *ConversationItem) Reset()              { *x = ConversationItem{} }
func (x *ConversationItem) String() string       { return x.OtherUserId }
func (x *ConversationItem) ProtoMessage()       {}
func (x *ConversationItem) GetOtherUserId() string   { return x.OtherUserId }
func (x *ConversationItem) GetLastMessage() string   { return x.LastMessage }
func (x *ConversationItem) GetLastMessageAt() string { return x.LastMessageAt }

type ConversationsList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Conversations []*ConversationItem `protobuf:"bytes,1,rep,name=conversations,proto3" json:"conversations,omitempty"`
}

func (x *ConversationsList) Reset()          { *x = ConversationsList{} }
func (x *ConversationsList) String() string   { return "" }
func (x *ConversationsList) ProtoMessage()   {}
func (x *ConversationsList) GetConversations() []*ConversationItem { return x.Conversations }

// ── Server interface ──────────────────────────────────────────────────────────

type MessagingServiceServer interface {
	SendMessage(context.Context, *SendMessageRequest) (*MessageResponse, error)
	GetConversation(context.Context, *GetConversationRequest) (*MessagesList, error)
	GetUserConversations(context.Context, *GetUserConversationsRequest) (*ConversationsList, error)
	mustEmbedUnimplementedMessagingServiceServer()
}

type UnimplementedMessagingServiceServer struct{}

func (UnimplementedMessagingServiceServer) SendMessage(context.Context, *SendMessageRequest) (*MessageResponse, error) {
	return nil, nil
}
func (UnimplementedMessagingServiceServer) GetConversation(context.Context, *GetConversationRequest) (*MessagesList, error) {
	return nil, nil
}
func (UnimplementedMessagingServiceServer) GetUserConversations(context.Context, *GetUserConversationsRequest) (*ConversationsList, error) {
	return nil, nil
}
func (UnimplementedMessagingServiceServer) mustEmbedUnimplementedMessagingServiceServer() {}

// ── Registration ──────────────────────────────────────────────────────────────

func RegisterMessagingServiceServer(s grpc.ServiceRegistrar, srv MessagingServiceServer) {
	s.RegisterService(&MessagingService_ServiceDesc, srv)
}

var MessagingService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "messaging.MessagingService",
	HandlerType: (*MessagingServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "SendMessage", Handler: _MessagingService_SendMessage_Handler},
		{MethodName: "GetConversation", Handler: _MessagingService_GetConversation_Handler},
		{MethodName: "GetUserConversations", Handler: _MessagingService_GetUserConversations_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "messaging.proto",
}

func _MessagingService_SendMessage_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(SendMessageRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(MessagingServiceServer).SendMessage(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/messaging.MessagingService/SendMessage"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(MessagingServiceServer).SendMessage(ctx, req.(*SendMessageRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _MessagingService_GetConversation_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetConversationRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(MessagingServiceServer).GetConversation(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/messaging.MessagingService/GetConversation"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(MessagingServiceServer).GetConversation(ctx, req.(*GetConversationRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _MessagingService_GetUserConversations_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetUserConversationsRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(MessagingServiceServer).GetUserConversations(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/messaging.MessagingService/GetUserConversations"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(MessagingServiceServer).GetUserConversations(ctx, req.(*GetUserConversationsRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// ── Client interface ──────────────────────────────────────────────────────────

type MessagingServiceClient interface {
	SendMessage(ctx context.Context, in *SendMessageRequest, opts ...grpc.CallOption) (*MessageResponse, error)
	GetConversation(ctx context.Context, in *GetConversationRequest, opts ...grpc.CallOption) (*MessagesList, error)
	GetUserConversations(ctx context.Context, in *GetUserConversationsRequest, opts ...grpc.CallOption) (*ConversationsList, error)
}

type messagingServiceClient struct {
	cc grpc.ClientConnInterface
}

func NewMessagingServiceClient(cc grpc.ClientConnInterface) MessagingServiceClient {
	return &messagingServiceClient{cc}
}

func (c *messagingServiceClient) SendMessage(ctx context.Context, in *SendMessageRequest, opts ...grpc.CallOption) (*MessageResponse, error) {
	out := new(MessageResponse)
	err := c.cc.Invoke(ctx, "/messaging.MessagingService/SendMessage", in, out, opts...)
	return out, err
}

func (c *messagingServiceClient) GetConversation(ctx context.Context, in *GetConversationRequest, opts ...grpc.CallOption) (*MessagesList, error) {
	out := new(MessagesList)
	err := c.cc.Invoke(ctx, "/messaging.MessagingService/GetConversation", in, out, opts...)
	return out, err
}

func (c *messagingServiceClient) GetUserConversations(ctx context.Context, in *GetUserConversationsRequest, opts ...grpc.CallOption) (*ConversationsList, error) {
	out := new(ConversationsList)
	err := c.cc.Invoke(ctx, "/messaging.MessagingService/GetUserConversations", in, out, opts...)
	return out, err
}
