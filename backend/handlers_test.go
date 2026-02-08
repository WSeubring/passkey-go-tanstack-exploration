package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-webauthn/webauthn/webauthn"
)

// newTestApp creates an App backed by an in-memory SQLite database.
func newTestApp(t *testing.T) *App {
	t.Helper()
	app, err := NewApp(":memory:", &webauthn.Config{
		RPDisplayName: "Passkey Demo",
		RPID:          "localhost",
		RPOrigins:     []string{"http://localhost:3000"},
	})
	if err != nil {
		t.Fatalf("newTestApp: %v", err)
	}
	return app
}

func TestRegisterBeginReturnsChallenge(t *testing.T) {
	app := newTestApp(t)

	req := httptest.NewRequest("POST", "/api/auth/register/begin?username=alice", nil)
	w := httptest.NewRecorder()

	app.registerBegin(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	ct := resp.Header.Get("Content-Type")
	if !strings.Contains(ct, "application/json") {
		t.Fatalf("expected application/json, got %s", ct)
	}

	var body map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	pk, ok := body["publicKey"].(map[string]any)
	if !ok {
		t.Fatal("response missing publicKey field")
	}

	if _, ok := pk["challenge"]; !ok {
		t.Fatal("publicKey missing challenge field")
	}

	if rpID, ok := pk["rp"].(map[string]any); ok {
		if rpID["id"] != "localhost" {
			t.Fatalf("expected rpId 'localhost', got %v", rpID["id"])
		}
	} else {
		t.Fatal("publicKey missing rp field")
	}
}

func TestRegisterBeginRequiresUsername(t *testing.T) {
	app := newTestApp(t)

	req := httptest.NewRequest("POST", "/api/auth/register/begin", nil)
	w := httptest.NewRecorder()

	app.registerBegin(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}

	var body map[string]string
	json.NewDecoder(resp.Body).Decode(&body)
	if body["error"] != "Username required" {
		t.Fatalf("expected 'Username required', got %q", body["error"])
	}
}

func TestRegisterBeginCreatesUser(t *testing.T) {
	app := newTestApp(t)

	req := httptest.NewRequest("POST", "/api/auth/register/begin?username=bob", nil)
	w := httptest.NewRecorder()

	app.registerBegin(w, req)

	if w.Result().StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Result().StatusCode)
	}

	// Verify user was created in DB
	user, err := app.getUser("bob")
	if err != nil {
		t.Fatalf("expected user 'bob' to exist in DB: %v", err)
	}
	if user.Name != "bob" {
		t.Fatalf("expected username 'bob', got %q", user.Name)
	}
}

