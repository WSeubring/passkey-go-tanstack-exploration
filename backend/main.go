package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-webauthn/webauthn/webauthn"
)

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// corsMiddleware wraps a handler and applies CORS headers to every response,
// including preflight OPTIONS requests.
func corsMiddleware(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	port := envOr("PORT", "8080")
	rpID := envOr("RP_ID", "localhost")
	rpDisplayName := envOr("RP_DISPLAY_NAME", "Passkey Demo")
	rpOrigin := envOr("RP_ORIGIN", "http://localhost:3000")
	dbPath := envOr("DB_PATH", "./auth.db")

	app, err := NewApp(dbPath, &webauthn.Config{
		RPDisplayName: rpDisplayName,
		RPID:          rpID,
		RPOrigins:     []string{rpOrigin},
	})
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("/api/login", app.passwordLoginHandler)
	mux.HandleFunc("/api/auth/register/begin", app.registerBegin)
	mux.HandleFunc("/api/auth/register/finish", app.registerFinish)
	mux.HandleFunc("/api/auth/login/begin", app.loginBegin)
	mux.HandleFunc("/api/auth/login/finish", app.loginFinish)

	fmt.Printf("Server starting on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, corsMiddleware(rpOrigin, mux)); err != nil {
		log.Fatal(err)
	}
}
