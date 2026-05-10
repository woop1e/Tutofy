package paymentpb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

// ── Messages ──────────────────────────────────────────────────────────────────

type CreatePaymentRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string  `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	Amount   float64 `protobuf:"fixed64,2,opt,name=amount,proto3" json:"amount,omitempty"`
}

func (x *CreatePaymentRequest) Reset()          { *x = CreatePaymentRequest{} }
func (x *CreatePaymentRequest) String() string   { return x.CourseId }
func (x *CreatePaymentRequest) ProtoMessage()   {}
func (x *CreatePaymentRequest) GetCourseId() string { return x.CourseId }
func (x *CreatePaymentRequest) GetAmount() float64  { return x.Amount }

type GetPaymentRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	PaymentId string `protobuf:"bytes,1,opt,name=payment_id,json=paymentId,proto3" json:"payment_id,omitempty"`
}

func (x *GetPaymentRequest) Reset()           { *x = GetPaymentRequest{} }
func (x *GetPaymentRequest) String() string    { return x.PaymentId }
func (x *GetPaymentRequest) ProtoMessage()    {}
func (x *GetPaymentRequest) GetPaymentId() string { return x.PaymentId }

type GetUserPaymentsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	Limit  int32  `protobuf:"varint,2,opt,name=limit,proto3" json:"limit,omitempty"`
	Offset int32  `protobuf:"varint,3,opt,name=offset,proto3" json:"offset,omitempty"`
}

func (x *GetUserPaymentsRequest) Reset()          { *x = GetUserPaymentsRequest{} }
func (x *GetUserPaymentsRequest) String() string   { return x.UserId }
func (x *GetUserPaymentsRequest) ProtoMessage()   {}
func (x *GetUserPaymentsRequest) GetUserId() string { return x.UserId }
func (x *GetUserPaymentsRequest) GetLimit() int32   { return x.Limit }
func (x *GetUserPaymentsRequest) GetOffset() int32  { return x.Offset }

type UpdatePaymentStatusRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	PaymentId string `protobuf:"bytes,1,opt,name=payment_id,json=paymentId,proto3" json:"payment_id,omitempty"`
	Status    string `protobuf:"bytes,2,opt,name=status,proto3" json:"status,omitempty"`
}

func (x *UpdatePaymentStatusRequest) Reset()           { *x = UpdatePaymentStatusRequest{} }
func (x *UpdatePaymentStatusRequest) String() string    { return x.PaymentId }
func (x *UpdatePaymentStatusRequest) ProtoMessage()    {}
func (x *UpdatePaymentStatusRequest) GetPaymentId() string { return x.PaymentId }
func (x *UpdatePaymentStatusRequest) GetStatus() string    { return x.Status }

type PaymentResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	PaymentId string  `protobuf:"bytes,1,opt,name=payment_id,json=paymentId,proto3" json:"payment_id,omitempty"`
	UserId    string  `protobuf:"bytes,2,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	CourseId  string  `protobuf:"bytes,3,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	Amount    float64 `protobuf:"fixed64,4,opt,name=amount,proto3" json:"amount,omitempty"`
	Status    string  `protobuf:"bytes,5,opt,name=status,proto3" json:"status,omitempty"`
	CreatedAt string  `protobuf:"bytes,6,opt,name=created_at,json=createdAt,proto3" json:"created_at,omitempty"`
}

func (x *PaymentResponse) Reset()           { *x = PaymentResponse{} }
func (x *PaymentResponse) String() string    { return x.PaymentId }
func (x *PaymentResponse) ProtoMessage()    {}
func (x *PaymentResponse) GetPaymentId() string { return x.PaymentId }
func (x *PaymentResponse) GetUserId() string    { return x.UserId }
func (x *PaymentResponse) GetCourseId() string  { return x.CourseId }
func (x *PaymentResponse) GetAmount() float64   { return x.Amount }
func (x *PaymentResponse) GetStatus() string    { return x.Status }
func (x *PaymentResponse) GetCreatedAt() string { return x.CreatedAt }

type PaymentsList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Payments []*PaymentResponse `protobuf:"bytes,1,rep,name=payments,proto3" json:"payments,omitempty"`
}

func (x *PaymentsList) Reset()          { *x = PaymentsList{} }
func (x *PaymentsList) String() string   { return "" }
func (x *PaymentsList) ProtoMessage()   {}
func (x *PaymentsList) GetPayments() []*PaymentResponse { return x.Payments }

// ── Server interface ──────────────────────────────────────────────────────────

type PaymentServiceServer interface {
	CreatePayment(context.Context, *CreatePaymentRequest) (*PaymentResponse, error)
	GetPayment(context.Context, *GetPaymentRequest) (*PaymentResponse, error)
	GetUserPayments(context.Context, *GetUserPaymentsRequest) (*PaymentsList, error)
	CompletePayment(context.Context, *UpdatePaymentStatusRequest) (*PaymentResponse, error)
	FailPayment(context.Context, *UpdatePaymentStatusRequest) (*PaymentResponse, error)
	mustEmbedUnimplementedPaymentServiceServer()
}

type UnimplementedPaymentServiceServer struct{}

