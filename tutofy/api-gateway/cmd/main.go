package main

import (
	"fmt"
	"log"
	"net/http"

	"api-gateway/internal/config"
	"api-gateway/internal/handler"

	"auth-service/proto/authpb"
	"user-service/proto/userpb"
	"course-service/proto/coursepb"
	"enrollment-service/proto/enrollmentpb"
	"lesson-service/proto/lessonpb"
	"assignment-service/proto/assignmentpb"
	"grading-service/proto/gradingpb"
	"notification-service/proto/notificationpb"
	"progress-service/proto/progresspb"
	"payment-service/proto/paymentpb"
	"messaging-service/proto/messagingpb"
	"media-service/proto/mediapb"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func dial(addr string) *grpc.ClientConn {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("dial %s: %v", addr, err)
	}
	return conn
}

func main() {
	cfg := config.Load()

	// Dial all services.
	authConn         := dial(cfg.AuthServiceAddr)
	userConn         := dial(cfg.UserServiceAddr)
	courseConn       := dial(cfg.CourseServiceAddr)
	enrollmentConn   := dial(cfg.EnrollmentServiceAddr)
	lessonConn       := dial(cfg.LessonServiceAddr)
	assignmentConn   := dial(cfg.AssignmentServiceAddr)
	gradingConn      := dial(cfg.GradingServiceAddr)
	notificationConn := dial(cfg.NotificationSvcAddr)
	progressConn     := dial(cfg.ProgressServiceAddr)
	paymentConn      := dial(cfg.PaymentServiceAddr)
	messagingConn    := dial(cfg.MessagingServiceAddr)
	mediaConn        := dial(cfg.MediaServiceAddr)

	// Build handlers.
	ah  := handler.NewAuthHandler(authpb.NewAuthServiceClient(authConn))
	uh  := handler.NewUserHandler(userpb.NewUserServiceClient(userConn))
	ch  := handler.NewCourseHandler(coursepb.NewCourseServiceClient(courseConn))
	eh  := handler.NewEnrollmentHandler(enrollmentpb.NewEnrollmentServiceClient(enrollmentConn))
	lh  := handler.NewLessonHandler(lessonpb.NewLessonServiceClient(lessonConn))
	ash := handler.NewAssignmentHandler(assignmentpb.NewAssignmentServiceClient(assignmentConn))
	gh  := handler.NewGradingHandler(gradingpb.NewGradingServiceClient(gradingConn))
	nh  := handler.NewNotificationHandler(notificationpb.NewNotificationServiceClient(notificationConn))
	ph  := handler.NewProgressHandler(progresspb.NewProgressServiceClient(progressConn))
	pyh := handler.NewPaymentHandler(paymentpb.NewPaymentServiceClient(paymentConn))
	msh := handler.NewMessagingHandler(messagingpb.NewMessagingServiceClient(messagingConn))
	mdh := handler.NewMediaHandler(mediapb.NewMediaServiceClient(mediaConn))

	mux := http.NewServeMux()

	// Auth
	mux.HandleFunc("POST /auth/register", ah.Register)
	mux.HandleFunc("POST /auth/login",    ah.Login)

	// Users
	mux.HandleFunc("GET /users",        uh.GetAllUsers)
	mux.HandleFunc("GET /users/{id}",   uh.GetUser)
	mux.HandleFunc("PUT /users/{id}",   uh.UpdateUser)
	mux.HandleFunc("DELETE /users/{id}", uh.DeleteUser)

	// Courses
	mux.HandleFunc("POST /courses",        ch.CreateCourse)
	mux.HandleFunc("GET /courses",         ch.GetAllCourses)
	mux.HandleFunc("GET /courses/{id}",    ch.GetCourse)
	mux.HandleFunc("PUT /courses/{id}",    ch.UpdateCourse)
	mux.HandleFunc("DELETE /courses/{id}", ch.DeleteCourse)

	// Enrollments
	mux.HandleFunc("POST /enrollments",                    eh.EnrollUser)
	mux.HandleFunc("DELETE /enrollments",                  eh.UnenrollUser)
	mux.HandleFunc("GET /users/{id}/enrollments",          eh.GetUserEnrollments)
	mux.HandleFunc("GET /courses/{id}/enrollments",        eh.GetCourseEnrollments)

	// Lessons
	mux.HandleFunc("POST /lessons",                       lh.CreateLesson)
	mux.HandleFunc("GET /lessons/{id}",                   lh.GetLesson)
	mux.HandleFunc("GET /courses/{id}/lessons",           lh.GetCourseLessons)
	mux.HandleFunc("PATCH /lessons/{id}/status",          lh.UpdateLessonStatus)
	mux.HandleFunc("DELETE /lessons/{id}",                lh.DeleteLesson)

	// Assignments
	mux.HandleFunc("POST /assignments",                    ash.CreateAssignment)
	mux.HandleFunc("GET /assignments/{id}",                ash.GetAssignment)
	mux.HandleFunc("GET /courses/{id}/assignments",        ash.GetAssignmentsByCourse)
	mux.HandleFunc("PUT /assignments/{id}",                ash.UpdateAssignment)
	mux.HandleFunc("DELETE /assignments/{id}",             ash.DeleteAssignment)

	// Grading
	mux.HandleFunc("POST /grades",                        gh.SubmitGrade)
	mux.HandleFunc("GET /students/{id}/grades",           gh.GetStudentGrades)
	mux.HandleFunc("GET /assignments/{id}/grades",        gh.GetAssignmentGrades)

	// Notifications
	mux.HandleFunc("GET /notifications",                  nh.GetNotifications)
	mux.HandleFunc("PATCH /notifications/{id}/read",      nh.MarkAsRead)

	// Progress
	mux.HandleFunc("GET /progress/{student_id}/{course_id}", ph.GetProgress)
	mux.HandleFunc("GET /courses/{id}/progress",             ph.GetCourseProgress)

	// Payments
	mux.HandleFunc("POST /payments",                      pyh.CreatePayment)
	mux.HandleFunc("GET /payments/{id}",                  pyh.GetPayment)
	mux.HandleFunc("GET /users/{id}/payments",            pyh.GetUserPayments)
	mux.HandleFunc("PATCH /payments/{id}/complete",       pyh.CompletePayment)
	mux.HandleFunc("PATCH /payments/{id}/fail",           pyh.FailPayment)

	// Messaging
	mux.HandleFunc("POST /messages",                      msh.SendMessage)
	mux.HandleFunc("GET /conversations",                  msh.GetUserConversations)
	mux.HandleFunc("GET /conversations/{user_id}",        msh.GetConversation)

	// Media
	mux.HandleFunc("GET /media/{id}/download",            mdh.GetDownloadURL)
	mux.HandleFunc("DELETE /media/{id}",                  mdh.DeleteFile)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("api-gateway listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server: %v", err)
	}
}
