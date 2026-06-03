package service_test

import (
	"context"
	"errors"
	"testing"

	"certificate-service/internal/model"
	"certificate-service/internal/repository"
	"certificate-service/internal/service"

	coursepb "course-service/proto/coursepb"
	progresspb "progress-service/proto/progresspb"
	userpb "user-service/proto/userpb"

	"google.golang.org/grpc"
)

// ── mock repository ──────────────────────────────────────────────────────────

type mockRepo struct {
	certs  map[string]*model.Certificate
	byPair map[string]*model.Certificate
}

func newMockRepo() *mockRepo {
	return &mockRepo{
		certs:  make(map[string]*model.Certificate),
		byPair: make(map[string]*model.Certificate),
	}
}

func (r *mockRepo) Create(_ context.Context, c *model.Certificate) error {
	key := c.StudentID + ":" + c.CourseID
	if _, exists := r.byPair[key]; exists {
		return nil
	}
	cp := *c
	r.certs[c.ID] = &cp
	r.byPair[key] = &cp
	return nil
}

func (r *mockRepo) GetByID(_ context.Context, id string) (*model.Certificate, error) {
	c, ok := r.certs[id]
	if !ok {
		return nil, repository.ErrNotFound
	}
	cp := *c
	return &cp, nil
}

func (r *mockRepo) GetByStudentAndCourse(_ context.Context, studentID, courseID string) (*model.Certificate, error) {
	c, ok := r.byPair[studentID+":"+courseID]
	if !ok {
		return nil, repository.ErrNotFound
	}
	cp := *c
	return &cp, nil
}

func (r *mockRepo) GetByStudent(_ context.Context, studentID string) ([]*model.Certificate, error) {
	var res []*model.Certificate
	for _, c := range r.certs {
		if c.StudentID == studentID {
			cp := *c
			res = append(res, &cp)
		}
	}
	return res, nil
}

func (r *mockRepo) GetPendingByTutor(_ context.Context, tutorID string) ([]*model.Certificate, error) {
	var res []*model.Certificate
	for _, c := range r.certs {
		if c.TutorID == tutorID && c.Status == model.CertStatusPending {
			cp := *c
			res = append(res, &cp)
		}
	}
	return res, nil
}

func (r *mockRepo) GetAllPending(_ context.Context) ([]*model.Certificate, error) {
	var res []*model.Certificate
	for _, c := range r.certs {
		if c.Status == model.CertStatusPending {
			cp := *c
			res = append(res, &cp)
		}
	}
	return res, nil
}

func (r *mockRepo) UpdateStatus(_ context.Context, id string, status model.CertStatus) error {
	c, ok := r.certs[id]
	if !ok {
		return repository.ErrNotFound
	}
	c.Status = status
	// also update byPair entry
	key := c.StudentID + ":" + c.CourseID
	if bp, ok2 := r.byPair[key]; ok2 {
		bp.Status = status
	}
	return nil
}

// ── mock progress client ─────────────────────────────────────────────────────

type mockProgressClient struct {
	pct float32
	err error
}

func (m *mockProgressClient) GetProgress(_ context.Context, _ *progresspb.GetProgressRequest, _ ...grpc.CallOption) (*progresspb.ProgressResponse, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &progresspb.ProgressResponse{CompletionPct: m.pct}, nil
}
func (m *mockProgressClient) RecordLessonEvent(_ context.Context, _ *progresspb.RecordLessonEventRequest, _ ...grpc.CallOption) (*progresspb.RecordLessonEventResponse, error) {
	return nil, nil
}
func (m *mockProgressClient) GetCourseProgress(_ context.Context, _ *progresspb.GetCourseProgressRequest, _ ...grpc.CallOption) (*progresspb.CourseProgressResponse, error) {
	return nil, nil
}

// ── mock user client ─────────────────────────────────────────────────────────

type mockUserClient struct {
	names map[string]string
}

