package lessonpb

// GetScheduleRequest is a supplemental message type for the calendar endpoint.
// Wire encoding will work correctly after protoc is re-run with the updated lesson.proto.

import "google.golang.org/protobuf/runtime/protoimpl"

type GetScheduleRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	FromDate string `protobuf:"bytes,1,opt,name=from_date,json=fromDate,proto3" json:"from_date,omitempty"` // RFC3339
	ToDate   string `protobuf:"bytes,2,opt,name=to_date,json=toDate,proto3" json:"to_date,omitempty"`       // RFC3339
}

func (x *GetScheduleRequest) Reset()           { *x = GetScheduleRequest{} }
func (x *GetScheduleRequest) String() string    { return x.FromDate }
func (x *GetScheduleRequest) ProtoMessage()    {}
func (x *GetScheduleRequest) GetFromDate() string { return x.FromDate }
func (x *GetScheduleRequest) GetToDate() string   { return x.ToDate }
