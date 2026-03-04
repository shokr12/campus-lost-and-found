package repos

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"campusLostAndFound/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostRepo struct {
	pool *pgxpool.Pool
}

func NewPostRepo(pool *pgxpool.Pool) *PostRepo {
	return &PostRepo{pool: pool}
}

func (r *PostRepo) Create(ctx context.Context, post *models.Post) error {
	query := `
		INSERT INTO posts (user_id, status, title, description, category, location, date_lost_or_found, photo_url, contact_encrypted, is_resolved, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at
	`
	err := r.pool.QueryRow(ctx, query,
		post.UserID, post.Status, post.Title, post.Description, post.Category, post.Location,
		post.DateLostOrFound, post.PhotoURL, post.ContactEncrypted, post.IsResolved, post.ExpiresAt,
	).Scan(&post.ID, &post.CreatedAt, &post.UpdatedAt)

	return err
}

func (r *PostRepo) GetByID(ctx context.Context, id string) (*models.Post, error) {
	query := `
		SELECT id, user_id, status, title, description, category, location, date_lost_or_found, photo_url, contact_encrypted, is_resolved, expires_at, created_at, updated_at
		FROM posts
		WHERE id = $1
	`
	post := &models.Post{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&post.ID, &post.UserID, &post.Status, &post.Title, &post.Description, &post.Category,
		&post.Location, &post.DateLostOrFound, &post.PhotoURL, &post.ContactEncrypted,
		&post.IsResolved, &post.ExpiresAt, &post.CreatedAt, &post.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, errors.New("post not found")
	}
	return post, err
}

type PostFilter struct {
	Status         string
	Category       string
	Query          string
	IncludeExpired bool
	UserID         string
}

func (r *PostRepo) List(ctx context.Context, filter PostFilter) ([]*models.Post, error) {
	var conditions []string
	var args []interface{}
	argID := 1

	if filter.UserID != "" {
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", argID))
		args = append(args, filter.UserID)
		argID++
	}

	if filter.Status != "" {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argID))
		args = append(args, filter.Status)
		argID++
	}

	if filter.Category != "" {
		conditions = append(conditions, fmt.Sprintf("category = $%d", argID))
		args = append(args, filter.Category)
		argID++
	}

	if filter.Query != "" {
		conditions = append(conditions, fmt.Sprintf("(title ILIKE $%d OR description ILIKE $%d)", argID, argID))
		args = append(args, "%"+filter.Query+"%")
		argID++
	}

	if !filter.IncludeExpired {
		conditions = append(conditions, fmt.Sprintf("expires_at > $%d", argID))
		args = append(args, time.Now())
		argID++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	query := fmt.Sprintf(`
		SELECT id, user_id, status, title, description, category, location, date_lost_or_found, photo_url, contact_encrypted, is_resolved, expires_at, created_at, updated_at
		FROM posts
		%s
		ORDER BY created_at DESC
		LIMIT 50
	`, whereClause)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*models.Post
	for rows.Next() {
		post := &models.Post{}
		if err := rows.Scan(
			&post.ID, &post.UserID, &post.Status, &post.Title, &post.Description, &post.Category,
			&post.Location, &post.DateLostOrFound, &post.PhotoURL, &post.ContactEncrypted,
			&post.IsResolved, &post.ExpiresAt, &post.CreatedAt, &post.UpdatedAt,
		); err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}
func (r *PostRepo) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM posts WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

func (r *PostRepo) UpdateStatus(ctx context.Context, id string, isResolved bool) error {
	query := `UPDATE posts SET is_resolved = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
	_, err := r.pool.Exec(ctx, query, isResolved, id)
	return err
}
