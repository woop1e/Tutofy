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

// AuthInterceptor validates the Bearer token in incoming gRPC metadata
// by calling auth-service, then injects user_id and role into the context.
func AuthInterceptor(authClient authpb.AuthServiceClient) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {
		// RecordLessonEvent is an internal service-to-service call.
		// It must carry a valid service token the same way user calls do;
		// auth-service should return role="service" for those tokens.
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

// UserIDFromContext extracts the authenticated user ID from the context.
func UserIDFromContext(ctx context.Context) string {
	v, _ := ctx.Value(ContextKeyUserID).(string)
	return v
}

// RoleFromContext extracts the authenticated role from the context.
func RoleFromContext(ctx context.Context) string {
	v, _ := ctx.Value(ContextKeyRole).(string)
	return v
}
