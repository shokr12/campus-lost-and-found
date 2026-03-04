package handlers

import (
	"encoding/json"
	"net/http"

	"campusLostAndFound/internal/auth"
	"campusLostAndFound/internal/middleware"
	"campusLostAndFound/internal/repos"
)

type UserHandler struct {
	userRepo *repos.UserRepo
}

func NewUserHandler(userRepo *repos.UserRepo) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

// Get Profile (Me)
func (h *UserHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*auth.AppClaims)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := h.userRepo.GetByID(r.Context(), claims.UserID)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
