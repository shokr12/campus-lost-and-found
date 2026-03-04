package handlers

import (
	"encoding/json"
	"net/http"
	"os"

	"campusLostAndFound/internal/auth"
	"campusLostAndFound/internal/middleware"
	"campusLostAndFound/internal/models"
	"campusLostAndFound/internal/repos"
	"campusLostAndFound/pkg/encryption"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ClaimHandler struct {
	claimRepo *repos.ClaimRepo
	postRepo  *repos.PostRepo
}

func NewClaimHandler(claimRepo *repos.ClaimRepo, postRepo *repos.PostRepo) *ClaimHandler {
	return &ClaimHandler{
		claimRepo: claimRepo,
		postRepo:  postRepo,
	}
}

// Create a new claim
func (h *ClaimHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*auth.AppClaims)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	postIDStr := chi.URLParam(r, "id")
	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		http.Error(w, "invalid post id", http.StatusBadRequest)
		return
	}

	var input models.CreateClaimInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Message == "" {
		http.Error(w, "missing required fields", http.StatusBadRequest)
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		http.Error(w, "invalid user id in token", http.StatusInternalServerError)
		return
	}

	claim := &models.Claim{
		PostID:         postID,
		ClaimantUserID: userID,
		Message:        input.Message,
		Status:         models.ClaimPending,
	}

	// Encrypt verification info if provided
	if input.VerificationDetail != nil && *input.VerificationDetail != "" {
		key := os.Getenv("ENCRYPTION_KEY")
		encrypted, err := encryption.Encrypt(*input.VerificationDetail, key)
		if err != nil {
			http.Error(w, "failed to encrypt verification details", http.StatusInternalServerError)
			return
		}
		claim.VerificationEncrypted = &encrypted
	}

	if err := h.claimRepo.Create(r.Context(), claim); err != nil {
		http.Error(w, "failed to create claim", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(claim)
}

// List claims for a post (for post owner)
func (h *ClaimHandler) ListForPost(w http.ResponseWriter, r *http.Request) {
	userClaims, ok := r.Context().Value(middleware.UserContextKey).(*auth.AppClaims)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	postIDStr := chi.URLParam(r, "id")

	// Check if user is owner of the post (or admin/mod)
	post, err := h.postRepo.GetByID(r.Context(), postIDStr)
	if err != nil {
		http.Error(w, "post not found", http.StatusNotFound)
		return
	}

	if post.UserID.String() != userClaims.UserID && userClaims.Role == "USER" {
		http.Error(w, "forbidden: only post owner can view claims", http.StatusForbidden)
		return
	}

	claimsList, err := h.claimRepo.GetByPostID(r.Context(), postIDStr)
	if err != nil {
		http.Error(w, "failed to fetch claims", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if claimsList == nil {
		json.NewEncoder(w).Encode([]*models.Claim{})
		return
	}
	json.NewEncoder(w).Encode(claimsList)
}

// Update Claim Status (Accept/Reject)
func (h *ClaimHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	userClaims, ok := r.Context().Value(middleware.UserContextKey).(*auth.AppClaims)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	claimIDStr := chi.URLParam(r, "id")

	var input models.UpdateClaimStatusInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Verify permissions
	claim, err := h.claimRepo.GetByID(r.Context(), claimIDStr)
	if err != nil {
		http.Error(w, "claim not found", http.StatusNotFound)
		return
	}

	post, err := h.postRepo.GetByID(r.Context(), claim.PostID.String())
	if err != nil {
		http.Error(w, "associated post not found", http.StatusInternalServerError)
		return
	}

	if post.UserID.String() != userClaims.UserID && userClaims.Role == "USER" {
		http.Error(w, "forbidden: only post owner can update claim status", http.StatusForbidden)
		return
	}

	// Update the claim status
	if err := h.claimRepo.UpdateStatus(r.Context(), claimIDStr, input.Status); err != nil {
		http.Error(w, "failed to update claim status", http.StatusInternalServerError)
		return
	}

	// If accepting, mark post as resolved
	if input.Status == models.ClaimAccepted {
		if err := h.claimRepo.MarkPostResolved(r.Context(), post.ID.String()); err != nil {
			http.Error(w, "failed to resolve post after accepting claim", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "claim status updated successfully"})
}

// ListByUser retrieves all claims submitted by the CURRENT user
func (h *ClaimHandler) ListByUser(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*auth.AppClaims)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	claimsList, err := h.claimRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil {
		http.Error(w, "failed to fetch your claims", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if claimsList == nil {
		json.NewEncoder(w).Encode([]*models.Claim{})
		return
	}
	json.NewEncoder(w).Encode(claimsList)
}

// ListAll retrieves ALL claims in the system (Admin/Mod only)
func (h *ClaimHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	claimsList, err := h.claimRepo.ListAll(r.Context())
	if err != nil {
		http.Error(w, "failed to fetch all claims", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if claimsList == nil {
		json.NewEncoder(w).Encode([]*models.Claim{})
		return
	}
	json.NewEncoder(w).Encode(claimsList)
}
