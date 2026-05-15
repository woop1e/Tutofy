package lessonpb

import "google.golang.org/protobuf/runtime/protoimpl"

// SetVideoLinkRequest is a supplemental message for updating a lesson's video link.
type SetVideoLinkRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	LessonId  string `protobuf:"bytes,1,opt,name=lesson_id,json=lessonId,proto3" json:"lesson_id,omitempty"`
	VideoLink string `protobuf:"bytes,2,opt,name=video_link,json=videoLink,proto3" json:"video_link,omitempty"`
}

func (x *SetVideoLinkRequest) Reset()              { *x = SetVideoLinkRequest{} }
func (x *SetVideoLinkRequest) String() string      { return x.LessonId }
func (x *SetVideoLinkRequest) ProtoMessage()       {}
func (x *SetVideoLinkRequest) GetLessonId() string { return x.LessonId }
func (x *SetVideoLinkRequest) GetVideoLink() string { return x.VideoLink }
