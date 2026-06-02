package lessonpb

import "google.golang.org/protobuf/runtime/protoimpl"

// GetLessonDescriptionsRequest asks for descriptions of all lessons in a course.
// Uses simple struct tags (no rawDesc) so all fields transmit correctly over gRPC.
type GetLessonDescriptionsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *GetLessonDescriptionsRequest) Reset()              { *x = GetLessonDescriptionsRequest{} }
func (x *GetLessonDescriptionsRequest) String() string       { return x.CourseId }
func (x *GetLessonDescriptionsRequest) ProtoMessage()       {}
func (x *GetLessonDescriptionsRequest) GetCourseId() string { return x.CourseId }

type LessonDescription struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id          string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Description string `protobuf:"bytes,2,opt,name=description,proto3" json:"description,omitempty"`
}

func (x *LessonDescription) Reset()                { *x = LessonDescription{} }
func (x *LessonDescription) String() string         { return x.Id }
func (x *LessonDescription) ProtoMessage()         {}
func (x *LessonDescription) GetId() string          { return x.Id }
func (x *LessonDescription) GetDescription() string { return x.Description }

type LessonDescriptionsList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Items []*LessonDescription `protobuf:"bytes,1,rep,name=items,proto3" json:"items,omitempty"`
}

func (x *LessonDescriptionsList) Reset()                          { *x = LessonDescriptionsList{} }
func (x *LessonDescriptionsList) String() string                   { return "" }
func (x *LessonDescriptionsList) ProtoMessage()                   {}
func (x *LessonDescriptionsList) GetItems() []*LessonDescription  { return x.Items }
