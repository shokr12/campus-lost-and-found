package auth

import (
	"os"
	"testing"
)

func init() {
	os.Setenv("REFRESH_TOKEN_PEPPER", "secretPepper")
	os.Setenv("JWT_SECRET", "supersecretjwtkey")
}

func TestHashAndVerifyPassword(t *testing.T) {
	password := "StrongPa$$w0rd!"

	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	if hash == password {
		t.Fatalf("Hash should not be equal to the plaintext password")
	}

	// Test valid verification
	valid, err := VerifyPassword(password, hash)
	if err != nil {
		t.Fatalf("Failed to verify password: %v", err)
	}
	if !valid {
		t.Fatal("Expected true when verifying valid password")
	}

	// Test invalid password
	valid, err = VerifyPassword("WrongPassword123", hash)
	if err != nil {
		t.Fatalf("Error while verifying wrong password: %v", err)
	}
	if valid {
		t.Fatal("Expected false when verifying invalid password")
	}
}

func TestHashRefreshToken(t *testing.T) {
	token := "randomTokenString123"
	pepper := "secretPepper"

	hash1 := HashRefreshToken(token, pepper)
	hash2 := HashRefreshToken(token, pepper)

	if hash1 != hash2 {
		t.Fatalf("Hash should be deterministic. Got '%s' and '%s'", hash1, hash2)
	}

	hash3 := HashRefreshToken("differentToken", pepper)
	if hash1 == hash3 {
		t.Fatalf("Different tokens should produce different hashes")
	}
}
