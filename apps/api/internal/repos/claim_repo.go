package repos

import (
	"context"
	"errors"

	"campusLostAndFound/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ClaimRepo struct {
	pool *pgxpool.Pool
}

func NewClaimRepo(pool *pgxpool.Pool) *ClaimRepo {
	return &ClaimRepo{pool: pool}
}

func (r *ClaimRepo) Create(ctx context.Context, claim *models.Claim) error {
	query := `
		INSERT INTO claims (post_id, claimant_user_id, message, verification_encrypted, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`
	err := r.pool.QueryRow(ctx, query,
		claim.PostID, claim.ClaimantUserID, claim.Message, claim.VerificationEncrypted, claim.Status,
	).Scan(&claim.ID, &claim.CreatedAt, &claim.UpdatedAt)

	return err
}

func (r *ClaimRepo) GetByPostID(ctx context.Context, postID string) ([]*models.Claim, error) {
	query := `
		SELECT id, post_id, claimant_user_id, message, verification_encrypted, status, created_at, updated_at
		FROM claims
		WHERE post_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var claims []*models.Claim
	for rows.Next() {
		claim := &models.Claim{}
		if err := rows.Scan(
			&claim.ID, &claim.PostID, &claim.ClaimantUserID, &claim.Message, &claim.VerificationEncrypted,
			&claim.Status, &claim.CreatedAt, &claim.UpdatedAt,
		); err != nil {
			return nil, err
		}
		claims = append(claims, claim)
	}

	return claims, nil
}

func (r *ClaimRepo) GetByID(ctx context.Context, id string) (*models.Claim, error) {
	query := `
		SELECT id, post_id, claimant_user_id, message, verification_encrypted, status, created_at, updated_at
		FROM claims
		WHERE id = $1
	`
	claim := &models.Claim{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&claim.ID, &claim.PostID, &claim.ClaimantUserID, &claim.Message, &claim.VerificationEncrypted,
		&claim.Status, &claim.CreatedAt, &claim.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, errors.New("claim not found")
	}
	return claim, err
}

func (r *ClaimRepo) UpdateStatus(ctx context.Context, id string, status models.ClaimStatus) error {
	query := `
		UPDATE claims
		SET status = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`
	_, err := r.pool.Exec(ctx, query, status, id)
	return err
}

// MarkPostResolved marks the associated post as resolved once a claim is accepted
func (r *ClaimRepo) MarkPostResolved(ctx context.Context, postID string) error {
	query := `
		UPDATE posts
		SET is_resolved = TRUE, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`
	_, err := r.pool.Exec(ctx, query, postID)
	return err
}

// GetByUserID returns all claims submitted by a specific user
func (r *ClaimRepo) GetByUserID(ctx context.Context, userID string) ([]*models.Claim, error) {
	query := `
		SELECT id, post_id, claimant_user_id, message, verification_encrypted, status, created_at, updated_at
		FROM claims
		WHERE claimant_user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var claims []*models.Claim
	for rows.Next() {
		claim := &models.Claim{}
		if err := rows.Scan(
			&claim.ID, &claim.PostID, &claim.ClaimantUserID, &claim.Message, &claim.VerificationEncrypted,
			&claim.Status, &claim.CreatedAt, &claim.UpdatedAt,
		); err != nil {
			return nil, err
		}
		claims = append(claims, claim)
	}

	return claims, nil
}

// ListAll returns all claims in the system with post and claimant info (Admin only)
func (r *ClaimRepo) ListAll(ctx context.Context) ([]*models.Claim, error) {
	query := `
		SELECT c.id, c.post_id, c.claimant_user_id, c.message, c.verification_encrypted, c.status, c.created_at, c.updated_at,
		       p.title as post_title, u.name as claimant_name
		FROM claims c
		JOIN posts p ON c.post_id = p.id
		JOIN users u ON c.claimant_user_id = u.id
		ORDER BY c.created_at DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var claims []*models.Claim
	for rows.Next() {
		claim := &models.Claim{}
		if err := rows.Scan(
			&claim.ID, &claim.PostID, &claim.ClaimantUserID, &claim.Message, &claim.VerificationEncrypted,
			&claim.Status, &claim.CreatedAt, &claim.UpdatedAt,
			&claim.PostTitle, &claim.ClaimantName,
		); err != nil {
			return nil, err
		}
		claims = append(claims, claim)
	}

	return claims, nil
}