func TestLoginBeginReturnsChallenge(t *testing.T) {
	app := newTestApp(t)

	req := httptest.NewRequest("POST", "/api/auth/login/begin", nil)
	w := httptest.NewRecorder()

	app.loginBegin(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var body map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	pk, ok := body["publicKey"].(map[string]any)
	if !ok {
		t.Fatal("response missing publicKey field")
	}

	if _, ok := pk["challenge"]; !ok {
		t.Fatal("publicKey missing challenge field")
	}

	if uv, ok := pk["userVerification"]; ok {
		if uv != "required" {
			t.Fatalf("expected userVerification 'required', got %v", uv)
		}
	}
}

func TestLoginFinishWithoutSessionReturnsError(t *testing.T) {
	app := newTestApp(t)

	// Call loginFinish without a preceding loginBegin (no session stored)
	body := `{"id":"test","rawId":"test","type":"public-key","response":{}}`
	req := httptest.NewRequest("POST", "/api/auth/login/finish", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	app.loginFinish(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	if result["error"] != "Session not found" {
		t.Fatalf("expected 'Session not found', got %q", result["error"])
	}
}

func TestRegisterFinishWithoutSessionReturnsError(t *testing.T) {
	app := newTestApp(t)

	body := `{"id":"test","rawId":"test","type":"public-key","response":{}}`
	req := httptest.NewRequest("POST", "/api/auth/register/finish?username=ghost", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	app.registerFinish(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	if result["error"] != "Session not found" {
		t.Fatalf("expected 'Session not found', got %q", result["error"])
	}
}

func TestPasswordLoginSuccess(t *testing.T) {
	app := newTestApp(t)

	body := `{"email":"test@example.com","password":"password"}`
	req := httptest.NewRequest("POST", "/api/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	app.passwordLoginHandler(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	if result["message"] != "Login successful" {
		t.Fatalf("expected 'Login successful', got %q", result["message"])
	}
	if result["token"] == "" {
		t.Fatal("expected token in response")
	}
}

func TestPasswordLoginInvalidCredentials(t *testing.T) {
	app := newTestApp(t)

	body := `{"email":"test@example.com","password":"wrong"}`
	req := httptest.NewRequest("POST", "/api/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	app.passwordLoginHandler(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	if result["error"] != "Invalid credentials" {
		t.Fatalf("expected 'Invalid credentials', got %q", result["error"])
	}
}

func TestPasswordLoginMethodNotAllowed(t *testing.T) {
	app := newTestApp(t)

	req := httptest.NewRequest("GET", "/api/login", nil)
	w := httptest.NewRecorder()

	app.passwordLoginHandler(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", resp.StatusCode)
	}
}

func TestCORSMiddleware(t *testing.T) {
	handler := corsMiddleware("http://localhost:3000", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Test preflight OPTIONS request
	req := httptest.NewRequest("OPTIONS", "/api/test", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 for OPTIONS, got %d", resp.StatusCode)
	}

	origin := resp.Header.Get("Access-Control-Allow-Origin")
	if origin != "http://localhost:3000" {
		t.Fatalf("expected origin 'http://localhost:3000', got %q", origin)
	}

	methods := resp.Header.Get("Access-Control-Allow-Methods")
	if !strings.Contains(methods, "POST") {
		t.Fatalf("expected CORS methods to include POST, got %q", methods)
	}

	// Test regular request also gets CORS headers
	req2 := httptest.NewRequest("GET", "/api/test", nil)
	w2 := httptest.NewRecorder()
	handler.ServeHTTP(w2, req2)

	origin2 := w2.Result().Header.Get("Access-Control-Allow-Origin")
	if origin2 != "http://localhost:3000" {
		t.Fatalf("expected CORS origin on GET, got %q", origin2)
	}
}

// Database helper tests

func TestSaveAndGetUser(t *testing.T) {
	app := newTestApp(t)

	user, err := app.saveUser("testuser", "Test User")
	if err != nil {
		t.Fatalf("saveUser failed: %v", err)
	}
	if user.ID == 0 {
		t.Fatal("expected non-zero user ID")
	}
	if user.Name != "testuser" {
		t.Fatalf("expected name 'testuser', got %q", user.Name)
	}

	fetched, err := app.getUser("testuser")
	if err != nil {
		t.Fatalf("getUser failed: %v", err)
	}
	if fetched.ID != user.ID {
		t.Fatalf("expected ID %d, got %d", user.ID, fetched.ID)
	}
}

func TestGetUserByID(t *testing.T) {
	app := newTestApp(t)

	user, err := app.saveUser("idtest", "ID Test")
	if err != nil {
		t.Fatalf("saveUser failed: %v", err)
	}

	fetched, err := app.getUserByID(user.ID)
	if err != nil {
		t.Fatalf("getUserByID failed: %v", err)
	}
	if fetched.Name != "idtest" {
		t.Fatalf("expected 'idtest', got %q", fetched.Name)
	}
}

func TestGetUserNotFound(t *testing.T) {
	app := newTestApp(t)

	_, err := app.getUser("nonexistent")
	if err == nil {
		t.Fatal("expected error for non-existent user")
	}
}

func TestDuplicateUserFails(t *testing.T) {
	app := newTestApp(t)

	_, err := app.saveUser("dupe", "Dupe")
	if err != nil {
		t.Fatalf("first saveUser failed: %v", err)
	}

	_, err = app.saveUser("dupe", "Dupe 2")
	if err == nil {
		t.Fatal("expected error for duplicate username")
	}
}
