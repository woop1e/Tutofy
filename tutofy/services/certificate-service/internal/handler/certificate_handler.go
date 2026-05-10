package handler

import (
	"context"
	"errors"

	"certificate-service/internal/middleware"
	"certificate-service/internal/model"
	"certificate-service/internal/repository"
	"certificate-service/internal/service"
	"certificate-service/proto/certificatepb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type CertificateHandler struct {
	certificatepb.UnimplementedCertificateServiceServer
	svc service.CertificateService
}

func NewCertificateHandler(svc service.CertificateService) *CertificateHandler {
	return &CertificateHandler{svc: svc}
}

func (h *CertificateHandler) IssueCertificate(ctx context.Context, req *certificatepb.IssueCertificateRequest) (*certificatepb.CertificateResponse, error) {
	if req.GetStudentId() == "" || req.GetCourseId() == "" {
		return nil, status.Error(codes.InvalidArgument, "student_id and course_id are required")
	}
	callerRole := middleware.RoleFromContext(ctx)
	c, err := h.svc.IssueCertificate(ctx, callerRole, req.GetStudentId(), req.GetCourseId())
	if err != nil {
		return nil, mapErr(err)
	}
	return toProto(c), nil
}

func (h *CertificateHandler) GetCertificate(ctx context.Context, req *certificatepb.GetCertificateRequest) (*certificatepb.CertificateResponse, error) {
	if req.GetStudentId() == "" || req.GetCourseId() == "" {
		return nil, status.Error(codes.InvalidArgument, "student_id and course_id are required")
	}
	callerID, callerRole := middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx)
	c, err := h.svc.GetCertificate(ctx, callerID, callerRole, req.GetCourseId())
	if err != nil {
		return nil, mapErr(err)
	}
	return toProto(c), nil
}

func (h *CertificateHandler) GetUserCertificates(ctx context.Context, req *certificatepb.GetUserCertificatesRequest) (*certificatepb.CertificatesList, error) {
	if req.GetStudentId() == "" {
		return nil, status.Error(codes.InvalidArgument, "student_id is required")
	}
	callerID, callerRole := middleware.UserIDFromContext(ctx), middleware.RoleFromContext(ctx)
	certs, err := h.svc.GetUserCertificates(ctx, callerID, callerRole, req.GetStudentId())
	if err != nil {
		return nil, mapErr(err)
	}
	list := make([]*certificatepb.CertificateResponse, 0, len(certs))
	for _, c := range certs {
		list = append(list, toProto(c))
	}
	return &certificatepb.CertificatesList{Certificates: list}, nil
}

func toProto(c *model.Certificate) *certificatepb.CertificateResponse {
	return &certificatepb.CertificateResponse{
		Id:        c.ID,
		StudentId: c.StudentID,
		CourseId:  c.CourseID,
		IssuedAt:  c.IssuedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}

func mapErr(err error) error {
	switch {
	case errors.Is(err, service.ErrForbidden):
		return status.Error(codes.PermissionDenied, err.Error())
	case errors.Is(err, service.ErrNotComplete):
		return status.Error(codes.FailedPrecondition, err.Error())
	case errors.Is(err, repository.ErrNotFound):
		return status.Error(codes.NotFound, "certificate not found")
	default:
		return status.Error(codes.Internal, err.Error())
	}
}
