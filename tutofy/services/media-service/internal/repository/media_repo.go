package repository

import (
	"context"
	"database/sql"
	"errors"

	"media-service/internal/model"
)

var ErrNotFound = errors.New("file not found")

// MediaRepository is the data-access contract for file metadata.
type MediaRepository interface {
	SaveFile(ctx context.Context, f *model.MediaFile) error
	GetFileByID(ctx context.Context, id string) (*model.MediaFile, error)
	DeleteFile(ctx context.Context, id string) error
}

type postgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(db *sql.DB) MediaRepository {
	return &postgresRepo{db: db}
}

func (r *postgresRepo) SaveFile(ctx context.Context, f *model.MediaFile) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO media_files (id, course_id, uploader_id, file_name, s3_key, file_type, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		f.ID, f.CourseID, f.UploaderID, f.FileName, f.S3Key, int32(f.FileType), f.CreatedAt,
	)
	return err
}

func (r *postgresRepo) GetFileByID(ctx context.Context, id string) (*model.MediaFile, error) {
	f := &model.MediaFile{}
	var fileType int32
	err := r.db.QueryRowContext(ctx,
		`SELECT id, course_id, uploader_id, file_name, s3_key, file_type, created_at
		 FROM media_files WHERE id = $1`, id,
	).Scan(&f.ID, &f.CourseID, &f.UploaderID, &f.FileName, &f.S3Key, &fileType, &f.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	f.FileType = model.FileType(fileType)
	return f, nil
}

func (r *postgresRepo) DeleteFile(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM media_files WHERE id = $1`, id)
	if err != nil {
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
