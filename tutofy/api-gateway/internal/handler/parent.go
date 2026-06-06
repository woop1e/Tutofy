package handler

import (
	"net/http"
	"strings"
	"sync"

	"enrollment-service/proto/enrollmentpb"
	"lesson-service/proto/lessonpb"
	"user-service/proto/userpb"
)

type ParentHandler struct {
	userClient       userpb.UserServiceClient
	enrollmentClient enrollmentpb.EnrollmentServiceClient
	lessonClient     lessonpb.LessonServiceClient
}

func NewParentHandler(
	u userpb.UserServiceClient,
	e enrollmentpb.EnrollmentServiceClient,
	l lessonpb.LessonServiceClient,
) *ParentHandler {
	return &ParentHandler{
		userClient:       u,
		enrollmentClient: e,
		lessonClient:     l,
	}
}

// ── response shapes ───────────────────────────────────────────────────────────

type parentLinkResp struct {
	ID          string `json:"id"`
	ParentID    string `json:"parent_id"`
	StudentID   string `json:"student_id"`
	ParentEmail string `json:"parent_email"`
	Token       string `json:"token"`
	Status      string `json:"status"`
	StudentName string `json:"student_name"`
	ParentName  string `json:"parent_name"`
	CreatedAt   string `json:"created_at"`
}

func toParentLinkResp(l *userpb.ParentLink) parentLinkResp {
	if l == nil {
		return parentLinkResp{}
	}
	return parentLinkResp{
		ID:          l.GetId(),
		ParentID:    l.GetParentId(),
		StudentID:   l.GetStudentId(),
		ParentEmail: l.GetParentEmail(),
		Token:       l.GetToken(),
		Status:      l.GetStatus(),
		StudentName: l.GetStudentName(),
		ParentName:  l.GetParentName(),
		CreatedAt:   l.GetCreatedAt(),
	}
}

type courseAttendance struct {
	CourseID        string `json:"course_id"`
	TotalLessons    int    `json:"total_lessons"`
	AttendedLessons int    `json:"attended_lessons"`
	AttendancePct   int    `json:"attendance_pct"`
}

type childOverviewResponse struct {
	StudentID            string             `json:"student_id"`
	Courses              []courseAttendance `json:"courses"`
	TotalAttended        int                `json:"total_attended"`
	TotalLessons         int                `json:"total_lessons"`
	OverallAttendancePct int                `json:"overall_attendance_pct"`
}

// ── handlers ──────────────────────────────────────────────────────────────────

// POST /parent/invite  —  student sends invite to a parent by email
func (h *ParentHandler) InviteParent(w http.ResponseWriter, r *http.Request) {
	callerID := userIDFromToken(r)
	if callerID == "" {
		jsonResp(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	var body struct {
		ParentEmail string `json:"parent_email"`
	}
	if err := decode(r, &body); err != nil || body.ParentEmail == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "parent_email is required"})
		return
	}
	ctx := tokenCtx(r)
	resp, err := h.userClient.InviteParent(ctx, &userpb.InviteParentRequest{
		StudentId:   callerID,
		ParentEmail: body.ParentEmail,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, toParentLinkResp(resp.GetLink()))
}

// GET /parent/invite/info?token=...  —  get invite details (public, no auth needed)
func (h *ParentHandler) GetInviteInfo(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "token is required"})
		return
	}
	ctx := tokenCtx(r)
	lnk, err := h.userClient.GetInviteInfo(ctx, &userpb.GetInviteInfoRequest{Token: token})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, toParentLinkResp(lnk))
}

// POST /parent/invite/accept  —  parent accepts invite via token
func (h *ParentHandler) AcceptParentInvite(w http.ResponseWriter, r *http.Request) {
	callerID := userIDFromToken(r)
	if callerID == "" {
		jsonResp(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	var body struct {
		Token string `json:"token"`
	}
	if err := decode(r, &body); err != nil || body.Token == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "token is required"})
		return
	}
	ctx := tokenCtx(r)
	resp, err := h.userClient.AcceptParentInvite(ctx, &userpb.AcceptParentInviteRequest{
		Token:    body.Token,
		ParentId: callerID,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, toParentLinkResp(resp.GetLink()))
}

