package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

// StorageAdapter defines the interface for file uploads
type StorageAdapter interface {
	UploadFile(ctx context.Context, file io.Reader, filename string) (string, error)
	DeleteFile(ctx context.Context, fileURL string) error
}

// LocalStorage implements StorageAdapter for the local filesystem
type LocalStorage struct {
	baseDir string
	baseURL string
}

func NewLocalStorage(baseDir, baseURL string) *LocalStorage {
	// Ensure the directory exists
	os.MkdirAll(baseDir, os.ModePerm)
	return &LocalStorage{
		baseDir: baseDir,
		baseURL: baseURL,
	}
}

func (s *LocalStorage) UploadFile(ctx context.Context, file io.Reader, filename string) (string, error) {
	ext := filepath.Ext(filename)
	uniqueName := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)

	fullPath := filepath.Join(s.baseDir, uniqueName)

	out, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		return "", err
	}

	return fmt.Sprintf("%s/%s", s.baseURL, uniqueName), nil
}

func (s *LocalStorage) DeleteFile(ctx context.Context, fileURL string) error {
	filename := filepath.Base(fileURL)
	fullPath := filepath.Join(s.baseDir, filename)

	err := os.Remove(fullPath)
	if os.IsNotExist(err) {
		return nil // Already deleted or doesn't exist
	}
	return err
}

// S3Storage is a placeholder for future S3 integration
type S3Storage struct {
	bucketName string
	region     string
}

func NewS3Storage(bucketName, region string) *S3Storage {
	return &S3Storage{
		bucketName: bucketName,
		region:     region,
	}
}

func (s *S3Storage) UploadFile(ctx context.Context, file io.Reader, filename string) (string, error) {
	// TODO: Implement AWS SDK upload
	return "", fmt.Errorf("S3 upload not yet implemented")
}

func (s *S3Storage) DeleteFile(ctx context.Context, fileURL string) error {
	// TODO: Implement AWS SDK delete
	return fmt.Errorf("S3 delete not yet implemented")
}
