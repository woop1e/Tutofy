package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"media-service/proto/mediapb"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

func main() {
	conn, err := grpc.NewClient("localhost:50059", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to connect: %v", err)
	}
	defer conn.Close()

	client := mediapb.NewMediaServiceClient(conn)

	// Add auth token to every request
	ctx := metadata.AppendToOutgoingContext(context.Background(), "authorization", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Nzg0MDM2NTMsInJvbGUiOiJhZG1pbiIsInVzZXJfaWQiOiIzNzc5NDlhYS1kOTUyLTRjMGItYTIzMy01YTY1NWE1NWQ0YzMifQ.8rP8unl2NqbIMvJtgJJAscRp41RlXhCruR0SB-W6LkM")

	// --- UPLOAD ---
	fileBytes, err := os.ReadFile("test_client/test.pdf") // put any file named test.pdf in the same folder
	if err != nil {
		log.Fatalf("failed to read file: %v", err)
	}

	uploadResp, err := client.UploadFile(ctx, &mediapb.UploadFileRequest{
		CourseId: "course-1",
		FileName: "test.pdf",
		FileType: mediapb.FileType_FILE_TYPE_COURSE_MATERIAL,
		Data:     fileBytes,
	})
	if err != nil {
		log.Fatalf("upload failed: %v", err)
	}
	fmt.Println("Uploaded! file_id:", uploadResp.GetFileId())

	// --- DOWNLOAD ---
	downloadResp, err := client.GetDownloadURL(ctx, &mediapb.GetDownloadURLRequest{
		FileId: uploadResp.GetFileId(),
	})
	if err != nil {
		log.Fatalf("get download URL failed: %v", err)
	}
	fmt.Println("Download URL:", downloadResp.GetUrl())
	fmt.Println("File name:", downloadResp.GetFileName())
}
