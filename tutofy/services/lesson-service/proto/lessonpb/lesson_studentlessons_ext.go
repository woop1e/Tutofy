package lessonpb

import "google.golang.org/protobuf/runtime/protoimpl"

// GetStudentLessonsRequest fetches individual (non-course) lessons for a student.
type GetStudentLessonsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	StudentId string `protobuf:"bytes,1,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
}

func (x *GetStudentLessonsRequest) Reset()               { *x = GetStudentLessonsRequest{} }
func (x *GetStudentLessonsRequest) String() string        { return x.StudentId }
func (x *GetStudentLessonsRequest) ProtoMessage()        {}
func (x *GetStudentLessonsRequest) GetStudentId() string { return x.StudentId }
