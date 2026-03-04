package models

import (
	"time"

	"github.com/google/uuid"
)

type Report struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	PostID         uuid.UUID  `json:"postId" db:"post_id"`
	ReporterUserID uuid.UUID  `json:"reporterUserId" db:"reporter_user_id"`
	Reason         string     `json:"reason" db:"reason"`
	Details        string     `json:"details" db:"details"`
	CreatedAt      time.Time  `json:"createdAt" db:"created_at"`
	ResolvedAt     *time.Time `json:"resolvedAt,omitempty" db:"resolved_at"`
	ResolvedBy     *uuid.UUID `json:"resolvedBy,omitempty" db:"resolved_by"`
}

type CreateReportInput struct {
	Reason  string `json:"reason"`
	Details string `json:"details"`
}
