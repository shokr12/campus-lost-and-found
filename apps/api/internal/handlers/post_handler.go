package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"campusLostAndFound/internal/auth"
	"campusLostAndFound/internal/middleware"
	"campusLostAndFound/internal/models"
	"campusLostAndFound/internal/repos"
	"campusLostAndFound/pkg/encryption"
	"campusLostAndFound/pkg/storage"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type PostHandler struct {
	postRepo *repos.PostRepo
	store    storage.StorageAdapter
}

func NewPostHandler(postRepo *repos.PostRepo, store storage.StorageAdapter) *PostHandler {
	return &PostHandler{
		postRepo: postRepo,
		store:    store,
	}
}

func (h *PostHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*auth.AppClaims)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		http.Error(w, "invalid user id in token", http.StatusInternalServerError)
		return
	}

	// Determine if it's multipart or JSON
	var post *models.Post
	if r.Header.Get("Content-Type") == "application/json" {
		var input models.CreatePostInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		dateLostOrFound, _ := time.Parse("2006-01-02", input.DateLostOrFound)
		post = &models.Post{
			UserID:          userID,
			Status:          input.Status,
			Title:           input.Title,
			Description:     input.Description,
			Category:        input.Category,
			Location:        input.Location,
			DateLostOrFound: dateLostOrFound,
			IsResolved:      false,
			ExpiresAt:       time.Now().AddDate(0, 0, 14),
		}

		if input.ContactInfo != nil && *input.ContactInfo != "" {
			key := os.Getenv("ENCRYPTION_KEY")
			encrypted, _ := encryption.Encrypt(*input.ContactInfo, key)
			post.ContactEncrypted = &encrypted
		}
	} else {
		// Assume multipart/form-data
		// Max 10MB
		r.ParseMultipartForm(10 << 20)

		dateLostOrFound, _ := time.Parse("2006-01-02", r.FormValue("date_lost_or_found"))
		post = &models.Post{
			UserID:          userID,
			Status:          models.PostStatus(r.FormValue("status")),
			Title:           r.FormValue("title"),
			Description:     r.FormValue("description"),
			Category:        r.FormValue("category"),
			Location:        r.FormValue("location"),
			DateLostOrFound: dateLostOrFound,
			IsResolved:      false,
			ExpiresAt:       time.Now().AddDate(0, 0, 14),
		}

		contactInfo := r.FormValue("contact_info")
		if contactInfo != "" {
			key := os.Getenv("ENCRYPTION_KEY")
			encrypted, _ := encryption.Encrypt(contactInfo, key)
			post.ContactEncrypted = &encrypted
		}

		// Handle photo upload
		file, header, err := r.FormFile("photo")
		if err == nil {
			defer file.Close()
			photoURL, err := h.store.UploadFile(r.Context(), file, header.Filename)
			if err != nil {
				log.Printf("[PostHandler] Failed to upload file: %v\n", err)
			} else {
				post.PhotoURL = &photoURL
				log.Printf("[PostHandler] File uploaded successfully: %s\n", photoURL)
			}
		} else if err != http.ErrMissingFile {
			log.Printf("[PostHandler] Error retrieving form file: %v\n", err)
		}
	}

	if post.Title == "" || post.Description == "" || post.Category == "" {
		log.Printf("[PostHandler] Missing required fields: Title='%s', Desc='%s', Cat='%s'\n", post.Title, post.Description, post.Category)
		http.Error(w, "missing required fields", http.StatusBadRequest)
		return
	}

	if err := h.postRepo.Create(r.Context(), post); err != nil {
		log.Printf("[PostHandler] Repository Create failed: %v\n", err)
		http.Error(w, "failed to create post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

func (h *PostHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := repos.PostFilter{
		Status:         r.URL.Query().Get("status"),
		Category:       r.URL.Query().Get("category"),
		Query:          r.URL.Query().Get("q"),
		IncludeExpired: r.URL.Query().Get("includeExpired") == "true",
	}

	if r.URL.Query().Get("my") == "true" {
		claims, ok := r.Context().Value(middleware.UserContextKey).(*auth.AppClaims)
		if ok {
			filter.UserID = claims.UserID
		}
	}

	posts, err := h.postRepo.List(r.Context(), filter)
	if err != nil {
		http.Error(w, "failed to fetch posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if posts == nil {
		json.NewEncoder(w).Encode([]*models.Post{}) // Return empty array instead of null
		return
	}
	json.NewEncoder(w).Encode(posts)
}

func (h *PostHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "missing id parameter", http.StatusBadRequest)
		return
	}

	post, err := h.postRepo.GetByID(r.Context(), id)
	if err != nil {
		http.Error(w, "post not found", http.StatusNotFound)
		return
	}

	// NOTE: We only decrypt contact info for the owner or admin/mod.
	// For now, we will just return the post without contact info mapped,
	// unless we check the user. Let's do a basic auth check if possible, or just skip it
	// and let the client ask for claims.
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}
func (h *PostHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "missing id parameter", http.StatusBadRequest)
		return
	}

	claims, ok := r.Context().Value(middleware.UserContextKey).(*auth.AppClaims)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Check ownership or admin/mod role
	post, err := h.postRepo.GetByID(r.Context(), id)
	if err != nil {
		http.Error(w, "post not found", http.StatusNotFound)
		return
	}

	if post.UserID.String() != claims.UserID && claims.Role != "ADMIN" && claims.Role != "MODERATOR" {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	if err := h.postRepo.Delete(r.Context(), id); err != nil {
		http.Error(w, "failed to delete post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *PostHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "missing id parameter", http.StatusBadRequest)
		return
	}

	var input struct {
		IsResolved bool `json:"isResolved"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	claims, ok := r.Context().Value(middleware.UserContextKey).(*auth.AppClaims)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Check ownership or admin/mod role
	post, err := h.postRepo.GetByID(r.Context(), id)
	if err != nil {
		http.Error(w, "post not found", http.StatusNotFound)
		return
	}

	if post.UserID.String() != claims.UserID && claims.Role != "ADMIN" && claims.Role != "MODERATOR" {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	if err := h.postRepo.UpdateStatus(r.Context(), id, input.IsResolved); err != nil {
		http.Error(w, "failed to update post status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
