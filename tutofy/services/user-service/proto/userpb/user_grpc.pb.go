package userpb

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/runtime/protoimpl"
)

// ── Messages ─────────────────────────────────────────────────────────────────

type CreateUserRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id    string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Email string `protobuf:"bytes,2,opt,name=email,proto3" json:"email,omitempty"`
	Name  string `protobuf:"bytes,3,opt,name=name,proto3" json:"name,omitempty"`
	Role  string `protobuf:"bytes,4,opt,name=role,proto3" json:"role,omitempty"`
}

func (x *CreateUserRequest) Reset()         { *x = CreateUserRequest{} }
func (x *CreateUserRequest) String() string  { return x.Id }
func (x *CreateUserRequest) ProtoMessage()  {}
func (x *CreateUserRequest) GetId() string    { return x.Id }
func (x *CreateUserRequest) GetEmail() string { return x.Email }
func (x *CreateUserRequest) GetName() string  { return x.Name }
func (x *CreateUserRequest) GetRole() string  { return x.Role }

type GetUserRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
}

func (x *GetUserRequest) Reset()        { *x = GetUserRequest{} }
func (x *GetUserRequest) String() string { return x.UserId }
func (x *GetUserRequest) ProtoMessage() {}
func (x *GetUserRequest) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}

type UpdateUserRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	Name   string `protobuf:"bytes,2,opt,name=name,proto3" json:"name,omitempty"`
	Email  string `protobuf:"bytes,3,opt,name=email,proto3" json:"email,omitempty"`
}

func (x *UpdateUserRequest) Reset()        { *x = UpdateUserRequest{} }
func (x *UpdateUserRequest) String() string { return x.UserId }
func (x *UpdateUserRequest) ProtoMessage() {}
func (x *UpdateUserRequest) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}
func (x *UpdateUserRequest) GetName() string {
	if x != nil {
		return x.Name
	}
	return ""
}
func (x *UpdateUserRequest) GetEmail() string {
	if x != nil {
		return x.Email
	}
	return ""
}

type UserResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id    string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Email string `protobuf:"bytes,2,opt,name=email,proto3" json:"email,omitempty"`
	Name  string `protobuf:"bytes,3,opt,name=name,proto3" json:"name,omitempty"`
	Role  string `protobuf:"bytes,4,opt,name=role,proto3" json:"role,omitempty"`
}

func (x *UserResponse) Reset()        { *x = UserResponse{} }
func (x *UserResponse) String() string { return x.Id }
func (x *UserResponse) ProtoMessage() {}
func (x *UserResponse) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}
func (x *UserResponse) GetEmail() string {
	if x != nil {
		return x.Email
	}
	return ""
}
func (x *UserResponse) GetName() string {
	if x != nil {
		return x.Name
	}
	return ""
}
func (x *UserResponse) GetRole() string {
	if x != nil {
		return x.Role
	}
	return ""
}

type UsersList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Users []*UserResponse `protobuf:"bytes,1,rep,name=users,proto3" json:"users,omitempty"`
}

func (x *UsersList) Reset()        { *x = UsersList{} }
func (x *UsersList) String() string { return "" }
func (x *UsersList) ProtoMessage() {}
func (x *UsersList) GetUsers() []*UserResponse {
	if x != nil {
		return x.Users
	}
	return nil
}

type DeleteUserRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId string `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
}

func (x *DeleteUserRequest) Reset()        { *x = DeleteUserRequest{} }
func (x *DeleteUserRequest) String() string { return x.UserId }
func (x *DeleteUserRequest) ProtoMessage() {}
func (x *DeleteUserRequest) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}

type UpdateTutorProfileRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	UserId             string   `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	Bio                string   `protobuf:"bytes,2,opt,name=bio,proto3" json:"bio,omitempty"`
	Age                int32    `protobuf:"varint,3,opt,name=age,proto3" json:"age,omitempty"`
	Location           string   `protobuf:"bytes,4,opt,name=location,proto3" json:"location,omitempty"`
	PhotoUrl           string   `protobuf:"bytes,5,opt,name=photo_url,json=photoUrl,proto3" json:"photo_url,omitempty"`
	Subjects           []string `protobuf:"bytes,6,rep,name=subjects,proto3" json:"subjects,omitempty"`
	ExperienceYears    int32    `protobuf:"varint,7,opt,name=experience_years,json=experienceYears,proto3" json:"experience_years,omitempty"`
	Certificates       []string `protobuf:"bytes,8,rep,name=certificates,proto3" json:"certificates,omitempty"`
	Phone              string   `protobuf:"bytes,9,opt,name=phone,proto3" json:"phone,omitempty"`
	TeachingLanguage   string   `protobuf:"bytes,10,opt,name=teaching_language,json=teachingLanguage,proto3" json:"teaching_language,omitempty"`
	StudentLevel       string   `protobuf:"bytes,11,opt,name=student_level,json=studentLevel,proto3" json:"student_level,omitempty"`
	LessonType         string   `protobuf:"bytes,12,opt,name=lesson_type,json=lessonType,proto3" json:"lesson_type,omitempty"`
	HourlyPrice        int32    `protobuf:"varint,13,opt,name=hourly_price,json=hourlyPrice,proto3" json:"hourly_price,omitempty"`
	Education          string   `protobuf:"bytes,14,opt,name=education,proto3" json:"education,omitempty"`
	AvailableDays      []string `protobuf:"bytes,15,rep,name=available_days,json=availableDays,proto3" json:"available_days,omitempty"`
	AvailableTimeStart string   `protobuf:"bytes,16,opt,name=available_time_start,json=availableTimeStart,proto3" json:"available_time_start,omitempty"`
	AvailableTimeEnd   string   `protobuf:"bytes,17,opt,name=available_time_end,json=availableTimeEnd,proto3" json:"available_time_end,omitempty"`
	Timezone           string   `protobuf:"bytes,18,opt,name=timezone,proto3" json:"timezone,omitempty"`
}

func (x *UpdateTutorProfileRequest) Reset()               { *x = UpdateTutorProfileRequest{} }
func (x *UpdateTutorProfileRequest) String() string        { return x.UserId }
func (x *UpdateTutorProfileRequest) ProtoMessage()         {}
func (x *UpdateTutorProfileRequest) GetUserId() string           { return x.UserId }
func (x *UpdateTutorProfileRequest) GetBio() string              { return x.Bio }
func (x *UpdateTutorProfileRequest) GetAge() int32               { return x.Age }
func (x *UpdateTutorProfileRequest) GetLocation() string         { return x.Location }
func (x *UpdateTutorProfileRequest) GetPhotoUrl() string         { return x.PhotoUrl }
func (x *UpdateTutorProfileRequest) GetSubjects() []string       { return x.Subjects }
func (x *UpdateTutorProfileRequest) GetExperienceYears() int32   { return x.ExperienceYears }
func (x *UpdateTutorProfileRequest) GetCertificates() []string   { return x.Certificates }
func (x *UpdateTutorProfileRequest) GetPhone() string            { return x.Phone }
func (x *UpdateTutorProfileRequest) GetTeachingLanguage() string { return x.TeachingLanguage }
func (x *UpdateTutorProfileRequest) GetStudentLevel() string     { return x.StudentLevel }
func (x *UpdateTutorProfileRequest) GetLessonType() string       { return x.LessonType }
func (x *UpdateTutorProfileRequest) GetHourlyPrice() int32       { return x.HourlyPrice }
func (x *UpdateTutorProfileRequest) GetEducation() string        { return x.Education }
func (x *UpdateTutorProfileRequest) GetAvailableDays() []string  { return x.AvailableDays }
func (x *UpdateTutorProfileRequest) GetAvailableTimeStart() string { return x.AvailableTimeStart }
func (x *UpdateTutorProfileRequest) GetAvailableTimeEnd() string   { return x.AvailableTimeEnd }
func (x *UpdateTutorProfileRequest) GetTimezone() string           { return x.Timezone }

type GetTutorProfileRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	TutorId string `protobuf:"bytes,1,opt,name=tutor_id,json=tutorId,proto3" json:"tutor_id,omitempty"`
}

func (x *GetTutorProfileRequest) Reset()         { *x = GetTutorProfileRequest{} }
func (x *GetTutorProfileRequest) String() string  { return x.TutorId }
func (x *GetTutorProfileRequest) ProtoMessage()  {}
func (x *GetTutorProfileRequest) GetTutorId() string { return x.TutorId }

type TutorProfileResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Id                 string   `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Name               string   `protobuf:"bytes,2,opt,name=name,proto3" json:"name,omitempty"`
	Email              string   `protobuf:"bytes,3,opt,name=email,proto3" json:"email,omitempty"`
	Bio                string   `protobuf:"bytes,4,opt,name=bio,proto3" json:"bio,omitempty"`
	Age                int32    `protobuf:"varint,5,opt,name=age,proto3" json:"age,omitempty"`
	Location           string   `protobuf:"bytes,6,opt,name=location,proto3" json:"location,omitempty"`
	PhotoUrl           string   `protobuf:"bytes,7,opt,name=photo_url,json=photoUrl,proto3" json:"photo_url,omitempty"`
	Subjects           []string `protobuf:"bytes,8,rep,name=subjects,proto3" json:"subjects,omitempty"`
	ExperienceYears    int32    `protobuf:"varint,9,opt,name=experience_years,json=experienceYears,proto3" json:"experience_years,omitempty"`
	Certificates       []string `protobuf:"bytes,10,rep,name=certificates,proto3" json:"certificates,omitempty"`
	Status             string   `protobuf:"bytes,11,opt,name=status,proto3" json:"status,omitempty"`
	Phone              string   `protobuf:"bytes,12,opt,name=phone,proto3" json:"phone,omitempty"`
	TeachingLanguage   string   `protobuf:"bytes,13,opt,name=teaching_language,json=teachingLanguage,proto3" json:"teaching_language,omitempty"`
	StudentLevel       string   `protobuf:"bytes,14,opt,name=student_level,json=studentLevel,proto3" json:"student_level,omitempty"`
	LessonType         string   `protobuf:"bytes,15,opt,name=lesson_type,json=lessonType,proto3" json:"lesson_type,omitempty"`
	HourlyPrice        int32    `protobuf:"varint,16,opt,name=hourly_price,json=hourlyPrice,proto3" json:"hourly_price,omitempty"`
	Education          string   `protobuf:"bytes,17,opt,name=education,proto3" json:"education,omitempty"`
	AvailableDays      []string `protobuf:"bytes,18,rep,name=available_days,json=availableDays,proto3" json:"available_days,omitempty"`
	AvailableTimeStart string   `protobuf:"bytes,19,opt,name=available_time_start,json=availableTimeStart,proto3" json:"available_time_start,omitempty"`
	AvailableTimeEnd   string   `protobuf:"bytes,20,opt,name=available_time_end,json=availableTimeEnd,proto3" json:"available_time_end,omitempty"`
	Timezone           string   `protobuf:"bytes,21,opt,name=timezone,proto3" json:"timezone,omitempty"`
}

func (x *TutorProfileResponse) Reset()               { *x = TutorProfileResponse{} }
func (x *TutorProfileResponse) String() string        { return x.Id }
func (x *TutorProfileResponse) ProtoMessage()         {}
func (x *TutorProfileResponse) GetId() string                   { return x.Id }
func (x *TutorProfileResponse) GetName() string                 { return x.Name }
func (x *TutorProfileResponse) GetEmail() string                { return x.Email }
func (x *TutorProfileResponse) GetBio() string                  { return x.Bio }
func (x *TutorProfileResponse) GetAge() int32                   { return x.Age }
func (x *TutorProfileResponse) GetLocation() string             { return x.Location }
func (x *TutorProfileResponse) GetPhotoUrl() string             { return x.PhotoUrl }
func (x *TutorProfileResponse) GetSubjects() []string           { return x.Subjects }
func (x *TutorProfileResponse) GetExperienceYears() int32       { return x.ExperienceYears }
func (x *TutorProfileResponse) GetCertificates() []string       { return x.Certificates }
func (x *TutorProfileResponse) GetStatus() string               { return x.Status }
func (x *TutorProfileResponse) GetPhone() string                { return x.Phone }
func (x *TutorProfileResponse) GetTeachingLanguage() string     { return x.TeachingLanguage }
func (x *TutorProfileResponse) GetStudentLevel() string         { return x.StudentLevel }
func (x *TutorProfileResponse) GetLessonType() string           { return x.LessonType }
func (x *TutorProfileResponse) GetHourlyPrice() int32           { return x.HourlyPrice }
func (x *TutorProfileResponse) GetEducation() string            { return x.Education }
func (x *TutorProfileResponse) GetAvailableDays() []string      { return x.AvailableDays }
func (x *TutorProfileResponse) GetAvailableTimeStart() string   { return x.AvailableTimeStart }
func (x *TutorProfileResponse) GetAvailableTimeEnd() string     { return x.AvailableTimeEnd }
func (x *TutorProfileResponse) GetTimezone() string             { return x.Timezone }

type GetAllUsersRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Limit  int32 `protobuf:"varint,1,opt,name=limit,proto3" json:"limit,omitempty"`
	Offset int32 `protobuf:"varint,2,opt,name=offset,proto3" json:"offset,omitempty"`
}

func (x *GetAllUsersRequest) Reset()         { *x = GetAllUsersRequest{} }
func (x *GetAllUsersRequest) String() string  { return "" }
func (x *GetAllUsersRequest) ProtoMessage()  {}
func (x *GetAllUsersRequest) GetLimit() int32  { return x.Limit }
func (x *GetAllUsersRequest) GetOffset() int32 { return x.Offset }

type Empty struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *Empty) Reset()        { *x = Empty{} }
func (x *Empty) String() string { return "" }
func (x *Empty) ProtoMessage() {}

type ApproveTutorRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	TutorId string `protobuf:"bytes,1,opt,name=tutor_id,json=tutorId,proto3" json:"tutor_id,omitempty"`
}

func (x *ApproveTutorRequest) Reset()         { *x = ApproveTutorRequest{} }
func (x *ApproveTutorRequest) String() string  { return x.TutorId }
func (x *ApproveTutorRequest) ProtoMessage()  {}
func (x *ApproveTutorRequest) GetTutorId() string { return x.TutorId }

type RejectTutorRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	TutorId string `protobuf:"bytes,1,opt,name=tutor_id,json=tutorId,proto3" json:"tutor_id,omitempty"`
}

func (x *RejectTutorRequest) Reset()         { *x = RejectTutorRequest{} }
func (x *RejectTutorRequest) String() string  { return x.TutorId }
func (x *RejectTutorRequest) ProtoMessage()  {}
func (x *RejectTutorRequest) GetTutorId() string { return x.TutorId }

type PendingTutorsList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Tutors []*TutorProfileResponse `protobuf:"bytes,1,rep,name=tutors,proto3" json:"tutors,omitempty"`
}

func (x *PendingTutorsList) Reset()          { *x = PendingTutorsList{} }
func (x *PendingTutorsList) String() string   { return "" }
func (x *PendingTutorsList) ProtoMessage()   {}
func (x *PendingTutorsList) GetTutors() []*TutorProfileResponse { return x.Tutors }

type GetTutorsByStatusRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Status string `protobuf:"bytes,1,opt,name=status,proto3" json:"status,omitempty"`
}

func (x *GetTutorsByStatusRequest) Reset()         { *x = GetTutorsByStatusRequest{} }
func (x *GetTutorsByStatusRequest) String() string  { return x.Status }
func (x *GetTutorsByStatusRequest) ProtoMessage()  {}
func (x *GetTutorsByStatusRequest) GetStatus() string { return x.Status }

// ── Server interface ──────────────────────────────────────────────────────────

type UserServiceServer interface {
	CreateUser(context.Context, *CreateUserRequest) (*UserResponse, error)
	GetUser(context.Context, *GetUserRequest) (*UserResponse, error)
	UpdateUser(context.Context, *UpdateUserRequest) (*UserResponse, error)
	GetAllUsers(context.Context, *GetAllUsersRequest) (*UsersList, error)
	DeleteUser(context.Context, *DeleteUserRequest) (*Empty, error)
	UpdateTutorProfile(context.Context, *UpdateTutorProfileRequest) (*TutorProfileResponse, error)
	GetTutorProfile(context.Context, *GetTutorProfileRequest) (*TutorProfileResponse, error)
	SearchTutors(context.Context, *SearchTutorsRequest) (*TutorCardsList, error)
	ApproveTutor(context.Context, *ApproveTutorRequest) (*Empty, error)
	RejectTutor(context.Context, *RejectTutorRequest) (*Empty, error)
	GetPendingTutors(context.Context, *Empty) (*PendingTutorsList, error)
	GetTutorsByStatus(context.Context, *GetTutorsByStatusRequest) (*PendingTutorsList, error)
	mustEmbedUnimplementedUserServiceServer()
}

type UnimplementedUserServiceServer struct{}

func (UnimplementedUserServiceServer) CreateUser(context.Context, *CreateUserRequest) (*UserResponse, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) GetUser(context.Context, *GetUserRequest) (*UserResponse, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) UpdateUser(context.Context, *UpdateUserRequest) (*UserResponse, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) GetAllUsers(context.Context, *GetAllUsersRequest) (*UsersList, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) DeleteUser(context.Context, *DeleteUserRequest) (*Empty, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) UpdateTutorProfile(context.Context, *UpdateTutorProfileRequest) (*TutorProfileResponse, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) GetTutorProfile(context.Context, *GetTutorProfileRequest) (*TutorProfileResponse, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) SearchTutors(context.Context, *SearchTutorsRequest) (*TutorCardsList, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) ApproveTutor(context.Context, *ApproveTutorRequest) (*Empty, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) RejectTutor(context.Context, *RejectTutorRequest) (*Empty, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) GetPendingTutors(context.Context, *Empty) (*PendingTutorsList, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) GetTutorsByStatus(context.Context, *GetTutorsByStatusRequest) (*PendingTutorsList, error) {
	return nil, nil
}
func (UnimplementedUserServiceServer) mustEmbedUnimplementedUserServiceServer() {}

// ── Registration ──────────────────────────────────────────────────────────────

func RegisterUserServiceServer(s grpc.ServiceRegistrar, srv UserServiceServer) {
	s.RegisterService(&UserService_ServiceDesc, srv)
}

var UserService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "user.UserService",
	HandlerType: (*UserServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "CreateUser", Handler: _UserService_CreateUser_Handler},
		{MethodName: "GetUser", Handler: _UserService_GetUser_Handler},
		{MethodName: "UpdateUser", Handler: _UserService_UpdateUser_Handler},
		{MethodName: "GetAllUsers", Handler: _UserService_GetAllUsers_Handler},
		{MethodName: "DeleteUser", Handler: _UserService_DeleteUser_Handler},
		{MethodName: "UpdateTutorProfile", Handler: _UserService_UpdateTutorProfile_Handler},
		{MethodName: "GetTutorProfile", Handler: _UserService_GetTutorProfile_Handler},
		{MethodName: "SearchTutors", Handler: _UserService_SearchTutors_Handler},
		{MethodName: "ApproveTutor", Handler: _UserService_ApproveTutor_Handler},
		{MethodName: "RejectTutor", Handler: _UserService_RejectTutor_Handler},
		{MethodName: "GetPendingTutors", Handler: _UserService_GetPendingTutors_Handler},
		{MethodName: "GetTutorsByStatus", Handler: _UserService_GetTutorsByStatus_Handler},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "user.proto",
}

func _UserService_CreateUser_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CreateUserRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).CreateUser(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/CreateUser"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).CreateUser(ctx, req.(*CreateUserRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_GetUser_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetUserRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).GetUser(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/GetUser"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).GetUser(ctx, req.(*GetUserRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_UpdateUser_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateUserRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).UpdateUser(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/UpdateUser"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).UpdateUser(ctx, req.(*UpdateUserRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_GetAllUsers_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetAllUsersRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).GetAllUsers(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/GetAllUsers"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).GetAllUsers(ctx, req.(*GetAllUsersRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_DeleteUser_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(DeleteUserRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).DeleteUser(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/DeleteUser"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).DeleteUser(ctx, req.(*DeleteUserRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_UpdateTutorProfile_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateTutorProfileRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).UpdateTutorProfile(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/UpdateTutorProfile"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).UpdateTutorProfile(ctx, req.(*UpdateTutorProfileRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_GetTutorProfile_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetTutorProfileRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).GetTutorProfile(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/GetTutorProfile"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).GetTutorProfile(ctx, req.(*GetTutorProfileRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_SearchTutors_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(SearchTutorsRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).SearchTutors(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/SearchTutors"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).SearchTutors(ctx, req.(*SearchTutorsRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_ApproveTutor_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ApproveTutorRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).ApproveTutor(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/ApproveTutor"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).ApproveTutor(ctx, req.(*ApproveTutorRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_RejectTutor_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(RejectTutorRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).RejectTutor(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/RejectTutor"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).RejectTutor(ctx, req.(*RejectTutorRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_GetPendingTutors_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(Empty)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).GetPendingTutors(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/GetPendingTutors"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).GetPendingTutors(ctx, req.(*Empty))
	}
	return interceptor(ctx, in, info, handler)
}

func _UserService_GetTutorsByStatus_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetTutorsByStatusRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).GetTutorsByStatus(ctx, in)
	}
	info := &grpc.UnaryServerInfo{Server: srv, FullMethod: "/user.UserService/GetTutorsByStatus"}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).GetTutorsByStatus(ctx, req.(*GetTutorsByStatusRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// ── Client interface ──────────────────────────────────────────────────────────

type UserServiceClient interface {
	CreateUser(ctx context.Context, in *CreateUserRequest, opts ...grpc.CallOption) (*UserResponse, error)
	GetUser(ctx context.Context, in *GetUserRequest, opts ...grpc.CallOption) (*UserResponse, error)
	UpdateUser(ctx context.Context, in *UpdateUserRequest, opts ...grpc.CallOption) (*UserResponse, error)
	GetAllUsers(ctx context.Context, in *GetAllUsersRequest, opts ...grpc.CallOption) (*UsersList, error)
	DeleteUser(ctx context.Context, in *DeleteUserRequest, opts ...grpc.CallOption) (*Empty, error)
	UpdateTutorProfile(ctx context.Context, in *UpdateTutorProfileRequest, opts ...grpc.CallOption) (*TutorProfileResponse, error)
	GetTutorProfile(ctx context.Context, in *GetTutorProfileRequest, opts ...grpc.CallOption) (*TutorProfileResponse, error)
	SearchTutors(ctx context.Context, in *SearchTutorsRequest, opts ...grpc.CallOption) (*TutorCardsList, error)
	ApproveTutor(ctx context.Context, in *ApproveTutorRequest, opts ...grpc.CallOption) (*Empty, error)
	RejectTutor(ctx context.Context, in *RejectTutorRequest, opts ...grpc.CallOption) (*Empty, error)
	GetPendingTutors(ctx context.Context, in *Empty, opts ...grpc.CallOption) (*PendingTutorsList, error)
	GetTutorsByStatus(ctx context.Context, in *GetTutorsByStatusRequest, opts ...grpc.CallOption) (*PendingTutorsList, error)
}

type userServiceClient struct{ cc grpc.ClientConnInterface }

func NewUserServiceClient(cc grpc.ClientConnInterface) UserServiceClient {
	return &userServiceClient{cc}
}

func (c *userServiceClient) CreateUser(ctx context.Context, in *CreateUserRequest, opts ...grpc.CallOption) (*UserResponse, error) {
	out := new(UserResponse)
	err := c.cc.Invoke(ctx, "/user.UserService/CreateUser", in, out, opts...)
	return out, err
}

func (c *userServiceClient) GetUser(ctx context.Context, in *GetUserRequest, opts ...grpc.CallOption) (*UserResponse, error) {
	out := new(UserResponse)
	err := c.cc.Invoke(ctx, "/user.UserService/GetUser", in, out, opts...)
	return out, err
}

func (c *userServiceClient) UpdateUser(ctx context.Context, in *UpdateUserRequest, opts ...grpc.CallOption) (*UserResponse, error) {
	out := new(UserResponse)
	err := c.cc.Invoke(ctx, "/user.UserService/UpdateUser", in, out, opts...)
	return out, err
}

func (c *userServiceClient) GetAllUsers(ctx context.Context, in *GetAllUsersRequest, opts ...grpc.CallOption) (*UsersList, error) {
	out := new(UsersList)
	err := c.cc.Invoke(ctx, "/user.UserService/GetAllUsers", in, out, opts...)
	return out, err
}

func (c *userServiceClient) DeleteUser(ctx context.Context, in *DeleteUserRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty)
	err := c.cc.Invoke(ctx, "/user.UserService/DeleteUser", in, out, opts...)
	return out, err
}

func (c *userServiceClient) UpdateTutorProfile(ctx context.Context, in *UpdateTutorProfileRequest, opts ...grpc.CallOption) (*TutorProfileResponse, error) {
	out := new(TutorProfileResponse)
	err := c.cc.Invoke(ctx, "/user.UserService/UpdateTutorProfile", in, out, opts...)
	return out, err
}

func (c *userServiceClient) GetTutorProfile(ctx context.Context, in *GetTutorProfileRequest, opts ...grpc.CallOption) (*TutorProfileResponse, error) {
	out := new(TutorProfileResponse)
	err := c.cc.Invoke(ctx, "/user.UserService/GetTutorProfile", in, out, opts...)
	return out, err
}

func (c *userServiceClient) ApproveTutor(ctx context.Context, in *ApproveTutorRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty)
	err := c.cc.Invoke(ctx, "/user.UserService/ApproveTutor", in, out, opts...)
	return out, err
}

func (c *userServiceClient) RejectTutor(ctx context.Context, in *RejectTutorRequest, opts ...grpc.CallOption) (*Empty, error) {
	out := new(Empty)
	err := c.cc.Invoke(ctx, "/user.UserService/RejectTutor", in, out, opts...)
	return out, err
}

func (c *userServiceClient) GetPendingTutors(ctx context.Context, in *Empty, opts ...grpc.CallOption) (*PendingTutorsList, error) {
	out := new(PendingTutorsList)
	err := c.cc.Invoke(ctx, "/user.UserService/GetPendingTutors", in, out, opts...)
	return out, err
}

func (c *userServiceClient) GetTutorsByStatus(ctx context.Context, in *GetTutorsByStatusRequest, opts ...grpc.CallOption) (*PendingTutorsList, error) {
	out := new(PendingTutorsList)
	err := c.cc.Invoke(ctx, "/user.UserService/GetTutorsByStatus", in, out, opts...)
	return out, err
}

// ── SearchTutors ──────────────────────────────────────────────────────────────

type SearchTutorsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Subject  string `protobuf:"bytes,1,opt,name=subject,proto3" json:"subject,omitempty"`
	Location string `protobuf:"bytes,2,opt,name=location,proto3" json:"location,omitempty"`
	Limit    int32  `protobuf:"varint,3,opt,name=limit,proto3" json:"limit,omitempty"`
	Offset   int32  `protobuf:"varint,4,opt,name=offset,proto3" json:"offset,omitempty"`
	MinAge   int32  `protobuf:"varint,5,opt,name=min_age,json=minAge,proto3" json:"min_age,omitempty"`
	MaxAge   int32  `protobuf:"varint,6,opt,name=max_age,json=maxAge,proto3" json:"max_age,omitempty"`
}

func (x *SearchTutorsRequest) Reset()             { *x = SearchTutorsRequest{} }
func (x *SearchTutorsRequest) String() string      { return "" }
func (x *SearchTutorsRequest) ProtoMessage()      {}
func (x *SearchTutorsRequest) GetSubject() string   { return x.Subject }
func (x *SearchTutorsRequest) GetLocation() string  { return x.Location }
func (x *SearchTutorsRequest) GetMinAge() int32     { return x.MinAge }
func (x *SearchTutorsRequest) GetMaxAge() int32     { return x.MaxAge }
func (x *SearchTutorsRequest) GetLimit() int32     { return x.Limit }
func (x *SearchTutorsRequest) GetOffset() int32    { return x.Offset }

type TutorCardsList struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
	Tutors []*TutorProfileResponse `protobuf:"bytes,1,rep,name=tutors,proto3" json:"tutors,omitempty"`
}

func (x *TutorCardsList) Reset()          { *x = TutorCardsList{} }
func (x *TutorCardsList) String() string   { return "" }
func (x *TutorCardsList) ProtoMessage()   {}
func (x *TutorCardsList) GetTutors() []*TutorProfileResponse { return x.Tutors }

func (c *userServiceClient) SearchTutors(ctx context.Context, in *SearchTutorsRequest, opts ...grpc.CallOption) (*TutorCardsList, error) {
	out := new(TutorCardsList)
	err := c.cc.Invoke(ctx, "/user.UserService/SearchTutors", in, out, opts...)
	return out, err
}