func (m *mockUserClient) GetUser(_ context.Context, req *userpb.GetUserRequest, _ ...grpc.CallOption) (*userpb.UserResponse, error) {
	name, ok := m.names[req.GetUserId()]
	if !ok {
		return nil, errors.New("user not found")
	}
	return &userpb.UserResponse{Id: req.GetUserId(), Name: name}, nil
}
func (m *mockUserClient) CreateUser(_ context.Context, _ *userpb.CreateUserRequest, _ ...grpc.CallOption) (*userpb.UserResponse, error) {
	return nil, nil
}
func (m *mockUserClient) UpdateUser(_ context.Context, _ *userpb.UpdateUserRequest, _ ...grpc.CallOption) (*userpb.UserResponse, error) {
	return nil, nil
}
func (m *mockUserClient) GetAllUsers(_ context.Context, _ *userpb.GetAllUsersRequest, _ ...grpc.CallOption) (*userpb.UsersList, error) {
	return nil, nil
}
func (m *mockUserClient) DeleteUser(_ context.Context, _ *userpb.DeleteUserRequest, _ ...grpc.CallOption) (*userpb.Empty, error) {
	return nil, nil
}
func (m *mockUserClient) UpdateTutorProfile(_ context.Context, _ *userpb.UpdateTutorProfileRequest, _ ...grpc.CallOption) (*userpb.TutorProfileResponse, error) {
	return nil, nil
}
func (m *mockUserClient) GetTutorProfile(_ context.Context, _ *userpb.GetTutorProfileRequest, _ ...grpc.CallOption) (*userpb.TutorProfileResponse, error) {
	return nil, nil
}
func (m *mockUserClient) SearchTutors(_ context.Context, _ *userpb.SearchTutorsRequest, _ ...grpc.CallOption) (*userpb.TutorCardsList, error) {
	return nil, nil
}
func (m *mockUserClient) ApproveTutor(_ context.Context, _ *userpb.ApproveTutorRequest, _ ...grpc.CallOption) (*userpb.Empty, error) {
	return nil, nil
}
func (m *mockUserClient) RejectTutor(_ context.Context, _ *userpb.RejectTutorRequest, _ ...grpc.CallOption) (*userpb.Empty, error) {
	return nil, nil
}
func (m *mockUserClient) GetPendingTutors(_ context.Context, _ *userpb.Empty, _ ...grpc.CallOption) (*userpb.PendingTutorsList, error) {
	return nil, nil
}
func (m *mockUserClient) GetTutorsByStatus(_ context.Context, _ *userpb.GetTutorsByStatusRequest, _ ...grpc.CallOption) (*userpb.PendingTutorsList, error) {
	return nil, nil
}

// ── mock course client ───────────────────────────────────────────────────────

type mockCourseClient struct {
	title   string
	tutorID string
	err     error
}

func (m *mockCourseClient) GetCourse(_ context.Context, _ *coursepb.GetCourseRequest, _ ...grpc.CallOption) (*coursepb.CourseResponse, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &coursepb.CourseResponse{Title: m.title, TutorId: m.tutorID}, nil
}
func (m *mockCourseClient) CreateCourse(_ context.Context, _ *coursepb.CreateCourseRequest, _ ...grpc.CallOption) (*coursepb.CourseResponse, error) {
	return nil, nil
}
func (m *mockCourseClient) GetAllCourses(_ context.Context, _ *coursepb.GetAllCoursesRequest, _ ...grpc.CallOption) (*coursepb.CoursesList, error) {
	return nil, nil
}
func (m *mockCourseClient) UpdateCourse(_ context.Context, _ *coursepb.UpdateCourseRequest, _ ...grpc.CallOption) (*coursepb.CourseResponse, error) {
	return nil, nil
}
func (m *mockCourseClient) PublishCourse(_ context.Context, _ *coursepb.PublishCourseRequest, _ ...grpc.CallOption) (*coursepb.CourseResponse, error) {
	return nil, nil
}
func (m *mockCourseClient) SearchCourses(_ context.Context, _ *coursepb.SearchCoursesRequest, _ ...grpc.CallOption) (*coursepb.CoursesList, error) {
	return nil, nil
}
func (m *mockCourseClient) DeleteCourse(_ context.Context, _ *coursepb.DeleteCourseRequest, _ ...grpc.CallOption) (*coursepb.Empty, error) {
	return nil, nil
}
func (m *mockCourseClient) AddTag(_ context.Context, _ *coursepb.TagRequest, _ ...grpc.CallOption) (*coursepb.Empty, error) {
	return nil, nil
}
func (m *mockCourseClient) RemoveTag(_ context.Context, _ *coursepb.TagRequest, _ ...grpc.CallOption) (*coursepb.Empty, error) {
	return nil, nil
}
func (m *mockCourseClient) GetCoursesByTag(_ context.Context, _ *coursepb.GetCoursesByTagRequest, _ ...grpc.CallOption) (*coursepb.CoursesList, error) {
	return nil, nil
}
func (m *mockCourseClient) CompleteCourse(_ context.Context, _ *coursepb.CompleteCourseRequest, _ ...grpc.CallOption) (*coursepb.CourseResponse, error) {
	return nil, nil
}

