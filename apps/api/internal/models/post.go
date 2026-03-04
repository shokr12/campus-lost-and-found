package models

import (
	"time"

	"github.com/google/uuid"
)

type PostStatus string

const (
	StatusLost  PostStatus = "lost"
	StatusFound PostStatus = "found"
)

type Post struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	UserID           uuid.UUID  `json:"userId" db:"user_id"`
	Status           PostStatus `json:"status" db:"status"`
	Title            string     `json:"title" db:"title"`
	Description      string     `json:"description" db:"description"`
	Category         string     `json:"category" db:"category"`
	Location         string     `json:"location" db:"location"`
	DateLostOrFound  time.Time  `json:"dateLostOrFound" db:"date_lost_or_found"`
	PhotoURL         *string    `json:"photoUrl,omitempty" db:"photo_url"`
	ContactEncrypted *string    `json:"-" db:"contact_encrypted"` // Hidden from JSON, handled in service layer
	IsResolved       bool       `json:"isResolved" db:"is_resolved"`
	ExpiresAt        time.Time  `json:"expiresAt" db:"expires_at"`
	CreatedAt        time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt        time.Time  `json:"updatedAt" db:"updated_at"`

	// Joined attributes
	ContactInfo *string `json:"contactInfo,omitempty" db:"-"`
}

// Handlers inputs
type CreatePostInput struct {
	Status          PostStatus `json:"status"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	Category        string     `json:"category"`
	Location        string     `json:"location"`
	DateLostOrFound string     `json:"dateLostOrFound"` // YYYY-MM-DD
	ContactInfo     *string    `json:"contactInfo"`
}
