package lessonpb

import "google.golang.org/protobuf/runtime/protoimpl"

// RateLessonRequest lets a student rate a completed individual lesson (1-5 stars).
type RateLessonRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	LessonId string `protobuf:"bytes,1,opt,name=lesson_id,json=lessonId,proto3" json:"lesson_id,omitempty"`
	Rating   int32  `protobuf:"varint,2,opt,name=rating,proto3" json:"rating,omitempty"`
}

func (x *RateLessonRequest) Reset()              { *x = RateLessonRequest{} }
func (x *RateLessonRequest) String() string       { return x.LessonId }
func (x *RateLessonRequest) ProtoMessage()       {}
func (x *RateLessonRequest) GetLessonId() string { return x.LessonId }
func (x *RateLessonRequest) GetRating() int32    { return x.Rating }
