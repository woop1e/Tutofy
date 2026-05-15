package handler

import (
	"context"
	"net/http"
	"sync"

	"course-service/proto/coursepb"
	"enrollment-service/proto/enrollmentpb"
	"lesson-service/proto/lessonpb"
	"messaging-service/proto/messagingpb"
	"user-service/proto/userpb"
)

type MessagingHandler struct {
	client       messagingpb.MessagingServiceClient
	userClient   userpb.UserServiceClient
	enrollClient enrollmentpb.EnrollmentServiceClient
	courseClient coursepb.CourseServiceClient
	lessonClient lessonpb.LessonServiceClient
}

func NewMessagingHandler(
	c messagingpb.MessagingServiceClient,
	uc userpb.UserServiceClient,
	ec enrollmentpb.EnrollmentServiceClient,
	cc coursepb.CourseServiceClient,
	lc lessonpb.LessonServiceClient,
) *MessagingHandler {
	return &MessagingHandler{client: c, userClient: uc, enrollClient: ec, courseClient: cc, lessonClient: lc}
}

func (h *MessagingHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	var req messagingpb.SendMessageRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.client.SendMessage(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *MessagingHandler) GetConversation(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetConversation(tokenCtx(r), &messagingpb.GetConversationRequest{
		OtherUserId: r.PathValue("user_id"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

type studentItem struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// GetMyStudents returns all students associated with the authenticated tutor:
// enrolled in their courses, who booked individual lessons, or who have messaged them.
func (h *MessagingHandler) GetMyStudents(w http.ResponseWriter, r *http.Request) {
	ctx := tokenCtx(r)
	tutorID := userIDFromToken(r)

	seen := make(map[string]bool)
	var userIDs []string

	add := func(uid string) {
		if uid != "" && uid != tutorID && !seen[uid] {
			seen[uid] = true
			userIDs = append(userIDs, uid)
		}
	}

	// 1. Students enrolled in the tutor's courses.
	coursesResp, err := h.courseClient.GetAllCourses(ctx, &coursepb.GetAllCoursesRequest{Limit: 500})
	if err == nil {
		for _, c := range coursesResp.GetCourses() {
			if c.GetTutorId() != tutorID {
				continue
			}
			enrollResp, err := h.enrollClient.GetCourseEnrollments(ctx, &enrollmentpb.CourseRequest{CourseId: c.GetId()})
			if err != nil {
				continue
			}
			for _, e := range enrollResp.GetEnrollments() {
				add(e.GetUserId())
			}
		}
	}

	// 2. Students who booked individual (non-course) lessons with this tutor.
	if h.lessonClient != nil {
		lessonsResp, err := h.lessonClient.GetTutorIndividualLessons(ctx, &lessonpb.Empty{})
		if err == nil {
			for _, l := range lessonsResp.GetLessons() {
				add(l.GetStudentId())
			}
		}
	}

	// 3. Students who have messaged the tutor.
	convResp, err := h.client.GetUserConversations(ctx, &messagingpb.GetUserConversationsRequest{})
	if err == nil {
		for _, conv := range convResp.GetConversations() {
			add(conv.GetOtherUserId())
		}
	}

	students := make([]studentItem, len(userIDs))
	var wg sync.WaitGroup
	for i, uid := range userIDs {
		wg.Add(1)
		go func(i int, uid string) {
			defer wg.Done()
			s := studentItem{ID: uid}
			if u, err := h.userClient.GetUser(ctx, &userpb.GetUserRequest{UserId: uid}); err == nil {
				s.Name = u.GetName()
			}
			students[i] = s
		}(i, uid)
	}
	wg.Wait()

	if students == nil {
		students = []studentItem{}
	}
	jsonResp(w, http.StatusOK, map[string]any{"students": students})
}

type enrichedConversation struct {
	OtherUserID   string `json:"other_user_id"`
	OtherUserName string `json:"other_user_name"`
	LastMessage   string `json:"last_message"`
	LastMessageAt string `json:"last_message_at"`
	IsEnrolled    bool   `json:"is_enrolled"`
}

func (h *MessagingHandler) GetUserConversations(w http.ResponseWriter, r *http.Request) {
	ctx := tokenCtx(r)

	resp, err := h.client.GetUserConversations(ctx, &messagingpb.GetUserConversationsRequest{})
	if err != nil {
		errResp(w, err)
		return
	}

	convs := resp.GetConversations()
	if len(convs) == 0 {
		jsonResp(w, http.StatusOK, map[string]any{"conversations": []enrichedConversation{}})
		return
	}

	tutorID := userIDFromToken(r)
	tutorCourseIDs := h.getTutorCourseIDs(ctx, tutorID)

	enriched := make([]enrichedConversation, len(convs))
	var wg sync.WaitGroup
	for i, conv := range convs {
		wg.Add(1)
		go func(i int, conv *messagingpb.ConversationItem) {
			defer wg.Done()
			ec := enrichedConversation{
				OtherUserID:   conv.GetOtherUserId(),
				LastMessage:   conv.GetLastMessage(),
				LastMessageAt: conv.GetLastMessageAt(),
			}
			if u, err := h.userClient.GetUser(ctx, &userpb.GetUserRequest{UserId: conv.GetOtherUserId()}); err == nil {
				ec.OtherUserName = u.GetName()
			}
			if len(tutorCourseIDs) > 0 {
				ec.IsEnrolled = h.isUserEnrolled(ctx, conv.GetOtherUserId(), tutorCourseIDs)
			}
			enriched[i] = ec
		}(i, conv)
	}
	wg.Wait()

	jsonResp(w, http.StatusOK, map[string]any{"conversations": enriched})
}

func (h *MessagingHandler) getTutorCourseIDs(ctx context.Context, tutorID string) map[string]bool {
	if tutorID == "" {
		return nil
	}
	courses, err := h.courseClient.GetAllCourses(ctx, &coursepb.GetAllCoursesRequest{Limit: 500})
	if err != nil {
		return nil
	}
	ids := make(map[string]bool)
	for _, c := range courses.GetCourses() {
		if c.GetTutorId() == tutorID {
			ids[c.GetId()] = true
		}
	}
	return ids
}

func (h *MessagingHandler) isUserEnrolled(ctx context.Context, userID string, tutorCourseIDs map[string]bool) bool {
	enrollments, err := h.enrollClient.GetUserEnrollments(ctx, &enrollmentpb.UserRequest{UserId: userID})
	if err != nil {
		return false
	}
	for _, e := range enrollments.GetEnrollments() {
		if tutorCourseIDs[e.GetCourseId()] {
			return true
		}
	}
	return false
}

type coursemateItem struct {
    ID     string `json:"id"`
    Name   string `json:"name"`
    Course string `json:"course"`
}

func (h *MessagingHandler) GetMyCoursemates(w http.ResponseWriter, r *http.Request) {
    ctx := tokenCtx(r)
    studentID := userIDFromToken(r)

    // Получаем все курсы студента
    enrollResp, err := h.enrollClient.GetUserEnrollments(ctx, &enrollmentpb.UserRequest{UserId: studentID})
    if err != nil {
        jsonResp(w, http.StatusOK, map[string]any{"coursemates": []coursemateItem{}})
        return
    }

    seen := make(map[string]bool)
    seen[studentID] = true // исключаем себя
    var coursemates []coursemateItem

    for _, e := range enrollResp.GetEnrollments() {
        courseID := e.GetCourseId()

        // Получаем всех студентов на этом курсе
        courseEnroll, err := h.enrollClient.GetCourseEnrollments(ctx, &enrollmentpb.CourseRequest{CourseId: courseID})
        if err != nil {
            continue
        }

        // Получаем название курса
        var courseTitle string
        if c, err := h.courseClient.GetCourse(ctx, &coursepb.GetCourseRequest{CourseId: courseID}); err == nil {
            courseTitle = c.GetTitle()
        }

        for _, ce := range courseEnroll.GetEnrollments() {
            uid := ce.GetUserId()
            if uid == "" || seen[uid] {
                continue
            }
            seen[uid] = true
            item := coursemateItem{ID: uid, Course: courseTitle}
            if u, err := h.userClient.GetUser(ctx, &userpb.GetUserRequest{UserId: uid}); err == nil {
                item.Name = u.GetName()
            }
            coursemates = append(coursemates, item)
        }
    }

    if coursemates == nil {
        coursemates = []coursemateItem{}
    }
    jsonResp(w, http.StatusOK, map[string]any{"coursemates": coursemates})
}

type tutorItem struct {
    ID     string `json:"id"`
    Name   string `json:"name"`
    Course string `json:"course"`
}

func (h *MessagingHandler) GetMyTutors(w http.ResponseWriter, r *http.Request) {
    ctx := tokenCtx(r)
    studentID := userIDFromToken(r)

    enrollResp, err := h.enrollClient.GetUserEnrollments(ctx, &enrollmentpb.UserRequest{UserId: studentID})
    if err != nil {
        jsonResp(w, http.StatusOK, map[string]any{"tutors": []tutorItem{}})
        return
    }

    seen := make(map[string]bool)
    var tutors []tutorItem

    for _, e := range enrollResp.GetEnrollments() {
        courseID := e.GetCourseId()
        course, err := h.courseClient.GetCourse(ctx, &coursepb.GetCourseRequest{CourseId: courseID})
        if err != nil {
            continue
        }
        tutorID := course.GetTutorId()
        if tutorID == "" || seen[tutorID] {
            continue
        }
        seen[tutorID] = true
        item := tutorItem{ID: tutorID, Course: course.GetTitle()}
        if u, err := h.userClient.GetUser(ctx, &userpb.GetUserRequest{UserId: tutorID}); err == nil {
            item.Name = u.GetName()
        }
        tutors = append(tutors, item)
    }

    if tutors == nil {
        tutors = []tutorItem{}
    }
    jsonResp(w, http.StatusOK, map[string]any{"tutors": tutors})
}
