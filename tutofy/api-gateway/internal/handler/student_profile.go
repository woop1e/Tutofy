package handler

import (
	"net/http"
	"sync"

	"assignment-service/proto/assignmentpb"
	"course-service/proto/coursepb"
	"enrollment-service/proto/enrollmentpb"
	"grading-service/proto/gradingpb"
	"lesson-service/proto/lessonpb"
	"progress-service/proto/progresspb"
	"user-service/proto/userpb"
)

// StudentProfileHandler aggregates all student data filtered to the calling tutor's scope.
type StudentProfileHandler struct {
	userClient       userpb.UserServiceClient
	courseClient     coursepb.CourseServiceClient
	enrollmentClient enrollmentpb.EnrollmentServiceClient
	assignmentClient assignmentpb.AssignmentServiceClient
	gradingClient    gradingpb.GradingServiceClient
	lessonClient     lessonpb.LessonServiceClient
	progressClient   progresspb.ProgressServiceClient
}

func NewStudentProfileHandler(
	u userpb.UserServiceClient,
	c coursepb.CourseServiceClient,
	e enrollmentpb.EnrollmentServiceClient,
	a assignmentpb.AssignmentServiceClient,
	g gradingpb.GradingServiceClient,
	l lessonpb.LessonServiceClient,
	p progresspb.ProgressServiceClient,
) *StudentProfileHandler {
	return &StudentProfileHandler{
		userClient:       u,
		courseClient:     c,
		enrollmentClient: e,
		assignmentClient: a,
		gradingClient:    g,
		lessonClient:     l,
		progressClient:   p,
	}
}

// ── response shapes ───────────────────────────────────────────────────────────

type spStudent struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	CreatedAt string `json:"created_at"`
}

type spCourse struct {
	ID               string  `json:"id"`
	Title            string  `json:"title"`
	ProgressPct      float32 `json:"progress_pct"`
	CompletedLessons int32   `json:"completed_lessons"`
	TotalLessons     int32   `json:"total_lessons"`
}

type spAssignment struct {
	ID          string  `json:"id"`
	CourseID    string  `json:"course_id"`
	CourseTitle string  `json:"course_title"`
	Title       string  `json:"title"`
	DueDate     string  `json:"due_date"`
	Grade       float64 `json:"grade"`
	MaxGrade    float64 `json:"max_grade"`
	Submitted   bool    `json:"submitted"`
	Feedback    string  `json:"feedback"`
}

type spScheduledAt struct {
	Seconds int64 `json:"seconds"`
	Nanos   int32 `json:"nanos"`
}

type spLesson struct {
	ID          string        `json:"id"`
	CourseID    string        `json:"course_id"`
	CourseTitle string        `json:"course_title"`
	Title       string        `json:"title"`
	ScheduledAt spScheduledAt `json:"scheduled_at"`
	Attended    bool          `json:"attended"`
}

type spGradesSummary struct {
	Average     float64 `json:"average"`
	TotalGraded int     `json:"total_graded"`
}

type spAttendanceSummary struct {
	Attended int `json:"attended"`
	Total    int `json:"total"`
	Pct      int `json:"pct"`
}

type studentProfileResponse struct {
	Student           spStudent           `json:"student"`
	Courses           []spCourse          `json:"courses"`
	Assignments       []spAssignment      `json:"assignments"`
	GradesSummary     spGradesSummary     `json:"grades_summary"`
	Lessons           []spLesson          `json:"lessons"`
	AttendanceSummary spAttendanceSummary `json:"attendance_summary"`
}

// ── handler ───────────────────────────────────────────────────────────────────

