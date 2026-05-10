# api-gateway

HTTP/JSON to gRPC translation layer. The single entry point for all frontend clients on port 8080.
Extracts the Bearer token from the Authorization header and forwards it as gRPC metadata — no auth logic lives here.

## Routes

| Method | Path | Service |
|---|---|---|
| POST | /auth/register | auth-service |
| POST | /auth/login | auth-service |
| GET/PUT/DELETE | /users/{id} | user-service |
| POST/GET | /courses | course-service |
| GET/PUT/DELETE | /courses/{id} | course-service |
| POST | /enrollments | enrollment-service |
| GET | /users/{id}/enrollments | enrollment-service |
| POST/GET | /lessons | lesson-service |
| POST/GET | /assignments | assignment-service |
| POST | /grades | grading-service |
| GET | /notifications | notification-service |
| GET | /progress/{student_id}/{course_id} | progress-service |
| POST/GET | /payments | payment-service |
| POST/GET | /messages | messaging-service |
| GET/DELETE | /media/{id} | media-service |

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `PORT` | `8080` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |
| `USER_SERVICE_ADDR` | `localhost:50052` | No |
| `COURSE_SERVICE_ADDR` | `localhost:50053` | No |
| `ENROLLMENT_SERVICE_ADDR` | `localhost:50054` | No |
| `LESSON_SERVICE_ADDR` | `localhost:50055` | No |
| `GRADING_SERVICE_ADDR` | `localhost:50056` | No |
| `NOTIFICATION_SERVICE_ADDR` | `localhost:50057` | No |
| `PROGRESS_SERVICE_ADDR` | `localhost:50058` | No |
| `ASSIGNMENT_SERVICE_ADDR` | `localhost:50059` | No |
| `MESSAGING_SERVICE_ADDR` | `localhost:50060` | No |
| `PAYMENT_SERVICE_ADDR` | `localhost:50061` | No |
| `MEDIA_SERVICE_ADDR` | `localhost:50062` | No |

## Running Locally

```bash
go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up api-gateway
```
