package lessonpb

import "google.golang.org/protobuf/runtime/protoimpl"

// AttendanceStatusRecord is one per-student entry in a MarkAttendanceRequest.
type AttendanceStatusRecord struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	StudentId string `protobuf:"bytes,1,opt,name=student_id,json=studentId,proto3" json:"student_id,omitempty"`
	Status    string `protobuf:"bytes,2,opt,name=status,proto3" json:"status,omitempty"` // "present"|"absent"|"excused"
}

func (x *AttendanceStatusRecord) Reset()               { *x = AttendanceStatusRecord{} }
func (x *AttendanceStatusRecord) String() string        { return x.StudentId }
func (x *AttendanceStatusRecord) ProtoMessage()        {}
func (x *AttendanceStatusRecord) GetStudentId() string { return x.StudentId }
func (x *AttendanceStatusRecord) GetStatus() string    { return x.Status }

// MarkAttendanceRequest carries per-student attendance records for one lesson.
type MarkAttendanceRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	LessonId string                    `protobuf:"bytes,1,opt,name=lesson_id,json=lessonId,proto3" json:"lesson_id,omitempty"`
	Records  []*AttendanceStatusRecord `protobuf:"bytes,2,rep,name=records,proto3" json:"records,omitempty"`
}

func (x *MarkAttendanceRequest) Reset()                                { *x = MarkAttendanceRequest{} }
func (x *MarkAttendanceRequest) String() string                         { return x.LessonId }
func (x *MarkAttendanceRequest) ProtoMessage()                         {}
func (x *MarkAttendanceRequest) GetLessonId() string                   { return x.LessonId }
func (x *MarkAttendanceRequest) GetRecords() []*AttendanceStatusRecord { return x.Records }