func (h *StudentProfileHandler) GetStudentProfile(w http.ResponseWriter, r *http.Request) {
	tutorID := userIDFromToken(r)
	if tutorID == "" {
		jsonResp(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	studentID := r.PathValue("student_id")
	if studentID == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "student_id is required"})
		return
	}

	ctx := tokenCtx(r)

	// ── Step 1: get student user info ─────────────────────────────────────────
	studentUser, err := h.userClient.GetUser(ctx, &userpb.GetUserRequest{UserId: studentID})
	if err != nil {
		errResp(w, err)
		return
	}

	student := spStudent{
		ID:    studentUser.GetId(),
		Name:  studentUser.GetName(),
		Email: studentUser.GetEmail(),
		Role:  studentUser.GetRole(),
	}

	// ── Step 2: get all courses, filter to tutor's ────────────────────────────
	coursesResp, err := h.courseClient.GetAllCourses(ctx, &coursepb.GetAllCoursesRequest{Limit: 500})
	if err != nil {
		// Can't do anything useful without courses; return minimal profile.
		jsonResp(w, http.StatusOK, studentProfileResponse{
			Student:     student,
			Courses:     []spCourse{},
			Assignments: []spAssignment{},
			Lessons:     []spLesson{},
		})
		return
	}

	// Build lookup: tutorCourseID -> CourseResponse
	tutorCourseMap := make(map[string]*coursepb.CourseResponse)
	for _, c := range coursesResp.GetCourses() {
		if c.GetTutorId() == tutorID {
			tutorCourseMap[c.GetId()] = c
		}
	}

	// ── Step 3: get student's enrollments filtered to tutor's courses ─────────
	enrollResp, err := h.enrollmentClient.GetUserEnrollments(ctx, &enrollmentpb.UserRequest{UserId: studentID})
	var enrolledCourseIDs []string
	if err == nil {
		for _, e := range enrollResp.GetEnrollments() {
			if _, ok := tutorCourseMap[e.GetCourseId()]; ok {
				enrolledCourseIDs = append(enrolledCourseIDs, e.GetCourseId())
			}
		}
	}

	// ── Step 4: per-course: lessons + progress (concurrent) ──────────────────
	type perCourseData struct {
		course  spCourse
		lessons []spLesson
	}
	courseResults := make([]perCourseData, len(enrolledCourseIDs))
	var wgCourses sync.WaitGroup

	for i, cid := range enrolledCourseIDs {
		wgCourses.Add(1)
		go func(idx int, courseID string) {
			defer wgCourses.Done()
			courseInfo := tutorCourseMap[courseID]
			courseTitle := courseInfo.GetTitle()

			// Fetch lessons for this course.
			lessonsResp, lessonsErr := h.lessonClient.GetCourseLessons(ctx, &lessonpb.GetCourseLessonsRequest{CourseId: courseID})

			// Fetch progress for this student in this course.
			progressResp, _ := h.progressClient.GetProgress(ctx, &progresspb.GetProgressRequest{
				StudentId: studentID,
				CourseId:  courseID,
			})

			var completedLessons, totalLessons int32
			var completionPct float32
			if progressResp != nil {
				completedLessons = progressResp.GetCompletedLessons()
				totalLessons = progressResp.GetTotalLessons()
				completionPct = progressResp.GetCompletionPct()
			}

			sc := spCourse{
				ID:               courseID,
				Title:            courseTitle,
				ProgressPct:      completionPct,
				CompletedLessons: completedLessons,
				TotalLessons:     totalLessons,
			}

			// Build lesson items and check attendance for this student.
			var lessons []spLesson
			if lessonsErr == nil && lessonsResp != nil {
				for _, l := range lessonsResp.GetLessons() {
					// Check attendance for this lesson.
					attended := false
					attResp, attErr := h.lessonClient.GetAttendance(ctx, &lessonpb.GetAttendanceRequest{LessonId: l.GetId()})
					if attErr == nil && attResp != nil {
						for _, rec := range attResp.GetRecords() {
							if rec.GetStudentId() == studentID && rec.GetAttended() {
								attended = true
								break
							}
						}
					}

					var scheduledAt spScheduledAt
					if ts := l.GetScheduledAt(); ts != nil {
						scheduledAt = spScheduledAt{
							Seconds: ts.GetSeconds(),
							Nanos:   ts.GetNanos(),
						}
					}

					lessons = append(lessons, spLesson{
						ID:          l.GetId(),
						CourseID:    courseID,
						CourseTitle: courseTitle,
						Title:       l.GetTitle(),
						ScheduledAt: scheduledAt,
						Attended:    attended,
					})
				}
			}

			courseResults[idx] = perCourseData{course: sc, lessons: lessons}
		}(i, cid)
	}
	wgCourses.Wait()

	// Flatten course + lesson results.
	courses := make([]spCourse, 0, len(courseResults))
	var allLessons []spLesson
	var attendedCount, totalLessonCount int
	for _, cd := range courseResults {
		courses = append(courses, cd.course)
		for _, l := range cd.lessons {
			allLessons = append(allLessons, l)
			totalLessonCount++
			if l.Attended {
				attendedCount++
			}
		}
	}
	if allLessons == nil {
		allLessons = []spLesson{}
	}

	// ── Step 5: assignments + grades ─────────────────────────────────────────
	// Build set of tutor's assignment IDs.
	type assignmentInfo struct {
		assignment  *assignmentpb.AssignmentResponse
		courseTitle string
	}
	tutorAssignmentMap := make(map[string]assignmentInfo)

	var wgAssignments sync.WaitGroup
	var muAssignments sync.Mutex

	for _, cid := range enrolledCourseIDs {
		wgAssignments.Add(1)
		go func(courseID string) {
			defer wgAssignments.Done()
			aResp, aErr := h.assignmentClient.GetAssignmentsByCourse(ctx, &assignmentpb.CourseRequest{CourseId: courseID})
			if aErr != nil {
				return
			}
			courseTitle := tutorCourseMap[courseID].GetTitle()
			muAssignments.Lock()
			for _, a := range aResp.GetAssignments() {
				tutorAssignmentMap[a.GetId()] = assignmentInfo{assignment: a, courseTitle: courseTitle}
			}
			muAssignments.Unlock()
		}(cid)
	}
	wgAssignments.Wait()

	// Get student grades and filter to tutor's assignments.
	gradesResp, _ := h.gradingClient.GetStudentGrades(ctx, &gradingpb.StudentRequest{StudentId: studentID})

	var assignments []spAssignment
	var gradeSum float64
	var totalGraded int

	if gradesResp != nil {
		for _, g := range gradesResp.GetGrades() {
			info, ok := tutorAssignmentMap[g.GetAssignmentId()]
			if !ok {
				continue
			}
			a := info.assignment
			grade := float64(g.GetGrade())
			gradeSum += grade
			totalGraded++
			assignments = append(assignments, spAssignment{
				ID:          a.GetId(),
				CourseID:    a.GetCourseId(),
				CourseTitle: info.courseTitle,
				Title:       a.GetTitle(),
				DueDate:     a.GetDueDate(),
				Grade:       grade,
				MaxGrade:    100.0,
				Submitted:   true,
				Feedback:    g.GetFeedback(),
			})
		}
	}

	// Also include assignments that don't yet have a grade (not submitted).
	gradedIDs := make(map[string]bool, len(assignments))
	for _, a := range assignments {
		gradedIDs[a.ID] = true
	}
	for _, info := range tutorAssignmentMap {
		a := info.assignment
		if gradedIDs[a.GetId()] {
			continue
		}
		assignments = append(assignments, spAssignment{
			ID:          a.GetId(),
			CourseID:    a.GetCourseId(),
			CourseTitle: info.courseTitle,
			Title:       a.GetTitle(),
			DueDate:     a.GetDueDate(),
			Grade:       0,
			MaxGrade:    100.0,
			Submitted:   false,
			Feedback:    "",
		})
	}
	if assignments == nil {
		assignments = []spAssignment{}
	}

	// ── Step 6: compute summaries ────────────────────────────────────────────
	var gradeAvg float64
	if totalGraded > 0 {
		gradeAvg = gradeSum / float64(totalGraded)
	}

	var attendancePct int
	if totalLessonCount > 0 {
		attendancePct = int(float64(attendedCount) / float64(totalLessonCount) * 100)
	}

	jsonResp(w, http.StatusOK, studentProfileResponse{
		Student:     student,
		Courses:     courses,
		Assignments: assignments,
		GradesSummary: spGradesSummary{
			Average:     gradeAvg,
			TotalGraded: totalGraded,
		},
		Lessons: allLessons,
		AttendanceSummary: spAttendanceSummary{
			Attended: attendedCount,
			Total:    totalLessonCount,
			Pct:      attendancePct,
		},
	})
}
