package handler

import (
	"context"
	"log"
	"net/http"

	"certificate-service/proto/certificatepb"
	"course-service/proto/coursepb"
	"enrollment-service/proto/enrollmentpb"
	"grading-service/proto/gradingpb"
	"lesson-service/proto/lessonpb"
)

type CourseHandler struct {
	client       coursepb.CourseServiceClient
	enrollClient enrollmentpb.EnrollmentServiceClient
	lessonClient lessonpb.LessonServiceClient
	gradingClient gradingpb.GradingServiceClient
	certClient   certificatepb.CertificateServiceClient
}

func NewCourseHandler(
	c coursepb.CourseServiceClient,
	enroll enrollmentpb.EnrollmentServiceClient,
	lesson lessonpb.LessonServiceClient,
	grading gradingpb.GradingServiceClient,
	cert certificatepb.CertificateServiceClient,
) *CourseHandler {
	return &CourseHandler{
		client:        c,
		enrollClient:  enroll,
		lessonClient:  lesson,
		gradingClient: grading,
		certClient:    cert,
	}
}

func (h *CourseHandler) CreateCourse(w http.ResponseWriter, r *http.Request) {
	var req coursepb.CreateCourseRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.client.CreateCourse(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *CourseHandler) GetCourse(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetCourse(tokenCtx(r), &coursepb.GetCourseRequest{CourseId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *CourseHandler) GetAllCourses(w http.ResponseWriter, r *http.Request) {
	var req coursepb.GetAllCoursesRequest
	_ = decode(r, &req)
	resp, err := h.client.GetAllCourses(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *CourseHandler) UpdateCourse(w http.ResponseWriter, r *http.Request) {
	var req coursepb.UpdateCourseRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	req.CourseId = r.PathValue("id")
	resp, err := h.client.UpdateCourse(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *CourseHandler) PublishCourse(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.PublishCourse(tokenCtx(r), &coursepb.PublishCourseRequest{CourseId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *CourseHandler) DeleteCourse(w http.ResponseWriter, r *http.Request) {
	_, err := h.client.DeleteCourse(tokenCtx(r), &coursepb.DeleteCourseRequest{CourseId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// CompleteCourse marks the course as completed and auto-issues certificates to qualifying students.
func (h *CourseHandler) CompleteCourse(w http.ResponseWriter, r *http.Request) {
	courseID := r.PathValue("id")

	// 1. Mark course as completed in course-service.
	course, err := h.client.CompleteCourse(tokenCtx(r), &coursepb.CompleteCourseRequest{CourseId: courseID})
	if err != nil {
		errResp(w, err)
		return
	}

	// 2. Issue certificates asynchronously — don't block the HTTP response.
	go func() {
		ctx := context.Background()

		// Get enrolled students.
		enrollResp, err := h.enrollClient.GetCourseEnrollments(ctx, &enrollmentpb.CourseRequest{CourseId: courseID})
		if err != nil {
			log.Printf("complete-course: get enrollments for %s: %v", courseID, err)
			return
		}

		// Get attendance summary (one query for all students).
		var attendanceMap map[string][2]int32
		if h.lessonClient != nil {
			attResp, err := h.lessonClient.GetCourseAttendanceSummary(ctx, &lessonpb.GetCourseAttendanceSummaryRequest{CourseId: courseID})
			if err == nil {
				attendanceMap = make(map[string][2]int32)
				for _, s := range attResp.GetSummaries() {
					attendanceMap[s.GetStudentId()] = [2]int32{s.GetAttended(), s.GetTotal()}
				}
			}
		}

		for _, enr := range enrollResp.GetEnrollments() {
			studentID := enr.GetUserId()
			if studentID == "" {
				continue
			}

			// Check attendance requirement.
			if course.GetCompletionAttendancePct() > 0 && len(attendanceMap) > 0 {
				counts := attendanceMap[studentID]
				total := counts[1]
				if total > 0 {
					pct := int32(float32(counts[0]) / float32(total) * 100)
					if pct < course.GetCompletionAttendancePct() {
						continue
					}
				}
			}

			// Check grade requirement.
			if course.GetCompletionGradePct() > 0 && h.gradingClient != nil {
				gradesResp, err := h.gradingClient.GetStudentGrades(ctx, &gradingpb.StudentRequest{StudentId: studentID})
				if err == nil && len(gradesResp.GetGrades()) > 0 {
					var sum float32
					var count int
					for _, g := range gradesResp.GetGrades() {
						sum += g.GetGrade()
						count++
					}
					if count > 0 && int32(sum/float32(count)) < course.GetCompletionGradePct() {
						continue
					}
				}
			}

			// Issue certificate.
			if h.certClient != nil {
				_, err := h.certClient.IssueCertificate(ctx, &certificatepb.IssueCertificateRequest{
					StudentId: studentID,
					CourseId:  courseID,
				})
				if err != nil {
					log.Printf("complete-course: issue cert for student %s course %s: %v", studentID, courseID, err)
				}
			}
		}
	}()

	jsonResp(w, http.StatusOK, course)
}