func (UnimplementedPaymentServiceServer) CreatePayment(context.Context, *CreatePaymentRequest) (*PaymentResponse, error) {
	return nil, nil
}
func (UnimplementedPaymentServiceServer) GetPayment(context.Context, *GetPaymentRequest) (*PaymentResponse, error) {
	return nil, nil
}
func (UnimplementedPaymentServiceServer) GetUserPayments(context.Context, *GetUserPaymentsRequest) (*PaymentsList, error) {
	return nil, nil
}
func (UnimplementedPaymentServiceServer) CompletePayment(context.Context, *UpdatePaymentStatusRequest) (*PaymentResponse, error) {
	return nil, nil
}
func (UnimplementedPaymentServiceServer) FailPayment(context.Context, *UpdatePaymentStatusRequest) (*PaymentResponse, error) {
	return nil, nil
}
func (UnimplementedPaymentServiceServer) mustEmbedUnimplementedPaymentServiceServer() {}

// ── Registration ──────────────────────────────────────────────────────────────

func RegisterPaymentServiceServer(s grpc.ServiceRegistrar, srv PaymentServiceServer) {
	s.RegisterService(&PaymentService_ServiceDesc, srv)
}

var PaymentService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "payment.PaymentService",
	HandlerType: (*PaymentServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "CreatePayment", Handler: _PaymentService_CreatePayment_Handler},
		{MethodName: "GetPayment", Handler: _PaymentService_GetPayment_Handler},
		{MethodName: "GetUserPayments", Handler: _PaymentService_GetUserPayments_Handler},
		{MethodName: "CompletePayment", Handler: _PaymentService_CompletePayment_Handler},
		{MethodName: "FailPayment", Handler: _PaymentService_FailPayment_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "payment.proto",
}

func _PaymentService_CreatePayment_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CreatePaymentRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PaymentServiceServer).CreatePayment(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/payment.PaymentService/CreatePayment"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PaymentServiceServer).CreatePayment(ctx, req.(*CreatePaymentRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _PaymentService_GetPayment_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetPaymentRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PaymentServiceServer).GetPayment(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/payment.PaymentService/GetPayment"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PaymentServiceServer).GetPayment(ctx, req.(*GetPaymentRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _PaymentService_GetUserPayments_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetUserPaymentsRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PaymentServiceServer).GetUserPayments(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/payment.PaymentService/GetUserPayments"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PaymentServiceServer).GetUserPayments(ctx, req.(*GetUserPaymentsRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _PaymentService_CompletePayment_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdatePaymentStatusRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PaymentServiceServer).CompletePayment(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/payment.PaymentService/CompletePayment"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PaymentServiceServer).CompletePayment(ctx, req.(*UpdatePaymentStatusRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _PaymentService_FailPayment_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdatePaymentStatusRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PaymentServiceServer).FailPayment(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/payment.PaymentService/FailPayment"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PaymentServiceServer).FailPayment(ctx, req.(*UpdatePaymentStatusRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// ── Client interface ──────────────────────────────────────────────────────────

type PaymentServiceClient interface {
	CreatePayment(ctx context.Context, in *CreatePaymentRequest, opts ...grpc.CallOption) (*PaymentResponse, error)
	GetPayment(ctx context.Context, in *GetPaymentRequest, opts ...grpc.CallOption) (*PaymentResponse, error)
	GetUserPayments(ctx context.Context, in *GetUserPaymentsRequest, opts ...grpc.CallOption) (*PaymentsList, error)
	CompletePayment(ctx context.Context, in *UpdatePaymentStatusRequest, opts ...grpc.CallOption) (*PaymentResponse, error)
	FailPayment(ctx context.Context, in *UpdatePaymentStatusRequest, opts ...grpc.CallOption) (*PaymentResponse, error)
}

type paymentServiceClient struct {
	cc grpc.ClientConnInterface
}

func NewPaymentServiceClient(cc grpc.ClientConnInterface) PaymentServiceClient {
	return &paymentServiceClient{cc}
}

func (c *paymentServiceClient) CreatePayment(ctx context.Context, in *CreatePaymentRequest, opts ...grpc.CallOption) (*PaymentResponse, error) {
	out := new(PaymentResponse)
	err := c.cc.Invoke(ctx, "/payment.PaymentService/CreatePayment", in, out, opts...)
	return out, err
}

func (c *paymentServiceClient) GetPayment(ctx context.Context, in *GetPaymentRequest, opts ...grpc.CallOption) (*PaymentResponse, error) {
	out := new(PaymentResponse)
	err := c.cc.Invoke(ctx, "/payment.PaymentService/GetPayment", in, out, opts...)
	return out, err
}

func (c *paymentServiceClient) GetUserPayments(ctx context.Context, in *GetUserPaymentsRequest, opts ...grpc.CallOption) (*PaymentsList, error) {
	out := new(PaymentsList)
	err := c.cc.Invoke(ctx, "/payment.PaymentService/GetUserPayments", in, out, opts...)
	return out, err
}

func (c *paymentServiceClient) CompletePayment(ctx context.Context, in *UpdatePaymentStatusRequest, opts ...grpc.CallOption) (*PaymentResponse, error) {
	out := new(PaymentResponse)
	err := c.cc.Invoke(ctx, "/payment.PaymentService/CompletePayment", in, out, opts...)
	return out, err
}

func (c *paymentServiceClient) FailPayment(ctx context.Context, in *UpdatePaymentStatusRequest, opts ...grpc.CallOption) (*PaymentResponse, error) {
	out := new(PaymentResponse)
	err := c.cc.Invoke(ctx, "/payment.PaymentService/FailPayment", in, out, opts...)
	return out, err
}
