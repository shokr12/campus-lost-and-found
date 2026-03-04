package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"campusLostAndFound/internal/auth"
)

func TestRequireRole(t *testing.T) {
	// A mock handler we want to protect
	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	testCases := []struct {
		name           string
		userRole       string
		requiredRoles  []string
		expectedStatus int
	}{
		{
			name:           "User has required role",
			userRole:       "MODERATOR",
			requiredRoles:  []string{"MODERATOR"},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "User lacks required role",
			userRole:       "USER",
			requiredRoles:  []string{"MODERATOR"},
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "Admin always has access",
			userRole:       "ADMIN",
			requiredRoles:  []string{"MODERATOR"},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Multiple roles allowed",
			userRole:       "MODERATOR",
			requiredRoles:  []string{"MODERATOR", "ADMIN"},
			expectedStatus: http.StatusOK,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)

			// Inject mock claims into the context
			claims := &auth.AppClaims{Role: tc.userRole}
			ctx := context.WithValue(req.Context(), UserContextKey, claims)
			req = req.WithContext(ctx)

			rr := httptest.NewRecorder()

			// Init middleware
			middleware := RequireRole(tc.requiredRoles...)(nextHandler)

			middleware.ServeHTTP(rr, req)

			if status := rr.Code; status != tc.expectedStatus {
				t.Errorf("handler returned wrong status code: got %v want %v",
					status, tc.expectedStatus)
			}
		})
	}
}
