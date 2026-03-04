package api

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"campusLostAndFound/internal/handlers"
	"campusLostAndFound/internal/middleware"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r *chi.Mux, authHandler *handlers.AuthHandler, userHandler *handlers.UserHandler, postHandler *handlers.PostHandler, claimHandler *handlers.ClaimHandler, reportHandler *handlers.ReportHandler) {
	// Public routes
	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)
		r.Post("/refresh", authHandler.Refresh)
		r.Post("/logout", authHandler.Logout)
	})

	// Protected routes
	r.Route("/api", func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)

		// Users
		r.Get("/me", userHandler.Me)
		r.Get("/me/claims", claimHandler.ListByUser)

		// Posts (auth required)
		r.Post("/posts", postHandler.Create)
		r.Get("/posts/{id}", postHandler.Get)
		r.Get("/posts", postHandler.List)
		r.Delete("/posts/{id}", postHandler.Delete)
		r.Patch("/posts/{id}/status", postHandler.UpdateStatus)

		// Claims (auth required)
		r.Post("/posts/{id}/claims", claimHandler.Create)
		r.Get("/posts/{id}/claims", claimHandler.ListForPost)
		r.Patch("/claims/{id}", claimHandler.UpdateStatus)

		// Reports (auth required)
		r.Post("/posts/{id}/report", reportHandler.Create)

		// Administrative Routes
		r.Route("/admin", func(r chi.Router) {
			r.Use(middleware.RequireRole("ADMIN", "MODERATOR"))
			r.Get("/reports", reportHandler.List)
			r.Get("/claims", claimHandler.ListAll)

			// Admin only actions
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("ADMIN"))
				r.Post("/cleanup-expired", reportHandler.CleanupExpiredPosts)
				r.Get("/users", func(w http.ResponseWriter, r *http.Request) {
					// Placeholder
				})
			})
		})
	})

	// Static files (uploads)
	workDir, _ := os.Getwd()
	filesDir := http.Dir(filepath.Join(workDir, "uploads"))
	FileServer(r, "/uploads", filesDir)
}

// FileServer conveniently sets up a http.FileServer handler to serve
// static files from a http.FileSystem.
func FileServer(r chi.Router, path string, root http.FileSystem) {
	if strings.ContainsAny(path, "{}*") {
		panic("FileServer does not permit any URL parameters.")
	}

	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", http.StatusMovedPermanently).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		rctx := chi.RouteContext(r.Context())
		pathPrefix := strings.TrimSuffix(rctx.RoutePattern(), "/*")
		fs := http.StripPrefix(pathPrefix, http.FileServer(root))
		fs.ServeHTTP(w, r)
	})
}
