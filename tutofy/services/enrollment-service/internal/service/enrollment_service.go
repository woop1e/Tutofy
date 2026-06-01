package service

import (
	"context"
	"errors"
	"time"

	"course-service/proto/coursepb"
	"enrollment-service/internal/model"
	"enrollment-service/internal/repository"
	"notification-service/proto/notificationpb"
	"payment-service/proto/paymentpb"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

var (
	ErrForbidden        = errors.New("forbidden")
	ErrNotStudent       = errors.New("only students can enroll")
	ErrPaymentRequired  = errors.New("payment required to enroll in this course")
	ErrApprovalRequired = errors.New("tutor approval required before enrollment")
	ErrNotFound         = errors.New("enrollment request not found")
)

type EnrollmentService interface {
	EnrollUser(ctx context.Context, callerID, callerRole, courseID string) (*model.Enrollment, error)
	GetUserEnrollments(ctx context.Context, callerID, callerRole, userID string) ([]*model.Enrollment, error)
	GetCourseEnrollments(ctx context.Context, callerRole, courseID string) ([]*model.Enrollment, error)
	UnenrollUser(ctx context.Context, callerID, callerRole, userID, courseID string) error
	// Enrollment request flow (student requests → tutor approves → student pays → enrolled)
	RequestEnrollment(ctx context.Context, callerID, callerRole, courseID string) (*model.EnrollmentRequest, error)
	GetCourseEnrollmentRequests(ctx context.Context, callerID, callerRole, courseID string) ([]*model.EnrollmentRequest, error)
	ApproveEnrollmentRequest(ctx context.Context, callerID, callerRole, requestID string) error
	RejectEnrollmentRequest(ctx context.Context, callerID, callerRole, requestID string) error
}

type enrollmentService struct {
	repo               repository.EnrollmentRepository
	courseClient       coursepb.CourseServiceClient
	paymentClient      paymentpb.PaymentServiceClient
	notificationClient notificationpb.NotificationServiceClient
}

func NewEnrollmentService(
	repo repository.EnrollmentRepository,
	courseClient coursepb.CourseServiceClient,
	paymentClient paymentpb.PaymentServiceClient,
	notificationClient notificationpb.NotificationServiceClient,
) EnrollmentService {
	return &enrollmentService{
		repo:               repo,
		courseClient:       courseClient,
		paymentClient:      paymentClient,
		notificationClient: notificationClient,
	}
}

func (s *enrollmentService) EnrollUser(ctx context.Context, callerID, callerRole, courseID string) (*model.Enrollment, error) {
	if callerRole != "student" {
		return nil, ErrNotStudent
	}

	md, _ := metadata.FromIncomingContext(ctx)
	outCtx := metadata.NewOutgoingContext(ctx, md)

	course, err := s.courseClient.GetCourse(outCtx, &coursepb.GetCourseRequest{CourseId: courseID})
	if err != nil {
		st, _ := status.FromError(err)
		if st.Code() == codes.NotFound {
			return nil, errors.New("course not found")
		}
		return nil, errors.New("course service unavailable: " + st.Message())
	}

	// Enforce max_students capacity for group courses.
	if course.GetMaxStudents() > 0 {
		count, err := s.repo.CountEnrollments(ctx, courseID)
		if err != nil {
			return nil, errors.New("could not verify course capacity")
		}
		if count >= int64(course.GetMaxStudents()) {
			return nil, status.Errorf(codes.ResourceExhausted,
				"course is full (%d/%d students enrolled)", count, course.GetMaxStudents())
		}
	}

	// If the course has a price, require an approved enrollment request first, then payment.
	if course.GetPrice() > 0 {
		approved, err := s.repo.HasApprovedRequest(ctx, callerID, courseID)
		if err != nil {
			return nil, errors.New("could not verify enrollment approval")
		}
		if !approved {
			return nil, ErrApprovalRequired
		}

		resp, err := s.paymentClient.CheckCoursePayment(outCtx, &paymentpb.CheckCoursePaymentRequest{
			UserId:   callerID,
			CourseId: courseID,
		})
		if err != nil {
			return nil, errors.New("payment service unavailable")
		}
		if !resp.GetHasPaid() {
			return nil, ErrPaymentRequired
		}
	}

	e := &model.Enrollment{
		ID:       uuid.NewString(),
		UserID:   callerID,
		CourseID: courseID,
	}

	if err := s.repo.CreateEnrollment(ctx, e); err != nil {
		return nil, err
	}

	// Notify the student: enrollment confirmed.
	if s.notificationClient != nil {
		md, _ := metadata.FromIncomingContext(ctx)
		notifCtx := metadata.NewOutgoingContext(context.Background(), md)
		go s.notificationClient.NotifyUser(notifCtx, &notificationpb.NotifyUserRequest{
			UserId:  callerID,
			Type:    2, // NOTIFICATION_TYPE_ENROLLMENT
			Message: "You have successfully enrolled in the course \"" + course.GetTitle() + "\"",
		})
	}

	return e, nil
}

func (s *enrollmentService) GetUserEnrollments(ctx context.Context, callerID, callerRole, userID string) ([]*model.Enrollment, error) {
	if callerRole == "student" && callerID != userID {
		return nil, ErrForbidden
	}
	return s.repo.GetEnrollmentsByUser(ctx, userID)
}

func (s *enrollmentService) UnenrollUser(ctx context.Context, callerID, callerRole, userID, courseID string) error {
	if callerRole == "student" && callerID != userID {
		return ErrForbidden
	}
	return s.repo.DeleteEnrollment(ctx, userID, courseID)
}

func (s *enrollmentService) GetCourseEnrollments(ctx context.Context, callerRole, courseID string) ([]*model.Enrollment, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrForbidden
	}
	return s.repo.GetEnrollmentsByCourse(ctx, courseID)
}