// ── factory ──────────────────────────────────────────────────────────────────

func buildSvc(repo *mockRepo, pct float32, progressErr error) service.CertificateService {
	return service.NewCertificateService(
		repo,
		&mockProgressClient{pct: pct, err: progressErr},
		&mockUserClient{names: map[string]string{
			"student-1": "Alice",
			"tutor-1":   "Bob",
		}},
		&mockCourseClient{title: "History 101", tutorID: "tutor-1"},
	)
}

// ── tests ────────────────────────────────────────────────────────────────────

func TestRequestCertificate_Success(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)

	cert, err := svc.RequestCertificate(context.Background(), "student-1", "course-1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if cert.Status != model.CertStatusPending {
		t.Errorf("expected Pending, got %v", cert.Status)
	}
	if cert.StudentName != "Alice" {
		t.Errorf("StudentName: want Alice, got %q", cert.StudentName)
	}
	if cert.CourseName != "History 101" {
		t.Errorf("CourseName: want History 101, got %q", cert.CourseName)
	}
	if cert.TutorName != "Bob" {
		t.Errorf("TutorName: want Bob, got %q", cert.TutorName)
	}
	if cert.IssuedAt.IsZero() {
		t.Error("IssuedAt should not be zero")
	}
}

func TestRequestCertificate_IncompleteProgress(t *testing.T) {
	_, err := buildSvc(newMockRepo(), 80, nil).
		RequestCertificate(context.Background(), "student-1", "course-1")
	if !errors.Is(err, service.ErrNotComplete) {
		t.Errorf("expected ErrNotComplete, got %v", err)
	}
}

func TestRequestCertificate_ProgressServiceError(t *testing.T) {
	_, err := buildSvc(newMockRepo(), 0, errors.New("unavailable")).
		RequestCertificate(context.Background(), "student-1", "course-1")
	if !errors.Is(err, service.ErrNotComplete) {
		t.Errorf("expected ErrNotComplete, got %v", err)
	}
}

func TestRequestCertificate_Idempotent(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)

	c1, err := svc.RequestCertificate(context.Background(), "student-1", "course-1")
	if err != nil {
		t.Fatal(err)
	}
	c2, err := svc.RequestCertificate(context.Background(), "student-1", "course-1")
	if err != nil {
		t.Fatal(err)
	}
	if c1.ID != c2.ID {
		t.Errorf("duplicate request should return same cert ID: %s vs %s", c1.ID, c2.ID)
	}
}

func TestApproveCertificate_ByTutor(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)
	cert, _ := svc.RequestCertificate(context.Background(), "student-1", "course-1")

	approved, err := svc.ApproveCertificate(context.Background(), "tutor-1", "tutor", cert.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if approved.Status != model.CertStatusApproved {
		t.Errorf("expected Approved, got %v", approved.Status)
	}
}

func TestApproveCertificate_ByAdmin(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)
	cert, _ := svc.RequestCertificate(context.Background(), "student-1", "course-1")

	approved, err := svc.ApproveCertificate(context.Background(), "admin-99", "admin", cert.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if approved.Status != model.CertStatusApproved {
		t.Errorf("expected Approved, got %v", approved.Status)
	}
}

func TestApproveCertificate_WrongTutor_Forbidden(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)
	cert, _ := svc.RequestCertificate(context.Background(), "student-1", "course-1")

	_, err := svc.ApproveCertificate(context.Background(), "other-tutor", "tutor", cert.ID)
	if !errors.Is(err, service.ErrForbidden) {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestApproveCertificate_DoubleApprove_ErrNotPending(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)
	cert, _ := svc.RequestCertificate(context.Background(), "student-1", "course-1")
	svc.ApproveCertificate(context.Background(), "tutor-1", "tutor", cert.ID)

	_, err := svc.ApproveCertificate(context.Background(), "tutor-1", "tutor", cert.ID)
	if !errors.Is(err, service.ErrNotPending) {
		t.Errorf("expected ErrNotPending, got %v", err)
	}
}

func TestRejectCertificate_ByTutor(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)
	cert, _ := svc.RequestCertificate(context.Background(), "student-1", "course-1")

	rejected, err := svc.RejectCertificate(context.Background(), "tutor-1", "tutor", cert.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rejected.Status != model.CertStatusRejected {
		t.Errorf("expected Rejected, got %v", rejected.Status)
	}
}