// GET /parent/my-parents  —  student sees their linked parents
func (h *ParentHandler) GetMyParents(w http.ResponseWriter, r *http.Request) {
	callerID := userIDFromToken(r)
	if callerID == "" {
		jsonResp(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	ctx := tokenCtx(r)
	resp, err := h.userClient.GetParentLinks(ctx, &userpb.GetParentLinksRequest{StudentId: callerID})
	if err != nil {
		errResp(w, err)
		return
	}
	out := make([]parentLinkResp, 0, len(resp.GetLinks()))
	for _, l := range resp.GetLinks() {
		out = append(out, toParentLinkResp(l))
	}
	jsonResp(w, http.StatusOK, out)
}

// GET /parent/my-children  —  parent sees their linked children
func (h *ParentHandler) GetMyChildren(w http.ResponseWriter, r *http.Request) {
	callerID := userIDFromToken(r)
	if callerID == "" {
		jsonResp(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	ctx := tokenCtx(r)
	resp, err := h.userClient.GetChildren(ctx, &userpb.GetChildrenRequest{ParentId: callerID})
	if err != nil {
		errResp(w, err)
		return
	}
	out := make([]parentLinkResp, 0, len(resp.GetLinks()))
	for _, l := range resp.GetLinks() {
		out = append(out, toParentLinkResp(l))
	}
	jsonResp(w, http.StatusOK, out)
}

// DELETE /parent/links/{id}  —  remove a parent-student link
func (h *ParentHandler) RemoveParentLink(w http.ResponseWriter, r *http.Request) {
	callerID := userIDFromToken(r)
	if callerID == "" {
		jsonResp(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	linkID := r.PathValue("id")
	if linkID == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "link id is required"})
		return
	}
	ctx := tokenCtx(r)
	_, err := h.userClient.RemoveParentLink(ctx, &userpb.RemoveParentLinkRequest{
		LinkId:   linkID,
		CallerId: callerID,
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, map[string]string{"status": "removed"})
}

// GET /parent/children/{student_id}/overview  —  parent views child's attendance per course
func (h *ParentHandler) GetChildOverview(w http.ResponseWriter, r *http.Request) {
	callerID := userIDFromToken(r)
	if callerID == "" {
		jsonResp(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	studentID := r.PathValue("student_id")
	if studentID == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "student_id is required"})
		return
	}

	ctx := tokenCtx(r)

	// Verify the caller is actually linked as a parent to this student.
	childrenResp, err := h.userClient.GetChildren(ctx, &userpb.GetChildrenRequest{ParentId: callerID})
	if err != nil {
		errResp(w, err)
		return
	}
	linked := false
	for _, l := range childrenResp.GetLinks() {
		if l.GetStudentId() == studentID {
			linked = true
			break
		}
	}
	if !linked {
		jsonResp(w, http.StatusForbidden, map[string]string{"error": "not linked to this student"})
		return
	}

	// Get child's enrollments.
	enrollResp, err := h.enrollmentClient.GetUserEnrollments(ctx, &enrollmentpb.UserRequest{UserId: studentID})
	if err != nil {
		jsonResp(w, http.StatusOK, childOverviewResponse{
			StudentID: studentID,
			Courses:   []courseAttendance{},
		})
		return
	}

	courseIDs := make([]string, 0, len(enrollResp.GetEnrollments()))
	for _, e := range enrollResp.GetEnrollments() {
		courseIDs = append(courseIDs, e.GetCourseId())
	}

	// Per course: fetch live lessons and check attendance (concurrent).
	courseResults := make([]courseAttendance, len(courseIDs))
	var wg sync.WaitGroup

	for i, cid := range courseIDs {
		wg.Add(1)
		go func(idx int, courseID string) {
			defer wg.Done()
			ca := courseAttendance{CourseID: courseID}

			lessonsResp, err := h.lessonClient.GetCourseLessons(ctx, &lessonpb.GetCourseLessonsRequest{CourseId: courseID})
			if err != nil {
				courseResults[idx] = ca
				return
			}

			for _, l := range lessonsResp.GetLessons() {
				vl := strings.ToLower(l.GetVideoLink())
				if !strings.Contains(vl, "meet.google") && !strings.Contains(vl, "zoom.us") && !strings.Contains(vl, "teams.microsoft") {
					continue
				}
				ca.TotalLessons++

				attResp, attErr := h.lessonClient.GetAttendance(ctx, &lessonpb.GetAttendanceRequest{LessonId: l.GetId()})
				if attErr != nil {
					continue
				}
				for _, rec := range attResp.GetRecords() {
					if rec.GetStudentId() == studentID && rec.GetAttended() {
						ca.AttendedLessons++
						break
					}
				}
			}

			if ca.TotalLessons > 0 {
				ca.AttendancePct = int(float64(ca.AttendedLessons) / float64(ca.TotalLessons) * 100)
			}
			courseResults[idx] = ca
		}(i, cid)
	}
	wg.Wait()

	var totalAttended, totalLessons int
	for _, ca := range courseResults {
		totalAttended += ca.AttendedLessons
		totalLessons += ca.TotalLessons
	}
	var overallPct int
	if totalLessons > 0 {
		overallPct = int(float64(totalAttended) / float64(totalLessons) * 100)
	}

	if courseResults == nil {
		courseResults = []courseAttendance{}
	}

	jsonResp(w, http.StatusOK, childOverviewResponse{
		StudentID:            studentID,
		Courses:              courseResults,
		TotalAttended:        totalAttended,
		TotalLessons:         totalLessons,
		OverallAttendancePct: overallPct,
	})
}
