package lessonpb

import "google.golang.org/protobuf/runtime/protoimpl"

// GetTutorBookedSlotsRequest asks for all upcoming booked hour-slots for a tutor.
// No auth required — called by the public marketplace profile page.
type GetTutorBookedSlotsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	TutorId string `protobuf:"bytes,1,opt,name=tutor_id,json=tutorId,proto3" json:"tutor_id,omitempty"`
}

func (x *GetTutorBookedSlotsRequest) Reset()            { *x = GetTutorBookedSlotsRequest{} }
func (x *GetTutorBookedSlotsRequest) String() string     { return x.TutorId }
func (x *GetTutorBookedSlotsRequest) ProtoMessage()      {}
func (x *GetTutorBookedSlotsRequest) GetTutorId() string { return x.TutorId }

// TutorBookedSlotsResponse returns RFC3339 timestamps of booked individual lessons.
type TutorBookedSlotsResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	ScheduledAts []string `protobuf:"bytes,1,rep,name=scheduled_ats,json=scheduledAts,proto3" json:"scheduled_ats,omitempty"`
}

func (x *TutorBookedSlotsResponse) Reset()               { *x = TutorBookedSlotsResponse{} }
func (x *TutorBookedSlotsResponse) String() string        { return "" }
func (x *TutorBookedSlotsResponse) ProtoMessage()         {}
func (x *TutorBookedSlotsResponse) GetScheduledAts() []string { return x.ScheduledAts }
