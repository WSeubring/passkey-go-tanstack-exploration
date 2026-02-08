package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
)

func jsonResponse(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// discoverUser is called by the webauthn library during FinishDiscoverableLogin.
// The userHandle is the WebAuthnID we returned — fmt.Sprintf("%d", user.ID).
func (a *App) discoverUser(rawID, userHandle []byte) (webauthn.User, error) {
	idStr := string(userHandle)
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return nil, fmt.Errorf("invalid user handle: %s", idStr)
	}
	user, err := a.getUserByID(id)
	if err != nil {
		return nil, fmt.Errorf("user not found for handle: %s", idStr)
	}
	return user, nil
}

func (a *App) registerBegin(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	if username == "" {
		jsonError(w, "Username required", http.StatusBadRequest)
		return
	}

	user, err := a.getUser(username)
	if err != nil {
		user, err = a.saveUser(username, username)
		if err != nil {
			jsonError(w, "Failed to create user", http.StatusInternalServerError)
			return
		}
	}

	options, session, err := a.webAuthn.BeginRegistration(user,
		webauthn.WithResidentKeyRequirement(protocol.ResidentKeyRequirementRequired),
	)
	if err != nil {
		log.Printf("BeginRegistration error: %v", err)
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	a.sessionStore.Set(username, session)
	jsonResponse(w, options)
}

func (a *App) registerFinish(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	session, ok := a.sessionStore.Get(username)
	if !ok {
		jsonError(w, "Session not found", http.StatusBadRequest)
		return
	}

	user, err := a.getUser(username)
	if err != nil {
		jsonError(w, "User not found", http.StatusBadRequest)
		return
	}

	credential, err := a.webAuthn.FinishRegistration(user, *session, r)
	if err != nil {
		log.Printf("FinishRegistration error: %v", err)
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = a.saveCredential(user.ID, *credential)
	if err != nil {
		log.Printf("saveCredential error: %v", err)
		jsonError(w, "Failed to save credential", http.StatusInternalServerError)
		return
	}

	a.sessionStore.Delete(username)
	jsonResponse(w, map[string]string{"status": "ok"})
}

func (a *App) loginBegin(w http.ResponseWriter, r *http.Request) {
	options, session, err := a.webAuthn.BeginDiscoverableLogin(
		webauthn.WithUserVerification(protocol.VerificationRequired),
	)
	if err != nil {
		log.Printf("BeginDiscoverableLogin error: %v", err)
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	a.sessionStore.Set("login_session", session)
	jsonResponse(w, options)
}

func (a *App) loginFinish(w http.ResponseWriter, r *http.Request) {
	session, ok := a.sessionStore.Get("login_session")
	if !ok {
		jsonError(w, "Session not found", http.StatusBadRequest)
		return
	}

	credential, err := a.webAuthn.FinishDiscoverableLogin(a.discoverUser, *session, r)
	if err != nil {
		log.Printf("FinishDiscoverableLogin error: %v", err)
		jsonError(w, "Verification failed: "+err.Error(), http.StatusUnauthorized)
		return
	}

	_ = credential

	a.sessionStore.Delete("login_session")

	jsonResponse(w, map[string]string{
		"status":  "ok",
		"message": "Passkey login successful!",
		"token":   "mock-jwt-token",
	})
}

func (a *App) passwordLoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		jsonError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// TODO: Replace with real password verification (bcrypt, argon2, etc.)
	if req.Password == "password" {
		jsonResponse(w, map[string]string{
			"token":   "mock-jwt-token-12345",
			"message": "Login successful",
		})
	} else {
		jsonError(w, "Invalid credentials", http.StatusUnauthorized)
	}
}
