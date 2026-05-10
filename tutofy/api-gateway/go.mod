module api-gateway

go 1.25.10

require (
	assignment-service v0.0.0
	auth-service v0.0.0
	course-service v0.0.0
	enrollment-service v0.0.0
	github.com/joho/godotenv v1.5.1
	google.golang.org/grpc v1.81.0
	google.golang.org/protobuf v1.36.11
	grading-service v0.0.0
	lesson-service v0.0.0
	media-service v0.0.0
	messaging-service v0.0.0
	notification-service v0.0.0
	payment-service v0.0.0
	progress-service v0.0.0
	user-service v0.0.0
)

require (
	golang.org/x/net v0.51.0 // indirect
	golang.org/x/sys v0.42.0 // indirect
	golang.org/x/text v0.34.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20260226221140-a57be14db171 // indirect
)

replace auth-service => ../services/auth-service

replace user-service => ../services/user-service

replace course-service => ../services/course-service

replace enrollment-service => ../services/enrollment-service

replace lesson-service => ../services/lesson-service

replace assignment-service => ../services/assignment-service

replace grading-service => ../services/grading-service

replace notification-service => ../services/notification-service

replace progress-service => ../services/progress-service

replace payment-service => ../services/payment-service

replace messaging-service => ../services/messaging-service

replace media-service => ../services/media-service
