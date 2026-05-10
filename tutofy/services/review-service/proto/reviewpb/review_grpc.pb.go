package reviewpb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

// ── Messages ──────────────────────────────────────────────────────────────────

type CreateReviewRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	Rating   int32  `protobuf:"varint,2,opt,name=rating,proto3" json:"rating,omitempty"`
	Body     string `protobuf:"bytes,3,opt,name=body,proto3" json:"body,omitempty"`
}

func (x *CreateReviewRequest) Reset()          { *x = CreateReviewRequest{} }
func (x *CreateReviewRequest) String() string   { return x.CourseId }
func (x *CreateReviewRequest) ProtoMessage()   {}
func (x *CreateReviewRequest) GetCourseId() string { return x.CourseId }
func (x *CreateReviewRequest) GetRating() int32    { return x.Rating }
func (x *CreateReviewRequest) GetBody() string     { return x.Body }

type GetCourseReviewsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	Limit    int32  `protobuf:"varint,2,opt,name=limit,proto3" json:"limit,omitempty"`
	Offset   int32  `protobuf:"varint,3,opt,name=offset,proto3" json:"offset,omitempty"`
}

func (x *GetCourseReviewsRequest) Reset()           { *x = GetCourseReviewsRequest{} }
func (x *GetCourseReviewsRequest) String() string    { return x.CourseId }
func (x *GetCourseReviewsRequest) ProtoMessage()    {}
func (x *GetCourseReviewsRequest) GetCourseId() string { return x.CourseId }
func (x *GetCourseReviewsRequest) GetLimit() int32     { return x.Limit }
func (x *GetCourseReviewsRequest) GetOffset() int32    { return x.Offset }

type GetCourseRatingRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *GetCourseRatingRequest) Reset()           { *x = GetCourseRatingRequest{} }
func (x *GetCourseRatingRequest) String() string    { return x.CourseId }
func (x *GetCourseRatingRequest) ProtoMessage()    {}
func (x *GetCourseRatingRequest) GetCourseId() string { return x.CourseId }

type ReviewResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id        string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	CourseId  string `protobuf:"bytes,2,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
	StudentId string `protobuf:"bytes,3,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	Rating    int32  `protobuf:"varint,4,opt,name=rating,proto3" json:"rating,omitempty"`
	Body      string `protobuf:"bytes,5,opt,name=body,proto3" json:"body,omitempty"`
	CreatedAt string `protobuf:"bytes,6,opt,name=created_at,json=createdAt,proto3" json:"created_at,omitempty"`
}

func (x *ReviewResponse) Reset()           { *x = ReviewResponse{} }
func (x *ReviewResponse) String() string    { return x.Id }
func (x *ReviewResponse) ProtoMessage()    {}
func (x *ReviewResponse) GetId() string         { return x.Id }
func (x *ReviewResponse) GetCourseId() string   { return x.CourseId }
func (x *ReviewResponse) GetStudentId() string  { return x.StudentId }
func (x *ReviewResponse) GetRating() int32      { return x.Rating }
func (x *ReviewResponse) GetBody() string       { return x.Body }
func (x *ReviewResponse) GetCreatedAt() string  { return x.CreatedAt }

type ReviewsList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Reviews []*ReviewResponse `protobuf:"bytes,1,rep,name=reviews,proto3" json:"reviews,omitempty"`
}

func (x *ReviewsList) Reset()          { *x = ReviewsList{} }
func (x *ReviewsList) String() string   { return "" }
func (x *ReviewsList) ProtoMessage()   {}
func (x *ReviewsList) GetReviews() []*ReviewResponse { return x.Reviews }

type RatingResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Average float64 `protobuf:"fixed64,1,opt,name=average,proto3" json:"average,omitempty"`
	Count   int64   `protobuf:"varint,2,opt,name=count,proto3" json:"count,omitempty"`
}

func (x *RatingResponse) Reset()          { *x = RatingResponse{} }
func (x *RatingResponse) String() string   { return "" }
func (x *RatingResponse) ProtoMessage()   {}
func (x *RatingResponse) GetAverage() float64 { return x.Average }
func (x *RatingResponse) GetCount() int64     { return x.Count }

// ── Server interface ──────────────────────────────────────────────────────────

