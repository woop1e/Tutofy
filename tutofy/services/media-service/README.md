# media-service

Handles file uploads and downloads for course materials and student submissions. Files are stored in S3-compatible object storage (AWS S3 or MinIO).

## Endpoints (gRPC)

| RPC | Role | Description |
|---|---|---|
| `UploadFile` | Tutor / admin (materials), enrolled student (submissions) | Upload a file |
| `GetDownloadURL` | Enrolled student / tutor / admin | Get a pre-signed download URL (1-hour expiry) |
| `DeleteFile` | Uploader / admin | Remove a file |

Supported formats: PDF, PNG, JPEG, DOC, DOCX, PPT, PPTX. Max message size: 50 MB.

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `DB_URL` | — | Yes |
| `PORT` | `50062` | No |
| `AUTH_SERVICE_ADDR` | `localhost:50051` | No |
| `ENROLLMENT_SERVICE_ADDR` | `localhost:50054` | No |
| `S3_BUCKET` | — | Yes |
| `S3_ACCESS_KEY_ID` | — | Yes |
| `S3_SECRET_ACCESS_KEY` | — | Yes |
| `S3_ENDPOINT` | (AWS S3) | No — set to `http://localhost:9000` for MinIO |
| `S3_REGION` | `us-east-1` | No |

## Running Locally (with MinIO)

```bash
docker run -p 9000:9000 minio/minio server /data

DB_URL=postgres://user:pass@localhost/media?sslmode=disable \
S3_ENDPOINT=http://localhost:9000 \
S3_ACCESS_KEY_ID=minioadmin \
S3_SECRET_ACCESS_KEY=minioadmin \
S3_BUCKET=tutofy-media \
go run ./cmd
```

## Running with Docker

```bash
cd services && docker compose up media-service
```
