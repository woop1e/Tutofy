# review-service

Course ratings and written reviews. Only students who are enrolled AND have reached 100% course progress can submit a review.

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `CreateReview` | Student | Submit a 1–5 star rating with optional text (one per course) |
| `GetCourseReviews` | Any | List all reviews for a course (limit, offset) |
| `GetCourseRating` | Any | Get the average rating and total count for a course |

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50065` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |
| `PROGRESS_SERVICE_ADDR` | `localhost:50058` | No |
| `ENROLLMENT_SERVICE_ADDR` | `localhost:50054` | No |

## Running Locally

```bash
DB_URL=postgres://user:pass@localhost/reviews?sslmode=disable go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up review-service
```
