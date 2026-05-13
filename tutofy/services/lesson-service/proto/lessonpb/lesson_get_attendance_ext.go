package lessonpb

// GetAttendanceRequest / AttendanceRecord — supplemental types added without protoc regeneration.

import "google.golang.org/protobuf/runtime/protoimpl"

type GetAttendanceRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	LessonId string `protobuf:"bytes,1,opt,name=lesson_id,json=lessonId,proto3" json:"lesson_id,omitempty"`
}

func (x *GetAttendanceRequest) Reset()            { *x = GetAttendanceRequest{} }
func (x *GetAttendanceRequest) String() string     { return x.LessonId }
func (x *GetAttendanceRequest) ProtoMessage()     {}
func (x *GetAttendanceRequest) GetLessonId() string { return x.LessonId }

type AttendanceRecord struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	LessonId  string `protobuf:"bytes,1,opt,name=lesson_id,json=lessonId,proto3" json:"lesson_id,omitempty"`
	StudentId string `protobuf:"bytes,2,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	Attended  bool   `protobuf:"varint,3,opt,name=attended,proto3" json:"attended,omitempty"`
}

func (x *AttendanceRecord) Reset()            { *x = AttendanceRecord{} }
func (x *AttendanceRecord) String() string     { return x.LessonId }
func (x *AttendanceRecord) ProtoMessage()     {}
func (x *AttendanceRecord) GetLessonId() string  { return x.LessonId }
func (x *AttendanceRecord) GetStudentId() string { return x.StudentId }
func (x *AttendanceRecord) GetAttended() bool    { return x.Attended }

type AttendanceList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Records []*AttendanceRecord `protobuf:"bytes,1,rep,name=records,proto3" json:"records,omitempty"`
}

func (x *AttendanceList) Reset()          { *x = AttendanceList{} }
func (x *AttendanceList) String() string   { return "" }
func (x *AttendanceList) ProtoMessage()   {}
func (x *AttendanceList) GetRecords() []*AttendanceRecord { return x.Records }
