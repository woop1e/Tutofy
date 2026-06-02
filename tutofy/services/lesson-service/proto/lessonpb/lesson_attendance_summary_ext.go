package lessonpb

import "google.golang.org/protobuf/runtime/protoimpl"

type GetCourseAttendanceSummaryRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	CourseId string `protobuf:"bytes,1,opt,name=course_id,json=courseId,proto3" json:"course_id,omitempty"`
}

func (x *GetCourseAttendanceSummaryRequest) Reset()              { *x = GetCourseAttendanceSummaryRequest{} }
func (x *GetCourseAttendanceSummaryRequest) String() string       { return x.CourseId }
func (x *GetCourseAttendanceSummaryRequest) ProtoMessage()       {}
func (x *GetCourseAttendanceSummaryRequest) GetCourseId() string { return x.CourseId }

type StudentAttendanceSummary struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	StudentId string `protobuf:"bytes,1,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	Attended  int32  `protobuf:"varint,2,opt,name=attended,proto3" json:"attended,omitempty"`
	Total     int32  `protobuf:"varint,3,opt,name=total,proto3" json:"total,omitempty"`
}

func (x *StudentAttendanceSummary) Reset()               { *x = StudentAttendanceSummary{} }
func (x *StudentAttendanceSummary) String() string        { return x.StudentId }
func (x *StudentAttendanceSummary) ProtoMessage()        {}
func (x *StudentAttendanceSummary) GetStudentId() string { return x.StudentId }
func (x *StudentAttendanceSummary) GetAttended() int32   { return x.Attended }
func (x *StudentAttendanceSummary) GetTotal() int32      { return x.Total }

type CourseAttendanceSummary struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Summaries []*StudentAttendanceSummary `protobuf:"bytes,1,rep,name=summaries,proto3" json:"summaries,omitempty"`
}

func (x *CourseAttendanceSummary) Reset()                                     { *x = CourseAttendanceSummary{} }
func (x *CourseAttendanceSummary) String() string                              { return "" }
func (x *CourseAttendanceSummary) ProtoMessage()                              {}
func (x *CourseAttendanceSummary) GetSummaries() []*StudentAttendanceSummary  { return x.Summaries }
