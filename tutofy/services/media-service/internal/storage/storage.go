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
	s3      *s3.Client
	bucket  string
	presign *s3.PresignClient
}

// Config holds S3/MinIO connection settings.
type Config struct {
	Endpoint        string // e.g. "http://localhost:9000" for MinIO
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
	Region          string // use "us-east-1" for MinIO
}

// NewClient creates an S3-compatible storage client.
// Works with AWS S3, MinIO, Cloudflare R2, and Backblaze B2.
func NewClient(ctx context.Context, cfg Config) (*Client, error) {
	customResolver := aws.EndpointResolverWithOptionsFunc(
		func(service, region string, options ...interface{}) (aws.Endpoint, error) {
			if cfg.Endpoint != "" {
				return aws.Endpoint{
					URL:               cfg.Endpoint,
					HostnameImmutable: true, // required for MinIO
				}, nil
			}
			return aws.Endpoint{}, &aws.EndpointNotFoundError{}
		},
	)

	awsCfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(cfg.Region),
		config.WithEndpointResolverWithOptions(customResolver),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load S3 config: %w", err)
	}

	s3Client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = true // required for MinIO
	})

	return &Client{
		s3:      s3Client,
		bucket:  cfg.Bucket,
		presign: s3.NewPresignClient(s3Client),
	}, nil
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
		// Ignore "already exists" errors.
		return nil
	}
	return nil
}
