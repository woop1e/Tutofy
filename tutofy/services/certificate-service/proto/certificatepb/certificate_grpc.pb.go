package certificatepb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

type IssueCertificateRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	StudentId string `protobuf:"bytes,1,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	CourseId  string `protobuf:"bytes,2,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *IssueCertificateRequest) Reset()             { *x = IssueCertificateRequest{} }
func (x *IssueCertificateRequest) String() string      { return x.StudentId }
func (x *IssueCertificateRequest) ProtoMessage()      {}
func (x *IssueCertificateRequest) GetStudentId() string { return x.StudentId }
func (x *IssueCertificateRequest) GetCourseId() string  { return x.CourseId }

type GetCertificateRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	StudentId string `protobuf:"bytes,1,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	CourseId  string `protobuf:"bytes,2,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *GetCertificateRequest) Reset()             { *x = GetCertificateRequest{} }
func (x *GetCertificateRequest) String() string      { return x.StudentId }
func (x *GetCertificateRequest) ProtoMessage()      {}
func (x *GetCertificateRequest) GetStudentId() string { return x.StudentId }
func (x *GetCertificateRequest) GetCourseId() string  { return x.CourseId }

type GetUserCertificatesRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	StudentId string `protobuf:"bytes,1,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
}

func (x *GetUserCertificatesRequest) Reset()             { *x = GetUserCertificatesRequest{} }
func (x *GetUserCertificatesRequest) String() string      { return x.StudentId }
func (x *GetUserCertificatesRequest) ProtoMessage()      {}
func (x *GetUserCertificatesRequest) GetStudentId() string { return x.StudentId }

type CertificateResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id        string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	StudentId string `protobuf:"bytes,2,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	CourseId  string `protobuf:"bytes,3,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	IssuedAt  string `protobuf:"bytes,4,opt,name=issued_at,json=issuedAt,proto3" json:"issued_at,omitempty"`
}

func (x *CertificateResponse) Reset()           { *x = CertificateResponse{} }
func (x *CertificateResponse) String() string    { return x.Id }
func (x *CertificateResponse) ProtoMessage()    {}
func (x *CertificateResponse) GetId() string         { return x.Id }
func (x *CertificateResponse) GetStudentId() string  { return x.StudentId }
func (x *CertificateResponse) GetCourseId() string   { return x.CourseId }
func (x *CertificateResponse) GetIssuedAt() string   { return x.IssuedAt }

type CertificatesList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Certificates []*CertificateResponse `protobuf:"bytes,1,rep,name=certificates,proto3" json:"certificates,omitempty"`
}

func (x *CertificatesList) Reset()          { *x = CertificatesList{} }
func (x *CertificatesList) String() string   { return "" }
func (x *CertificatesList) ProtoMessage()   {}
func (x *CertificatesList) GetCertificates() []*CertificateResponse { return x.Certificates }

// ── Server interface ──────────────────────────────────────────────────────────

type CertificateServiceServer interface {
	IssueCertificate(context.Context, *IssueCertificateRequest) (*CertificateResponse, error)
	GetCertificate(context.Context, *GetCertificateRequest) (*CertificateResponse, error)
	GetUserCertificates(context.Context, *GetUserCertificatesRequest) (*CertificatesList, error)
	mustEmbedUnimplementedCertificateServiceServer()
}

type UnimplementedCertificateServiceServer struct{}

func (UnimplementedCertificateServiceServer) IssueCertificate(context.Context, *IssueCertificateRequest) (*CertificateResponse, error) { return nil, nil }
func (UnimplementedCertificateServiceServer) GetCertificate(context.Context, *GetCertificateRequest) (*CertificateResponse, error) { return nil, nil }
func (UnimplementedCertificateServiceServer) GetUserCertificates(context.Context, *GetUserCertificatesRequest) (*CertificatesList, error) { return nil, nil }
func (UnimplementedCertificateServiceServer) mustEmbedUnimplementedCertificateServiceServer() {}

func RegisterCertificateServiceServer(s grpc.ServiceRegistrar, srv CertificateServiceServer) {
	s.RegisterService(&CertificateService_ServiceDesc, srv)
}

var CertificateService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "certificate.CertificateService",
	HandlerType: (*CertificateServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "IssueCertificate", Handler: _CertificateService_IssueCertificate_Handler},
		{MethodName: "GetCertificate", Handler: _CertificateService_GetCertificate_Handler},
		{MethodName: "GetUserCertificates", Handler: _CertificateService_GetUserCertificates_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "certificate.proto",
}

func _CertificateService_IssueCertificate_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(IssueCertificateRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CertificateServiceServer).IssueCertificate(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/certificate.CertificateService/IssueCertificate"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(CertificateServiceServer).IssueCertificate(ctx, req.(*IssueCertificateRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _CertificateService_GetCertificate_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetCertificateRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CertificateServiceServer).GetCertificate(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/certificate.CertificateService/GetCertificate"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(CertificateServiceServer).GetCertificate(ctx, req.(*GetCertificateRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _CertificateService_GetUserCertificates_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetUserCertificatesRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CertificateServiceServer).GetUserCertificates(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/certificate.CertificateService/GetUserCertificates"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(CertificateServiceServer).GetUserCertificates(ctx, req.(*GetUserCertificatesRequest)) }
	return interceptor(ctx, in, info, handler)
}

// ── Client ────────────────────────────────────────────────────────────────────

type CertificateServiceClient interface {
	IssueCertificate(ctx context.Context, in *IssueCertificateRequest, opts ...grpc.CallOption) (*CertificateResponse, error)
	GetCertificate(ctx context.Context, in *GetCertificateRequest, opts ...grpc.CallOption) (*CertificateResponse, error)
	GetUserCertificates(ctx context.Context, in *GetUserCertificatesRequest, opts ...grpc.CallOption) (*CertificatesList, error)
}

type certificateServiceClient struct{ cc grpc.ClientConnInterface }

func NewCertificateServiceClient(cc grpc.ClientConnInterface) CertificateServiceClient {
	return &certificateServiceClient{cc}
}

func (c *certificateServiceClient) IssueCertificate(ctx context.Context, in *IssueCertificateRequest, opts ...grpc.CallOption) (*CertificateResponse, error) {
	out := new(CertificateResponse); err := c.cc.Invoke(ctx, "/certificate.CertificateService/IssueCertificate", in, out, opts...); return out, err
}
func (c *certificateServiceClient) GetCertificate(ctx context.Context, in *GetCertificateRequest, opts ...grpc.CallOption) (*CertificateResponse, error) {
	out := new(CertificateResponse); err := c.cc.Invoke(ctx, "/certificate.CertificateService/GetCertificate", in, out, opts...); return out, err
}
func (c *certificateServiceClient) GetUserCertificates(ctx context.Context, in *GetUserCertificatesRequest, opts ...grpc.CallOption) (*CertificatesList, error) {
	out := new(CertificatesList); err := c.cc.Invoke(ctx, "/certificate.CertificateService/GetUserCertificates", in, out, opts...); return out, err
}