func TestRejectCertificate_WrongTutor_Forbidden(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)
	cert, _ := svc.RequestCertificate(context.Background(), "student-1", "course-1")

	_, err := svc.RejectCertificate(context.Background(), "stranger", "tutor", cert.ID)
	if !errors.Is(err, service.ErrForbidden) {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestGetPendingCertificates_Tutor(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)
	svc.RequestCertificate(context.Background(), "student-1", "course-1")
	svc.RequestCertificate(context.Background(), "student-1", "course-2")

	certs, err := svc.GetPendingCertificates(context.Background(), "tutor-1", "tutor")
	if err != nil {
		t.Fatal(err)
	}
	if len(certs) != 2 {
		t.Errorf("expected 2 pending, got %d", len(certs))
	}
}

func TestGetPendingCertificates_StudentForbidden(t *testing.T) {
	_, err := buildSvc(newMockRepo(), 100, nil).
		GetPendingCertificates(context.Background(), "student-1", "student")
	if !errors.Is(err, service.ErrForbidden) {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestGetPendingCertificates_AdminSeesAll(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)
	svc.RequestCertificate(context.Background(), "student-1", "course-1")

	certs, err := svc.GetPendingCertificates(context.Background(), "admin-1", "admin")
	if err != nil {
		t.Fatal(err)
	}
	if len(certs) != 1 {
		t.Errorf("expected 1 pending for admin, got %d", len(certs))
	}
}

func TestIssueCertificate_AdminSkipsProgressCheck(t *testing.T) {
	cert, err := buildSvc(newMockRepo(), 0, nil).
		IssueCertificate(context.Background(), "admin", "student-1", "course-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cert.Status != model.CertStatusApproved {
		t.Errorf("expected Approved, got %v", cert.Status)
	}
}

func TestIssueCertificate_TutorNeedsFullProgress(t *testing.T) {
	_, err := buildSvc(newMockRepo(), 50, nil).
		IssueCertificate(context.Background(), "tutor", "student-1", "course-1")
	if !errors.Is(err, service.ErrNotComplete) {
		t.Errorf("expected ErrNotComplete, got %v", err)
	}
}

func TestGetCertificate(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)
	svc.RequestCertificate(context.Background(), "student-1", "course-1")

	cert, err := svc.GetCertificate(context.Background(), "student-1", "student", "course-1")
	if err != nil {
		t.Fatal(err)
	}
	if cert.StudentID != "student-1" || cert.CourseID != "course-1" {
		t.Errorf("unexpected cert: %+v", cert)
	}
}

func TestGetUserCertificates_OwnData(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)
	svc.RequestCertificate(context.Background(), "student-1", "course-1")
	svc.RequestCertificate(context.Background(), "student-1", "course-2")

	certs, err := svc.GetUserCertificates(context.Background(), "student-1", "student", "student-1")
	if err != nil {
		t.Fatal(err)
	}
	if len(certs) != 2 {
		t.Errorf("expected 2 certs, got %d", len(certs))
	}
}

func TestGetUserCertificates_OtherStudentForbidden(t *testing.T) {
	_, err := buildSvc(newMockRepo(), 100, nil).
		GetUserCertificates(context.Background(), "student-2", "student", "student-1")
	if !errors.Is(err, service.ErrForbidden) {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestFullLifecycle(t *testing.T) {
	repo := newMockRepo()
	svc := buildSvc(repo, 100, nil)
	ctx := context.Background()

	// 1. Request
	cert, err := svc.RequestCertificate(ctx, "student-1", "course-1")
	if err != nil {
		t.Fatal("request:", err)
	}
	if cert.Status != model.CertStatusPending {
		t.Fatal("should be Pending after request")
	}

	// 2. Pending list has 1 item
	pending, _ := svc.GetPendingCertificates(ctx, "tutor-1", "tutor")
	if len(pending) != 1 {
		t.Fatalf("expected 1 pending, got %d", len(pending))
	}

	// 3. Approve
	approved, err := svc.ApproveCertificate(ctx, "tutor-1", "tutor", cert.ID)
	if err != nil {
		t.Fatal("approve:", err)
	}
	if approved.Status != model.CertStatusApproved {
		t.Fatal("should be Approved")
	}

	// 4. Pending list is empty
	pending, _ = svc.GetPendingCertificates(ctx, "tutor-1", "tutor")
	if len(pending) != 0 {
		t.Fatalf("expected 0 pending after approve, got %d", len(pending))
	}

	// 5. Student retrieves approved cert
	retrieved, err := svc.GetCertificate(ctx, "student-1", "student", "course-1")
	if err != nil {
		t.Fatal("get:", err)
	}
	if retrieved.Status != model.CertStatusApproved {
		t.Fatal("retrieved cert should be Approved")
	}
}
