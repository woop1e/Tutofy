package certificatepb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

// ── Request / Response types ──────────────────────────────────────────────────

type IssueCertificateRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	StudentId string `protobuf:"bytes,1,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	CourseId  string `protobuf:"bytes,2,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *IssueCertificateRequest) Reset()               { *x = IssueCertificateRequest{} }
func (x *IssueCertificateRequest) String() string        { return x.StudentId }
func (x *IssueCertificateRequest) ProtoMessage()        {}
func (x *IssueCertificateRequest) GetStudentId() string  { return x.StudentId }
func (x *IssueCertificateRequest) GetCourseId() string   { return x.CourseId }

type RequestCertificateRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *RequestCertificateRequest) Reset()             { *x = RequestCertificateRequest{} }
func (x *RequestCertificateRequest) String() string      { return x.CourseId }
func (x *RequestCertificateRequest) ProtoMessage()      {}
func (x *RequestCertificateRequest) GetCourseId() string { return x.CourseId }

type CertificateActionRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CertId string `protobuf:"bytes,1,opt,name=cert_id,json=certId,proto3" json:"cert_id,omitempty"`
}

func (x *CertificateActionRequest) Reset()           { *x = CertificateActionRequest{} }
func (x *CertificateActionRequest) String() string    { return x.CertId }
func (x *CertificateActionRequest) ProtoMessage()    {}
func (x *CertificateActionRequest) GetCertId() string { return x.CertId }

type GetPendingCertificatesRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *GetPendingCertificatesRequest) Reset()      { *x = GetPendingCertificatesRequest{} }
func (x *GetPendingCertificatesRequest) String() string { return "" }
func (x *GetPendingCertificatesRequest) ProtoMessage() {}

type GetCertificateRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	StudentId string `protobuf:"bytes,1,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	CourseId  string `protobuf:"bytes,2,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *GetCertificateRequest) Reset()              { *x = GetCertificateRequest{} }
func (x *GetCertificateRequest) String() string       { return x.StudentId }
func (x *GetCertificateRequest) ProtoMessage()       {}
func (x *GetCertificateRequest) GetStudentId() string { return x.StudentId }
func (x *GetCertificateRequest) GetCourseId() string  { return x.CourseId }

type GetUserCertificatesRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	StudentId string `protobuf:"bytes,1,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
}

func (x *GetUserCertificatesRequest) Reset()              { *x = GetUserCertificatesRequest{} }
func (x *GetUserCertificatesRequest) String() string       { return x.StudentId }
func (x *GetUserCertificatesRequest) ProtoMessage()       {}
func (x *GetUserCertificatesRequest) GetStudentId() string { return x.StudentId }

type CertificateResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id          string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	StudentId   string `protobuf:"bytes,2,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	CourseId    string `protobuf:"bytes,3,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	IssuedAt    string `protobuf:"bytes,4,opt,name=issued_at,json=issuedAt,proto3" json:"issued_at,omitempty"`
	TutorId     string `protobuf:"bytes,5,opt,name=tutor_id,json=tutorId,proto3" json:"tutor_id,omitempty"`
	Status      int32  `protobuf:"varint,6,opt,name=status,proto3" json:"status,omitempty"`
	StudentName string `protobuf:"bytes,7,opt,name=student_name,json=studentName,proto3" json:"student_name,omitempty"`
	CourseName  string `protobuf:"bytes,8,opt,name=course_name,json=courseName,proto3" json:"course_name,omitempty"`
	TutorName   string `protobuf:"bytes,9,opt,name=tutor_name,json=tutorName,proto3" json:"tutor_name,omitempty"`
}

func (x *CertificateResponse) Reset()              { *x = CertificateResponse{} }
func (x *CertificateResponse) String() string       { return x.Id }
func (x *CertificateResponse) ProtoMessage()       {}
func (x *CertificateResponse) GetId() string         { return x.Id }
func (x *CertificateResponse) GetStudentId() string  { return x.StudentId }
func (x *CertificateResponse) GetCourseId() string   { return x.CourseId }
func (x *CertificateResponse) GetIssuedAt() string   { return x.IssuedAt }
func (x *CertificateResponse) GetTutorId() string    { return x.TutorId }
func (x *CertificateResponse) GetStatus() int32      { return x.Status }
func (x *CertificateResponse) GetStudentName() string { return x.StudentName }
func (x *CertificateResponse) GetCourseName() string  { return x.CourseName }
func (x *CertificateResponse) GetTutorName() string   { return x.TutorName }

