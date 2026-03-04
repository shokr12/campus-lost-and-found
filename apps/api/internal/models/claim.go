package models

import (
	"time"

	"github.com/google/uuid"
)

type ClaimStatus string

const (
	ClaimPending  ClaimStatus = "pending"
	ClaimAccepted ClaimStatus = "accepted"
	ClaimRejected ClaimStatus = "rejected"
)

type Claim struct {
	ID                    uuid.UUID   `json:"id" db:"id"`
	PostID                uuid.UUID   `json:"postId" db:"post_id"`
	ClaimantUserID        uuid.UUID   `json:"claimantUserId" db:"claimant_user_id"`
	Message               string      `json:"message" db:"message"`
	VerificationEncrypted *string     `json:"-" db:"verification_encrypted"`
	Status                ClaimStatus `json:"status" db:"status"`
	CreatedAt             time.Time   `json:"createdAt" db:"created_at"`
	UpdatedAt             time.Time   `json:"updatedAt" db:"updated_at"`

	// Joined attributes
	VerificationDetail *string `json:"verificationDetail,omitempty" db:"-"`
	PostTitle          string  `json:"postTitle,omitempty" db:"-"`
	ClaimantName       string  `json:"claimantName,omitempty" db:"-"`
}

type CreateClaimInput struct {
	Message            string  `json:"message"`
	VerificationDetail *string `json:"verificationDetail"`
}

type UpdateClaimStatusInput struct {
	Status ClaimStatus `json:"status"`
}
