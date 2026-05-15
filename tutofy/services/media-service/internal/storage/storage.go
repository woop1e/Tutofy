package storage

import (
	"bytes"
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Client wraps the S3/MinIO client with the operations media-service needs.
type Client struct {
	s3      *s3.Client        // internal endpoint — used for uploads/deletes
	bucket  string
	presign *s3.PresignClient // may use a different (public) endpoint for URL signing
}

// Config holds S3/MinIO connection settings.
type Config struct {
	Endpoint        string // internal endpoint, e.g. "http://minio:9000"
	PublicEndpoint  string // browser-reachable endpoint, e.g. "http://localhost:9000"; used for presigned URLs
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
	Region          string // use "us-east-1" for MinIO
}

// NewClient creates an S3-compatible storage client.
func NewClient(ctx context.Context, cfg Config) (*Client, error) {
	creds := credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, "")

	// Internal client — used for all real S3 operations.
	internalCfg, err := buildAWSConfig(ctx, cfg.Endpoint, cfg.Region, creds)
	if err != nil {
		return nil, fmt.Errorf("failed to load S3 config: %w", err)
	}
	s3Client := s3.NewFromConfig(internalCfg, func(o *s3.Options) { o.UsePathStyle = true })

	// Presign client — if a public endpoint is given, sign URLs against that
	// host so browsers outside Docker can reach them.
	presignEndpoint := cfg.PublicEndpoint
	if presignEndpoint == "" {
		presignEndpoint = cfg.Endpoint
	}
	presignCfg, err := buildAWSConfig(ctx, presignEndpoint, cfg.Region, creds)
	if err != nil {
		return nil, fmt.Errorf("failed to load presign S3 config: %w", err)
	}
	presignS3 := s3.NewFromConfig(presignCfg, func(o *s3.Options) { o.UsePathStyle = true })

	return &Client{
		s3:      s3Client,
		bucket:  cfg.Bucket,
		presign: s3.NewPresignClient(presignS3),
	}, nil
}

func buildAWSConfig(ctx context.Context, endpoint, region string, creds aws.CredentialsProvider) (aws.Config, error) {
	resolver := aws.EndpointResolverWithOptionsFunc(
		func(service, reg string, options ...interface{}) (aws.Endpoint, error) {
			if endpoint != "" {
				return aws.Endpoint{URL: endpoint, HostnameImmutable: true}, nil
			}
			return aws.Endpoint{}, &aws.EndpointNotFoundError{}
		},
	)
	return config.LoadDefaultConfig(ctx,
		config.WithRegion(region),
		config.WithEndpointResolverWithOptions(resolver),
		config.WithCredentialsProvider(creds),
	)
}

// Upload stores raw bytes under the given key in the bucket.
func (c *Client) Upload(ctx context.Context, key string, data []byte, contentType string) error {
	_, err := c.s3.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(contentType),
	})
	return err
}

// PresignDownload generates a presigned GET URL valid for the given duration.
// The URL is signed against the public endpoint so browsers can open it directly.
func (c *Client) PresignDownload(ctx context.Context, key string, expires time.Duration) (string, error) {
	req, err := c.presign.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expires))
	if err != nil {
		return "", fmt.Errorf("failed to presign download URL: %w", err)
	}
	return req.URL, nil
}

// Delete removes a file from the bucket.
func (c *Client) Delete(ctx context.Context, key string) error {
	_, err := c.s3.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})
	return err
}

// EnsureBucket creates the bucket if it does not already exist.
func (c *Client) EnsureBucket(ctx context.Context) error {
	_, err := c.s3.CreateBucket(ctx, &s3.CreateBucketInput{
		Bucket: aws.String(c.bucket),
	})
	if err != nil {
		return nil // ignore "already exists"
	}
	return nil
}