type ReviewServiceServer interface {
	CreateReview(context.Context, *CreateReviewRequest) (*ReviewResponse, error)
	GetCourseReviews(context.Context, *GetCourseReviewsRequest) (*ReviewsList, error)
	GetCourseRating(context.Context, *GetCourseRatingRequest) (*RatingResponse, error)
	mustEmbedUnimplementedReviewServiceServer()
}

type UnimplementedReviewServiceServer struct{}

func (UnimplementedReviewServiceServer) CreateReview(context.Context, *CreateReviewRequest) (*ReviewResponse, error) { return nil, nil }
func (UnimplementedReviewServiceServer) GetCourseReviews(context.Context, *GetCourseReviewsRequest) (*ReviewsList, error) { return nil, nil }
func (UnimplementedReviewServiceServer) GetCourseRating(context.Context, *GetCourseRatingRequest) (*RatingResponse, error) { return nil, nil }
func (UnimplementedReviewServiceServer) mustEmbedUnimplementedReviewServiceServer() {}

// ── Registration ──────────────────────────────────────────────────────────────

func RegisterReviewServiceServer(s grpc.ServiceRegistrar, srv ReviewServiceServer) {
	s.RegisterService(&ReviewService_ServiceDesc, srv)
}

var ReviewService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "review.ReviewService",
	HandlerType: (*ReviewServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "CreateReview", Handler: _ReviewService_CreateReview_Handler},
		{MethodName: "GetCourseReviews", Handler: _ReviewService_GetCourseReviews_Handler},
		{MethodName: "GetCourseRating", Handler: _ReviewService_GetCourseRating_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "review.proto",
}

func _ReviewService_CreateReview_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CreateReviewRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(ReviewServiceServer).CreateReview(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/review.ReviewService/CreateReview"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(ReviewServiceServer).CreateReview(ctx, req.(*CreateReviewRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _ReviewService_GetCourseReviews_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetCourseReviewsRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(ReviewServiceServer).GetCourseReviews(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/review.ReviewService/GetCourseReviews"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(ReviewServiceServer).GetCourseReviews(ctx, req.(*GetCourseReviewsRequest)) }
	return interceptor(ctx, in, info, handler)
}

func _ReviewService_GetCourseRating_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetCourseRatingRequest)
	if err := dec(in); err != nil { return nil, err }
	if interceptor == nil { return srv.(ReviewServiceServer).GetCourseRating(ctx, in) }
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/review.ReviewService/GetCourseRating"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) { return srv.(ReviewServiceServer).GetCourseRating(ctx, req.(*GetCourseRatingRequest)) }
	return interceptor(ctx, in, info, handler)
}

// ── Client ────────────────────────────────────────────────────────────────────

type ReviewServiceClient interface {
	CreateReview(ctx context.Context, in *CreateReviewRequest, opts ...grpc.CallOption) (*ReviewResponse, error)
	GetCourseReviews(ctx context.Context, in *GetCourseReviewsRequest, opts ...grpc.CallOption) (*ReviewsList, error)
	GetCourseRating(ctx context.Context, in *GetCourseRatingRequest, opts ...grpc.CallOption) (*RatingResponse, error)
}

type reviewServiceClient struct{ cc grpc.ClientConnInterface }

func NewReviewServiceClient(cc grpc.ClientConnInterface) ReviewServiceClient { return &reviewServiceClient{cc} }

func (c *reviewServiceClient) CreateReview(ctx context.Context, in *CreateReviewRequest, opts ...grpc.CallOption) (*ReviewResponse, error) {
	out := new(ReviewResponse); err := c.cc.Invoke(ctx, "/review.ReviewService/CreateReview", in, out, opts...); return out, err
}
func (c *reviewServiceClient) GetCourseReviews(ctx context.Context, in *GetCourseReviewsRequest, opts ...grpc.CallOption) (*ReviewsList, error) {
	out := new(ReviewsList); err := c.cc.Invoke(ctx, "/review.ReviewService/GetCourseReviews", in, out, opts...); return out, err
}
func (c *reviewServiceClient) GetCourseRating(ctx context.Context, in *GetCourseRatingRequest, opts ...grpc.CallOption) (*RatingResponse, error) {
	out := new(RatingResponse); err := c.cc.Invoke(ctx, "/review.ReviewService/GetCourseRating", in, out, opts...); return out, err
}
