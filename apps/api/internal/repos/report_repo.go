package repos

import (
	"context"

	"campusLostAndFound/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ReportRepo struct {
	pool *pgxpool.Pool
}

func NewReportRepo(pool *pgxpool.Pool) *ReportRepo {
	return &ReportRepo{pool: pool}
}

func (r *ReportRepo) Create(ctx context.Context, report *models.Report) error {
	query := `
		INSERT INTO reports (post_id, reporter_user_id, reason, details)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`
	err := r.pool.QueryRow(ctx, query,
		report.PostID, report.ReporterUserID, report.Reason, report.Details,
	).Scan(&report.ID, &report.CreatedAt)

	return err
}

func (r *ReportRepo) List(ctx context.Context) ([]*models.Report, error) {
	query := `
		SELECT id, post_id, reporter_user_id, reason, details, created_at, resolved_at, resolved_by
		FROM reports
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []*models.Report
	for rows.Next() {
		report := &models.Report{}
		if err := rows.Scan(
			&report.ID, &report.PostID, &report.ReporterUserID, &report.Reason, &report.Details,
			&report.CreatedAt, &report.ResolvedAt, &report.ResolvedBy,
		); err != nil {
			return nil, err
		}
		reports = append(reports, report)
	}

	return reports, nil
}

func (r *ReportRepo) CleanupExpiredPosts(ctx context.Context) (int64, error) {
	query := `
		DELETE FROM posts
		WHERE expires_at < CURRENT_TIMESTAMP
	`
	tag, err := r.pool.Exec(ctx, query)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}