type CertificatesList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Certificates []*CertificateResponse `protobuf:"bytes,1,rep,name=certificates,proto3" json:"certificates,omitempty"`
}

func (x *CertificatesList) Reset()                                   { *x = CertificatesList{} }
func (x *CertificatesList) String() string                            { return "" }
func (x *CertificatesList) ProtoMessage()                            {}
func (x *CertificatesList) GetCertificates() []*CertificateResponse { return x.Certificates }

// ── Server interface ──────────────────────────────────────────────────────────

type CertificateServiceServer interface {
	IssueCertificate(context.Context, *IssueCertificateRequest) (*CertificateResponse, error)
	GetCertificate(context.Context, *GetCertificateRequest) (*CertificateResponse, error)
	GetUserCertificates(context.Context, *GetUserCertificatesRequest) (*CertificatesList, error)
	RequestCertificate(context.Context, *RequestCertificateRequest) (*CertificateResponse, error)
	ApproveCertificate(context.Context, *CertificateActionRequest) (*CertificateResponse, error)
	RejectCertificate(context.Context, *CertificateActionRequest) (*CertificateResponse, error)
	GetPendingCertificates(context.Context, *GetPendingCertificatesRequest) (*CertificatesList, error)
	mustEmbedUnimplementedCertificateServiceServer()
}

type UnimplementedCertificateServiceServer struct{}

func (UnimplementedCertificateServiceServer) IssueCertificate(context.Context, *IssueCertificateRequest) (*CertificateResponse, error) {
	return nil, nil
}
func (UnimplementedCertificateServiceServer) GetCertificate(context.Context, *GetCertificateRequest) (*CertificateResponse, error) {
	return nil, nil
}
func (UnimplementedCertificateServiceServer) GetUserCertificates(context.Context, *GetUserCertificatesRequest) (*CertificatesList, error) {
	return nil, nil
}
func (UnimplementedCertificateServiceServer) RequestCertificate(context.Context, *RequestCertificateRequest) (*CertificateResponse, error) {
	return nil, nil
}
func (UnimplementedCertificateServiceServer) ApproveCertificate(context.Context, *CertificateActionRequest) (*CertificateResponse, error) {
	return nil, nil
}
func (UnimplementedCertificateServiceServer) RejectCertificate(context.Context, *CertificateActionRequest) (*CertificateResponse, error) {
	return nil, nil
}
func (UnimplementedCertificateServiceServer) GetPendingCertificates(context.Context, *GetPendingCertificatesRequest) (*CertificatesList, error) {
	return nil, nil
}
func (UnimplementedCertificateServiceServer) mustEmbedUnimplementedCertificateServiceServer() {}

func RegisterCertificateServiceServer(s grpc.ServiceRegistrar, srv CertificateServiceServer) {
	s.RegisterService(&CertificateService_ServiceDesc, srv)
}

var CertificateService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "certificate.CertificateService",
	HandlerType: (*CertificateServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "IssueCertificate", Handler: _IssueCertificate_Handler},
		{MethodName: "GetCertificate", Handler: _GetCertificate_Handler},
		{MethodName: "GetUserCertificates", Handler: _GetUserCertificates_Handler},
		{MethodName: "RequestCertificate", Handler: _RequestCertificate_Handler},
		{MethodName: "ApproveCertificate", Handler: _ApproveCertificate_Handler},
		{MethodName: "RejectCertificate", Handler: _RejectCertificate_Handler},
		{MethodName: "GetPendingCertificates", Handler: _GetPendingCertificates_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "certificate.proto",
}

