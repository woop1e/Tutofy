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
	"submission-service/proto/submissionpb"
	"quiz-service/proto/quizpb"
	"review-service/proto/reviewpb"
	"certificate-service/proto/certificatepb"

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
	submissionConn   := dial(cfg.SubmissionServiceAddr)
	quizConn         := dial(cfg.QuizServiceAddr)
	reviewConn       := dial(cfg.ReviewServiceAddr)
	certificateConn  := dial(cfg.CertificateServiceAddr)

	// Build handlers.
	ah  := handler.NewAuthHandler(authpb.NewAuthServiceClient(authConn), userpb.NewUserServiceClient(userConn))
	uh  := handler.NewUserHandler(userpb.NewUserServiceClient(userConn))
	ch  := handler.NewCourseHandler(coursepb.NewCourseServiceClient(courseConn))
	tph := handler.NewTutorPublicProfileHandler(userpb.NewUserServiceClient(userConn), coursepb.NewCourseServiceClient(courseConn), reviewpb.NewReviewServiceClient(reviewConn))
	eh  := handler.NewEnrollmentHandler(enrollmentpb.NewEnrollmentServiceClient(enrollmentConn))
	lh  := handler.NewLessonHandler(lessonpb.NewLessonServiceClient(lessonConn), notificationpb.NewNotificationServiceClient(notificationConn), enrollmentpb.NewEnrollmentServiceClient(enrollmentConn), paymentpb.NewPaymentServiceClient(paymentConn))
	ash := handler.NewAssignmentHandler(assignmentpb.NewAssignmentServiceClient(assignmentConn))
	gh  := handler.NewGradingHandler(gradingpb.NewGradingServiceClient(gradingConn))
	nh  := handler.NewNotificationHandler(notificationpb.NewNotificationServiceClient(notificationConn))
	ph  := handler.NewProgressHandler(progresspb.NewProgressServiceClient(progressConn), coursepb.NewCourseServiceClient(courseConn))
	pyh := handler.NewPaymentHandler(paymentpb.NewPaymentServiceClient(paymentConn))
	msh := handler.NewMessagingHandler(
		messagingpb.NewMessagingServiceClient(messagingConn),
		userpb.NewUserServiceClient(userConn),
		enrollmentpb.NewEnrollmentServiceClient(enrollmentConn),
		coursepb.NewCourseServiceClient(courseConn),
		lessonpb.NewLessonServiceClient(lessonConn),
	)
	mdh := handler.NewMediaHandler(mediapb.NewMediaServiceClient(mediaConn))
	sbh := handler.NewSubmissionHandler(submissionpb.NewSubmissionServiceClient(submissionConn))
	qzh := handler.NewQuizHandler(quizpb.NewQuizServiceClient(quizConn))
	rvh := handler.NewReviewHandler(reviewpb.NewReviewServiceClient(reviewConn))
	cfh := handler.NewCertificateHandler(certificatepb.NewCertificateServiceClient(certificateConn))
	gah := handler.NewGoogleAuthHandler(cfg.GoogleClientID, cfg.GoogleClientSecret, cfg.GoogleRedirectURI, authpb.NewAuthServiceClient(authConn))
	sph := handler.NewStudentProfileHandler(
		userpb.NewUserServiceClient(userConn),
		coursepb.NewCourseServiceClient(courseConn),
		enrollmentpb.NewEnrollmentServiceClient(enrollmentConn),
		assignmentpb.NewAssignmentServiceClient(assignmentConn),
		gradingpb.NewGradingServiceClient(gradingConn),
		lessonpb.NewLessonServiceClient(lessonConn),
		progresspb.NewProgressServiceClient(progressConn),
	)

	mux := http.NewServeMux()

	// Auth
	mux.HandleFunc("POST /auth/register",        ah.Register)
	mux.HandleFunc("POST /auth/login",            ah.Login)
	mux.HandleFunc("GET /auth/google/connect",    gah.Connect)
	mux.HandleFunc("GET /auth/google/callback",   gah.Callback)

	// Users
	mux.HandleFunc("GET /users",                       uh.GetAllUsers)
	mux.HandleFunc("GET /users/{id}",                  uh.GetUser)
	mux.HandleFunc("PUT /users/{id}",                  uh.UpdateUser)
	mux.HandleFunc("PUT /users/{id}/profile",          uh.UpdateTutorProfile)
	mux.HandleFunc("GET /users/{id}/tutor-profile",    uh.GetTutorProfile)
	mux.HandleFunc("DELETE /users/{id}",               uh.DeleteUser)
	mux.HandleFunc("PATCH /users/{id}/approve",        uh.ApproveTutor)
	mux.HandleFunc("PATCH /users/{id}/reject",         uh.RejectTutor)
	mux.HandleFunc("GET /admin/pending-tutors",        uh.GetPendingTutors)
	mux.HandleFunc("GET /admin/tutors",                uh.GetAllTutors)

	// Courses
	mux.HandleFunc("POST /courses",               ch.CreateCourse)
	mux.HandleFunc("GET /courses",                ch.GetAllCourses)
	mux.HandleFunc("GET /courses/{id}",           ch.GetCourse)
	mux.HandleFunc("PUT /courses/{id}",           ch.UpdateCourse)
	mux.HandleFunc("PATCH /courses/{id}/publish", ch.PublishCourse)
	mux.HandleFunc("DELETE /courses/{id}",        ch.DeleteCourse)

	// Marketplace
	mux.HandleFunc("GET /marketplace/tutors",      tph.SearchTutors)
	mux.HandleFunc("GET /marketplace/tutors/{id}", tph.GetTutorPublicProfile)
	mux.HandleFunc("GET /marketplace/courses",     tph.SearchCourses)
	mux.HandleFunc("GET /tutors/{id}/booked-slots", lh.GetTutorBookedSlots)

	// Enrollments
	mux.HandleFunc("POST /enrollments",                              eh.EnrollUser)
	mux.HandleFunc("DELETE /enrollments",                           eh.UnenrollUser)
	mux.HandleFunc("GET /users/{id}/enrollments",                   eh.GetUserEnrollments)
	mux.HandleFunc("GET /courses/{id}/enrollments",                 eh.GetCourseEnrollments)
	mux.HandleFunc("POST /courses/{id}/enrollment-requests",        eh.RequestEnrollment)
	mux.HandleFunc("GET /courses/{id}/enrollment-requests",         eh.GetCourseEnrollmentRequests)
	mux.HandleFunc("PATCH /enrollment-requests/{id}/approve",       eh.ApproveEnrollmentRequest)
	mux.HandleFunc("PATCH /enrollment-requests/{id}/reject",        eh.RejectEnrollmentRequest)

	// Individual lesson booking flow: request → tutor confirms/declines → student pays
	mux.HandleFunc("POST /book-lesson",                   lh.BookLesson)
	mux.HandleFunc("PATCH /lessons/{id}/confirm",         lh.ConfirmLesson)
	mux.HandleFunc("PATCH /lessons/{id}/decline",         lh.DeclineLesson)
	mux.HandleFunc("POST /lessons/{id}/pay",              lh.PayForLesson)
	// Tutor: get all individual (non-course) lessons booked with them
	mux.HandleFunc("GET /tutor/individual-lessons", lh.GetTutorIndividualLessons)

	// Lessons
	mux.HandleFunc("POST /lessons",                  lh.CreateLesson)
	mux.HandleFunc("GET /lessons/{id}",              lh.GetLesson)
	mux.HandleFunc("GET /courses/{id}/lessons",      lh.GetCourseLessons)
	mux.HandleFunc("GET /schedule",                  lh.GetMySchedule)
	mux.HandleFunc("GET /my-lessons",                lh.GetMyLessons)
	mux.HandleFunc("POST /lessons/{id}/materials",   lh.AddMaterial)
	mux.HandleFunc("GET /lessons/{id}/materials",    lh.GetLessonMaterials)
	mux.HandleFunc("GET /lessons/{id}/attendance",   lh.GetAttendance)
	mux.HandleFunc("POST /lessons/{id}/attendance",  lh.MarkAttendance)
	mux.HandleFunc("PATCH /lessons/{id}/status",        lh.UpdateLessonStatus)
	mux.HandleFunc("PATCH /lessons/{id}/meeting-link",  lh.SetVideoLink)
	mux.HandleFunc("DELETE /lessons/{id}",              lh.DeleteLesson)

	// Assignments
	mux.HandleFunc("POST /assignments",             ash.CreateAssignment)
	mux.HandleFunc("GET /assignments/{id}",         ash.GetAssignment)
	mux.HandleFunc("GET /courses/{id}/assignments", ash.GetAssignmentsByCourse)
	mux.HandleFunc("PUT /assignments/{id}",         ash.UpdateAssignment)
	mux.HandleFunc("DELETE /assignments/{id}",      ash.DeleteAssignment)

	// Grading
	mux.HandleFunc("POST /grades",                   gh.SubmitGrade)
	mux.HandleFunc("GET /students/{id}/grades",      gh.GetStudentGrades)
	mux.HandleFunc("GET /assignments/{id}/grades",   gh.GetAssignmentGrades)

	// Notifications
	mux.HandleFunc("GET /notifications",             nh.GetNotifications)
	mux.HandleFunc("PATCH /notifications/{id}/read", nh.MarkAsRead)

	// Progress
	mux.HandleFunc("GET /progress/{student_id}/{course_id}", ph.GetProgress)
	mux.HandleFunc("GET /courses/{id}/progress",             ph.GetCourseProgress)
	mux.HandleFunc("POST /lessons/{id}/complete",            ph.MarkLessonComplete)

	// Payments
	mux.HandleFunc("POST /payments",                 pyh.CreatePayment)
	mux.HandleFunc("GET /payments/{id}",             pyh.GetPayment)
	mux.HandleFunc("GET /users/{id}/payments",       pyh.GetUserPayments)
	mux.HandleFunc("PATCH /payments/{id}/complete",  pyh.CompletePayment)
	mux.HandleFunc("PATCH /payments/{id}/fail",      pyh.FailPayment)

	// Messaging
	mux.HandleFunc("POST /messages",                msh.SendMessage)
	mux.HandleFunc("GET /conversations",            msh.GetUserConversations)
	mux.HandleFunc("GET /conversations/{user_id}",  msh.GetConversation)
	mux.HandleFunc("GET /my-students",              msh.GetMyStudents)
	mux.HandleFunc("GET /my-coursemates",          	msh.GetMyCoursemates) 
	mux.HandleFunc("GET /my-tutors", 				msh.GetMyTutors)

	// Student profile (tutor view — scoped to tutor's courses/assignments/lessons)
	mux.HandleFunc("GET /tutor/students/{student_id}/profile", sph.GetStudentProfile)

	// Media
	mux.HandleFunc("POST /media/upload",            mdh.UploadFile)
	mux.HandleFunc("GET /media/{id}/download",      mdh.GetDownloadURL)
	mux.HandleFunc("DELETE /media/{id}",            mdh.DeleteFile)

	// Certificates
	mux.HandleFunc("POST /certificates",                          cfh.IssueCertificate)
	mux.HandleFunc("GET /users/{id}/certificates",                cfh.GetUserCertificates)
	mux.HandleFunc("GET /certificates/{student_id}/{course_id}",  cfh.GetCertificate)

	// Reviews
	mux.HandleFunc("POST /reviews",             rvh.CreateReview)
	mux.HandleFunc("GET /courses/{id}/reviews", rvh.GetCourseReviews)
	mux.HandleFunc("GET /courses/{id}/rating",  rvh.GetCourseRating)

	// Submissions
	mux.HandleFunc("POST /submissions",                           sbh.SubmitAssignment)
	mux.HandleFunc("GET /submissions/{assignmentId}/me",          sbh.GetMySubmission)
	mux.HandleFunc("GET /submissions/{assignmentId}/{studentId}", sbh.GetSubmission)
	mux.HandleFunc("GET /assignments/{id}/submissions",           sbh.GetAssignmentSubmissions)

	// Quizzes
	mux.HandleFunc("POST /quizzes",               qzh.CreateQuiz)
	mux.HandleFunc("POST /quizzes/{id}/questions", qzh.AddQuestion)
	mux.HandleFunc("POST /questions/{id}/options", qzh.AddOption)
	mux.HandleFunc("DELETE /quizzes/{id}",         qzh.DeleteQuiz)
	mux.HandleFunc("GET /courses/{id}/quizzes",    qzh.GetCourseQuizzes)
	mux.HandleFunc("GET /quizzes/{id}",            qzh.GetQuizForAttempt)
	mux.HandleFunc("POST /quizzes/{id}/attempts",  qzh.StartAttempt)
	mux.HandleFunc("POST /attempts/{id}/submit",      qzh.SubmitAttempt)
	mux.HandleFunc("GET /attempts/{id}/result",       qzh.GetAttemptResult)
	mux.HandleFunc("PUT /quizzes/{id}/settings",      qzh.UpdateQuizSettings)
	mux.HandleFunc("GET /quizzes/{id}/my-attempts",   qzh.GetStudentAttempts)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("api-gateway listening on %s", addr)
	if err := http.ListenAndServe(addr, corsMiddleware(mux)); err != nil {
		log.Fatalf("server: %v", err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