func (s *enrollmentService) RequestEnrollment(ctx context.Context, callerID, callerRole, courseID string) (*model.EnrollmentRequest, error) {
	if callerRole != "student" {
		return nil, ErrNotStudent
	}
	req := &model.EnrollmentRequest{
		ID:        uuid.NewString(),
		UserID:    callerID,
		CourseID:  courseID,
		Status:    "pending",
		CreatedAt: time.Now(),
	}
	if err := s.repo.CreateEnrollmentRequest(ctx, req); err != nil {
		return nil, err
	}
	return req, nil
}

func (s *enrollmentService) GetCourseEnrollmentRequests(ctx context.Context, callerID, callerRole, courseID string) ([]*model.EnrollmentRequest, error) {
	if callerRole != "tutor" && callerRole != "admin" {
		return nil, ErrForbidden
	}
	return s.repo.GetEnrollmentRequestsByCourse(ctx, courseID)
}

func (s *enrollmentService) ApproveEnrollmentRequest(ctx context.Context, callerID, callerRole, requestID string) error {
	if callerRole != "tutor" && callerRole != "admin" {
		return ErrForbidden
	}
	req, err := s.repo.GetEnrollmentRequest(ctx, requestID)
	if err != nil {
		return err
	}
	if err := s.repo.UpdateEnrollmentRequestStatus(ctx, requestID, "approved"); err != nil {
		return err
	}
	// Notify the student that they are approved and can proceed to payment.
	if s.notificationClient != nil {
		md, _ := metadata.FromIncomingContext(ctx)
		notifCtx := metadata.NewOutgoingContext(context.Background(), md)
		courseTitle := req.CourseID
		if s.courseClient != nil {
			if cr, err2 := s.courseClient.GetCourse(notifCtx, &coursepb.GetCourseRequest{CourseId: req.CourseID}); err2 == nil {
				courseTitle = cr.GetTitle()
			}
		}
		go s.notificationClient.NotifyUser(notifCtx, &notificationpb.NotifyUserRequest{
			UserId:  req.UserID,
			Type:    11, // NOTIFICATION_TYPE_ENROLLMENT_APPROVED
			Message: "Your enrollment request for the course \"" + courseTitle + "\" was approved! You can now proceed to payment.",
		})
	}
	return nil
}

func (s *enrollmentService) RejectEnrollmentRequest(ctx context.Context, callerID, callerRole, requestID string) error {
	if callerRole != "tutor" && callerRole != "admin" {
		return ErrForbidden
	}
	req, err := s.repo.GetEnrollmentRequest(ctx, requestID)
	if err != nil {
		return err
	}
	if err := s.repo.UpdateEnrollmentRequestStatus(ctx, requestID, "rejected"); err != nil {
		return err
	}
	if s.notificationClient != nil {
		md, _ := metadata.FromIncomingContext(ctx)
		notifCtx := metadata.NewOutgoingContext(context.Background(), md)
		courseTitle := req.CourseID
		if s.courseClient != nil {
			if cr, err2 := s.courseClient.GetCourse(notifCtx, &coursepb.GetCourseRequest{CourseId: req.CourseID}); err2 == nil {
				courseTitle = cr.GetTitle()
			}
		}
		go s.notificationClient.NotifyUser(notifCtx, &notificationpb.NotifyUserRequest{
			UserId:  req.UserID,
			Type:    12, // NOTIFICATION_TYPE_ENROLLMENT_REJECTED
			Message: "Your enrollment request for the course \"" + courseTitle + "\" was not approved.",
		})
	}
	return nil
}
