package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"time"

	"campusLostAndFound/internal/auth"
	"campusLostAndFound/internal/models"
	"campusLostAndFound/internal/repos"
)

type AuthHandler struct {
	userRepo *repos.UserRepo
	authRepo *repos.AuthRepo
}

func NewAuthHandler(userRepo *repos.UserRepo, authRepo *repos.AuthRepo) *AuthHandler {
	return &AuthHandler{
		userRepo: userRepo,
		authRepo: authRepo,
	}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input models.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Name == "" || input.Email == "" || input.Password == "" {
		http.Error(w, "missing required fields", http.StatusBadRequest)
		return
	}

	existingUser, _ := h.userRepo.GetByEmail(r.Context(), input.Email)
	if existingUser != nil {
		http.Error(w, "user already exists", http.StatusConflict)
		return
	}

	hashedPassword, err := auth.HashPassword(input.Password)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

	user := &models.User{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: hashedPassword,
		Role:         models.RoleUser,
	}

	if err := h.userRepo.Create(r.Context(), user); err != nil {
		http.Error(w, "failed to create user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "user created successfully"})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input models.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetByEmail(r.Context(), input.Email)
	if err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	valid, err := auth.VerifyPassword(input.Password, user.PasswordHash)
	if err != nil || !valid {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	pepper := os.Getenv("REFRESH_TOKEN_PEPPER")

	accessToken, refreshToken, err := auth.GenerateTokens(user.ID.String(), string(user.Role), jwtSecret, 15)
	if err != nil {
		http.Error(w, "failed to generate tokens", http.StatusInternalServerError)
		return
	}

	// Store hash of the refresh token
	tokenHash := auth.HashRefreshToken(refreshToken, pepper)
	tokenRecord := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().AddDate(0, 0, 7), // 7 days
	}
	if err := h.authRepo.SaveRefreshToken(r.Context(), tokenRecord); err != nil {
		http.Error(w, "failed to save refresh token", http.StatusInternalServerError)
		return
	}

	// Set httpOnly cookie for refresh token
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("ENV") == "production",
		SameSite: http.SameSiteLaxMode,
		MaxAge:   7 * 24 * 60 * 60,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"access_token": accessToken,
		"user": map[string]interface{}{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		http.Error(w, "refresh token missing", http.StatusUnauthorized)
		return
	}

	refreshToken := cookie.Value
	pepper := os.Getenv("REFRESH_TOKEN_PEPPER")
	tokenHash := auth.HashRefreshToken(refreshToken, pepper)

	tokenRecord, err := h.authRepo.GetByHash(r.Context(), tokenHash)
	if err != nil {
		http.Error(w, "invalid or expired refresh token", http.StatusUnauthorized)
		return
	}

	// Check validity
	if tokenRecord.RevokedAt != nil || tokenRecord.ExpiresAt.Before(time.Now()) {
		http.Error(w, "invalid or expired refresh token", http.StatusUnauthorized)
		return
	}

	// Fetch user to get their role
	user, err := h.userRepo.GetByID(r.Context(), tokenRecord.UserID.String())
	if err != nil {
		http.Error(w, "user not found", http.StatusInternalServerError)
		return
	}

	// Revoke old token (Rotation)
	_ = h.authRepo.RevokeRefreshToken(r.Context(), tokenHash)

	// Issue new tokens
	jwtSecret := os.Getenv("JWT_SECRET")
	accessToken, newRefreshToken, err := auth.GenerateTokens(user.ID.String(), string(user.Role), jwtSecret, 15)
	if err != nil {
		http.Error(w, "failed to generate tokens", http.StatusInternalServerError)
		return
	}

	// Save new refresh token hash
	newTokenHash := auth.HashRefreshToken(newRefreshToken, pepper)
	newTokenRecord := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: newTokenHash,
		ExpiresAt: time.Now().AddDate(0, 0, 7),
	}
	if err := h.authRepo.SaveRefreshToken(r.Context(), newTokenRecord); err != nil {
		http.Error(w, "failed to save refresh token", http.StatusInternalServerError)
		return
	}

	// Set new cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    newRefreshToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("ENV") == "production",
		SameSite: http.SameSiteLaxMode,
		MaxAge:   7 * 24 * 60 * 60,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"access_token": accessToken,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err == nil {
		pepper := os.Getenv("REFRESH_TOKEN_PEPPER")
		tokenHash := auth.HashRefreshToken(cookie.Value, pepper)
		_ = h.authRepo.RevokeRefreshToken(r.Context(), tokenHash)

		// Clear cookie
		http.SetCookie(w, &http.Cookie{
			Name:     "refresh_token",
			Value:    "",
			Path:     "/",
			HttpOnly: true,
			Expires:  time.Unix(0, 0),
			MaxAge:   -1,
		})
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "logged out successfully"})
}
