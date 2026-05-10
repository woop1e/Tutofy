package lessonpb

// MarkAttendanceRequest is a supplemental message type added without protoc regeneration.
// Wire encoding will work correctly after protoc is re-run with the updated lesson.proto.

import "google.golang.org/protobuf/runtime/protoimpl"

type MarkAttendanceRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	LessonId   string   `protobuf:"bytes,1,opt,name=lesson_id,json=lessonId,proto3" json:"lesson_id,omitempty"`
	StudentIds []string `protobuf:"bytes,2,rep,name=student_ids,json=studentIds,proto3" json:"student_ids,omitempty"`
	Attended   bool     `protobuf:"varint,3,opt,name=attended,proto3" json:"attended,omitempty"`
}

func (x *MarkAttendanceRequest) Reset()               { *x = MarkAttendanceRequest{} }
func (x *MarkAttendanceRequest) String() string        { return x.LessonId }
func (x *MarkAttendanceRequest) ProtoMessage()        {}
func (x *MarkAttendanceRequest) GetLessonId() string     { return x.LessonId }
func (x *MarkAttendanceRequest) GetStudentIds() []string { return x.StudentIds }
func (x *MarkAttendanceRequest) GetAttended() bool       { return x.Attended }
