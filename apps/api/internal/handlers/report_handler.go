package handlers

import (
	"encoding/json"
	"net/http"

	"campusLostAndFound/internal/auth"
	"campusLostAndFound/internal/middleware"
	"campusLostAndFound/internal/models"
	"campusLostAndFound/internal/repos"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ReportHandler struct {
	reportRepo *repos.ReportRepo
}

func NewReportHandler(reportRepo *repos.ReportRepo) *ReportHandler {
	return &ReportHandler{reportRepo: reportRepo}
}

// Create a new report (Requires Auth)
func (h *ReportHandler) Create(w http.ResponseWriter, r *http.Request) {
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

	var input models.CreateReportInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Reason == "" {
		http.Error(w, "reason is required", http.StatusBadRequest)
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		http.Error(w, "invalid user id in token", http.StatusInternalServerError)
		return
	}

	report := &models.Report{
		PostID:         postID,
		ReporterUserID: userID,
		Reason:         input.Reason,
		Details:        input.Details,
	}

	if err := h.reportRepo.Create(r.Context(), report); err != nil {
		http.Error(w, "failed to create report", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "post reported successfully"})
}

// List all reports (Requires Admin/Mod)
func (h *ReportHandler) List(w http.ResponseWriter, r *http.Request) {
	reports, err := h.reportRepo.List(r.Context())
	if err != nil {
		http.Error(w, "failed to fetch reports", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if reports == nil {
		json.NewEncoder(w).Encode([]*models.Report{})
		return
	}
	json.NewEncoder(w).Encode(reports)
}

// Cleanup expired posts (Requires Admin)
func (h *ReportHandler) CleanupExpiredPosts(w http.ResponseWriter, r *http.Request) {
	count, err := h.reportRepo.CleanupExpiredPosts(r.Context())
	if err != nil {
		http.Error(w, "failed to clean up expired posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":        "cleanup successful",
		"posts_affected": count,
	})
}
