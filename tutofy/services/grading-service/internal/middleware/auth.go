package middleware

import (
	"context"
	"strings"

	"auth-service/proto/authpb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

var publicMethods = map[string]bool{
	"/grading.GradingService/GetStudentGrades": true,
}

func AuthInterceptor(authClient authpb.AuthServiceClient) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {
		if publicMethods[info.FullMethod] {
			return handler(ctx, req)
		}
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "missing metadata")
		}

		vals := md.Get("authorization")
		if len(vals) == 0 {
			return nil, status.Error(codes.Unauthenticated, "missing authorization header")
		}

		token := strings.TrimPrefix(vals[0], "Bearer ")
		if token == "" {
			return nil, status.Error(codes.Unauthenticated, "empty token")
		}

		resp, err := authClient.ValidateToken(ctx, &authpb.TokenRequest{Token: token})
		if err != nil {
			return nil, status.Error(codes.Unauthenticated, "invalid token")
		}

		ctx = context.WithValue(ctx, ContextKeyUserID, resp.GetUserId())
		ctx = context.WithValue(ctx, ContextKeyRole, resp.GetRole())

		return handler(ctx, req)
	}
}

func UserIDFromContext(ctx context.Context) string {
	v, _ := ctx.Value(ContextKeyUserID).(string)
	return v
}

func RoleFromContext(ctx context.Context) string {
	v, _ := ctx.Value(ContextKeyRole).(string)
	return v
}