func _IssueCertificate_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(IssueCertificateRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CertificateServiceServer).IssueCertificate(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/certificate.CertificateService/IssueCertificate"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CertificateServiceServer).IssueCertificate(ctx, req.(*IssueCertificateRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _GetCertificate_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetCertificateRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CertificateServiceServer).GetCertificate(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/certificate.CertificateService/GetCertificate"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CertificateServiceServer).GetCertificate(ctx, req.(*GetCertificateRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _GetUserCertificates_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetUserCertificatesRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CertificateServiceServer).GetUserCertificates(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/certificate.CertificateService/GetUserCertificates"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CertificateServiceServer).GetUserCertificates(ctx, req.(*GetUserCertificatesRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _RequestCertificate_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(RequestCertificateRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CertificateServiceServer).RequestCertificate(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/certificate.CertificateService/RequestCertificate"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CertificateServiceServer).RequestCertificate(ctx, req.(*RequestCertificateRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _ApproveCertificate_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CertificateActionRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CertificateServiceServer).ApproveCertificate(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/certificate.CertificateService/ApproveCertificate"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CertificateServiceServer).ApproveCertificate(ctx, req.(*CertificateActionRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _RejectCertificate_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CertificateActionRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CertificateServiceServer).RejectCertificate(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/certificate.CertificateService/RejectCertificate"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CertificateServiceServer).RejectCertificate(ctx, req.(*CertificateActionRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _GetPendingCertificates_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetPendingCertificatesRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(CertificateServiceServer).GetPendingCertificates(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/certificate.CertificateService/GetPendingCertificates"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CertificateServiceServer).GetPendingCertificates(ctx, req.(*GetPendingCertificatesRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// ── Client ────────────────────────────────────────────────────────────────────

type CertificateServiceClient interface {
	IssueCertificate(ctx context.Context, in *IssueCertificateRequest, opts ...grpc.CallOption) (*CertificateResponse, error)
	GetCertificate(ctx context.Context, in *GetCertificateRequest, opts ...grpc.CallOption) (*CertificateResponse, error)
	GetUserCertificates(ctx context.Context, in *GetUserCertificatesRequest, opts ...grpc.CallOption) (*CertificatesList, error)
	RequestCertificate(ctx context.Context, in *RequestCertificateRequest, opts ...grpc.CallOption) (*CertificateResponse, error)
	ApproveCertificate(ctx context.Context, in *CertificateActionRequest, opts ...grpc.CallOption) (*CertificateResponse, error)
	RejectCertificate(ctx context.Context, in *CertificateActionRequest, opts ...grpc.CallOption) (*CertificateResponse, error)
	GetPendingCertificates(ctx context.Context, in *GetPendingCertificatesRequest, opts ...grpc.CallOption) (*CertificatesList, error)
}

type certificateServiceClient struct{ cc grpc.ClientConnInterface }

func NewCertificateServiceClient(cc grpc.ClientConnInterface) CertificateServiceClient {
	return &certificateServiceClient{cc}
}

func (c *certificateServiceClient) IssueCertificate(ctx context.Context, in *IssueCertificateRequest, opts ...grpc.CallOption) (*CertificateResponse, error) {
	out := new(CertificateResponse)
	return out, c.cc.Invoke(ctx, "/certificate.CertificateService/IssueCertificate", in, out, opts...)
}
func (c *certificateServiceClient) GetCertificate(ctx context.Context, in *GetCertificateRequest, opts ...grpc.CallOption) (*CertificateResponse, error) {
	out := new(CertificateResponse)
	return out, c.cc.Invoke(ctx, "/certificate.CertificateService/GetCertificate", in, out, opts...)
}
func (c *certificateServiceClient) GetUserCertificates(ctx context.Context, in *GetUserCertificatesRequest, opts ...grpc.CallOption) (*CertificatesList, error) {
	out := new(CertificatesList)
	return out, c.cc.Invoke(ctx, "/certificate.CertificateService/GetUserCertificates", in, out, opts...)
}
func (c *certificateServiceClient) RequestCertificate(ctx context.Context, in *RequestCertificateRequest, opts ...grpc.CallOption) (*CertificateResponse, error) {
	out := new(CertificateResponse)
	return out, c.cc.Invoke(ctx, "/certificate.CertificateService/RequestCertificate", in, out, opts...)
}
func (c *certificateServiceClient) ApproveCertificate(ctx context.Context, in *CertificateActionRequest, opts ...grpc.CallOption) (*CertificateResponse, error) {
	out := new(CertificateResponse)
	return out, c.cc.Invoke(ctx, "/certificate.CertificateService/ApproveCertificate", in, out, opts...)
}
func (c *certificateServiceClient) RejectCertificate(ctx context.Context, in *CertificateActionRequest, opts ...grpc.CallOption) (*CertificateResponse, error) {
	out := new(CertificateResponse)
	return out, c.cc.Invoke(ctx, "/certificate.CertificateService/RejectCertificate", in, out, opts...)
}
func (c *certificateServiceClient) GetPendingCertificates(ctx context.Context, in *GetPendingCertificatesRequest, opts ...grpc.CallOption) (*CertificatesList, error) {
	out := new(CertificatesList)
	return out, c.cc.Invoke(ctx, "/certificate.CertificateService/GetPendingCertificates", in, out, opts...)
}
