package lessonpb

// Lesson material messages — added without protoc regeneration.

import "google.golang.org/protobuf/runtime/protoimpl"

type AddMaterialRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	LessonId string `protobuf:"bytes,1,opt,name=lesson_id,json=lessonId,proto3" json:"lesson_id,omitempty"`
	FileId   string `protobuf:"bytes,2,opt,name=file_id,json=fileId,proto3" json:"file_id,omitempty"`
	Title    string `protobuf:"bytes,3,opt,name=title,proto3" json:"title,omitempty"`
}

func (x *AddMaterialRequest) Reset()            { *x = AddMaterialRequest{} }
func (x *AddMaterialRequest) String() string     { return x.LessonId }
func (x *AddMaterialRequest) ProtoMessage()     {}
func (x *AddMaterialRequest) GetLessonId() string { return x.LessonId }
func (x *AddMaterialRequest) GetFileId() string   { return x.FileId }
func (x *AddMaterialRequest) GetTitle() string    { return x.Title }

type GetLessonMaterialsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	LessonId string `protobuf:"bytes,1,opt,name=lesson_id,json=lessonId,proto3" json:"lesson_id,omitempty"`
}

func (x *GetLessonMaterialsRequest) Reset()            { *x = GetLessonMaterialsRequest{} }
func (x *GetLessonMaterialsRequest) String() string     { return x.LessonId }
func (x *GetLessonMaterialsRequest) ProtoMessage()     {}
func (x *GetLessonMaterialsRequest) GetLessonId() string { return x.LessonId }

type MaterialResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id         string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	LessonId   string `protobuf:"bytes,2,opt,name=lesson_id,json=lessonId,proto3" json:"lesson_id,omitempty"`
	FileId     string `protobuf:"bytes,3,opt,name=file_id,json=fileId,proto3" json:"file_id,omitempty"`
	Title      string `protobuf:"bytes,4,opt,name=title,proto3" json:"title,omitempty"`
	UploadedAt string `protobuf:"bytes,5,opt,name=uploaded_at,json=uploadedAt,proto3" json:"uploaded_at,omitempty"`
}

func (x *MaterialResponse) Reset()              { *x = MaterialResponse{} }
func (x *MaterialResponse) String() string       { return x.Id }
func (x *MaterialResponse) ProtoMessage()        {}
func (x *MaterialResponse) GetId() string          { return x.Id }
func (x *MaterialResponse) GetLessonId() string    { return x.LessonId }
func (x *MaterialResponse) GetFileId() string      { return x.FileId }
func (x *MaterialResponse) GetTitle() string       { return x.Title }
func (x *MaterialResponse) GetUploadedAt() string  { return x.UploadedAt }

type MaterialsList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Materials []*MaterialResponse `protobuf:"bytes,1,rep,name=materials,proto3" json:"materials,omitempty"`
}

func (x *MaterialsList) Reset()          { *x = MaterialsList{} }
func (x *MaterialsList) String() string   { return "" }
func (x *MaterialsList) ProtoMessage()   {}
func (x *MaterialsList) GetMaterials() []*MaterialResponse { return x.Materials }
