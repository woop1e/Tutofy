package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"

	_ "github.com/lib/pq"
	"auth-service/proto/authpb"
	"certificate-service/internal/config"
	"certificate-service/internal/handler"
	"certificate-service/internal/middleware"
	"certificate-service/internal/repository"
	"certificate-service/internal/service"
	"certificate-service/proto/certificatepb"
	"progress-service/proto/progresspb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	cfg := config.Load()

	db, err := sql.Open("postgres", cfg.DBURL)
	if err != nil {
		log.Fatalf("db open: %v", err)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		log.Fatalf("db ping: %v", err)
	}

	dial := func(addr string) *grpc.ClientConn {
		conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			log.Fatalf("dial %s: %v", addr, err)
		}
		return conn
	}

	authConn     := dial(cfg.AuthServiceAddr)
	progressConn := dial(cfg.ProgressServiceAddr)
	defer authConn.Close()
	defer progressConn.Close()

	repo := repository.NewPostgresRepo(db)
	svc := service.NewCertificateService(repo, progresspb.NewProgressServiceClient(progressConn))
	h := handler.NewCertificateHandler(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(authpb.NewAuthServiceClient(authConn))),
	)
	certificatepb.RegisterCertificateServiceServer(grpcServer, h)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Port))
	if err != nil {
		log.Fatalf("listen: %v", err)
	}
	log.Printf("certificate-service listening on :%s", cfg.Port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
