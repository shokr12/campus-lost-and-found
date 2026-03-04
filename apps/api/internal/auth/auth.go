package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/argon2"
)

// Constants for Argon2id hashing
const (
	saltLen  = 16
	timeCost = 1
	memory   = 64 * 1024
	threads  = 4
	keyLen   = 32
)

// App claims for JWT
type AppClaims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// HashPassword hashes a password using Argon2id
func HashPassword(password string) (string, error) {
	salt := make([]byte, saltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	hash := argon2.IDKey([]byte(password), salt, timeCost, memory, threads, keyLen)

	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	// Format: $argon2id$v=19$m=65536,t=1,p=4$<salt>$<hash>
	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s", argon2.Version, memory, timeCost, threads, b64Salt, b64Hash), nil
}

// VerifyPassword verifies an Argon2id hashed password
func VerifyPassword(password, encodedHash string) (bool, error) {
	vals := strings.Split(encodedHash, "$")
	if len(vals) != 6 {
		return false, fmt.Errorf("invalid hash format")
	}

	var version int
	_, err := fmt.Sscanf(vals[2], "v=%d", &version)
	if err != nil {
		return false, err
	}
	if version != argon2.Version {
		return false, fmt.Errorf("incompatible version")
	}

	var mem, timeC, threadsC int
	_, err = fmt.Sscanf(vals[3], "m=%d,t=%d,p=%d", &mem, &timeC, &threadsC)
	if err != nil {
		return false, err
	}

	salt, err := base64.RawStdEncoding.DecodeString(vals[4])
	if err != nil {
		return false, err
	}

	hash, err := base64.RawStdEncoding.DecodeString(vals[5])
	if err != nil {
		return false, err
	}

	compareHash := argon2.IDKey([]byte(password), salt, uint32(timeC), uint32(mem), uint8(threadsC), uint32(len(hash)))

	if len(hash) != len(compareHash) {
		return false, nil
	}

	for i := range hash {
		if hash[i] != compareHash[i] {
			return false, nil
		}
	}

	return true, nil
}

// HashRefreshToken generates a SHA256 HMAC of the refresh token using a secret pepper
func HashRefreshToken(token, pepper string) string {
	h := hmac.New(sha256.New, []byte(pepper))
	h.Write([]byte(token))
	return hex.EncodeToString(h.Sum(nil))
}

// GenerateTokens creates a short-lived access token and a long-lived random refresh token
func GenerateTokens(userID, role, jwtSecret string, expMinutes int) (string, string, error) {
	claims := AppClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expMinutes) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", "", err
	}

	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", err
	}
	refreshToken := base64.URLEncoding.EncodeToString(b)

	return accessToken, refreshToken, nil
}
