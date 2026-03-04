package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"campusLostAndFound/internal/auth"
	"campusLostAndFound/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("No .env file found")
	}

	ctx := context.Background()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	// Initial schema migration
	schemaBytes, err := os.ReadFile("../../db/migrations/000001_init_schema.up.sql")
	if err != nil {
		log.Fatalf("Failed to read migration file: %v\n", err)
	}
	log.Println("Running database migrations...")
	_, err = pool.Exec(ctx, string(schemaBytes))
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
	log.Println("Database migrations complete.")

	// Seeding Data
	log.Println("Seeding database...")
	seedDatabase(ctx, pool)
	log.Println("Database seeded successfully.")
}

func seedDatabase(ctx context.Context, pool *pgxpool.Pool) {
	// Clear existing data (in case of re-seed)
	pool.Exec(ctx, "TRUNCATE users, posts, claims, reports CASCADE")

	// 1. Users (1 Admin, 1 Moderator, 6 Users)
	users := []models.User{
		{Name: "Admin User", Email: "admin@campus.edu", Role: models.RoleAdmin},
		{Name: "Mod User", Email: "mod@campus.edu", Role: models.RoleModerator},
	}
	for i := 1; i <= 6; i++ {
		users = append(users, models.User{
			Name:  fmt.Sprintf("Student %d", i),
			Email: fmt.Sprintf("student%d@campus.edu", i),
			Role:  models.RoleUser,
		})
	}

	hashedPassword, _ := auth.HashPassword("password123")
	userIDs := make([]uuid.UUID, len(users))

	for i, u := range users {
		var id uuid.UUID
		err := pool.QueryRow(ctx, "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
			u.Name, u.Email, hashedPassword, u.Role).Scan(&id)
		if err != nil {
			log.Fatalf("Failed inserting user %s: %v", u.Name, err)
		}
		userIDs[i] = id
	}

	// 2. Posts (20 posts)
	categories := []string{"electronics", "clothing", "books", "IDs", "accessories", "other"}
	postIDs := make([]uuid.UUID, 20)

	for i := 0; i < 20; i++ {
		status := models.StatusLost
		if i%2 == 0 {
			status = models.StatusFound
		}

		isResolved := i%5 == 0 // Some resolved
		expiresAt := time.Now().AddDate(0, 0, 14)
		if i%4 == 0 {
			expiresAt = time.Now().AddDate(0, 0, -1) // Some expired
		}

		userID := userIDs[2+(i%6)] // Assign to students

		err := pool.QueryRow(ctx, `
			INSERT INTO posts (user_id, status, title, description, category, location, date_lost_or_found, is_resolved, expires_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
			userID, status, fmt.Sprintf("Missing item %d", i), "A detailed description of the item.",
			categories[i%len(categories)], "Library Room A", time.Now().AddDate(0, 0, -i), isResolved, expiresAt).Scan(&postIDs[i])

		if err != nil {
			log.Fatalf("Failed inserting post: %v", err)
		}
	}

	// 3. Claims (15 claims)
	for i := 0; i < 15; i++ {
		postID := postIDs[i]
		claimantID := userIDs[(i+1)%6+2] // ensure claimant!=owner for simplicity

		status := models.ClaimPending
		if i%3 == 0 {
			status = models.ClaimAccepted
		} else if i%4 == 0 {
			status = models.ClaimRejected
		}

		_, err := pool.Exec(ctx, `
			INSERT INTO claims (post_id, claimant_user_id, message, status)
			VALUES ($1, $2, $3, $4)`,
			postID, claimantID, fmt.Sprintf("I think this is mine #%d", i), status)

		if err != nil {
			log.Fatalf("Failed inserting claim: %v", err)
		}
	}
}
