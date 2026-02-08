package main

import (
	"sync"

	"github.com/go-webauthn/webauthn/webauthn"
)

// SessionStore is a thread-safe in-memory store for WebAuthn session data.
type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*webauthn.SessionData
}

// NewSessionStore creates a new empty SessionStore.
func NewSessionStore() *SessionStore {
	return &SessionStore{
		sessions: make(map[string]*webauthn.SessionData),
	}
}

// Get retrieves session data for the given key. Returns nil, false if not found.
func (s *SessionStore) Get(key string) (*webauthn.SessionData, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	session, ok := s.sessions[key]
	return session, ok
}

// Set stores session data under the given key.
func (s *SessionStore) Set(key string, session *webauthn.SessionData) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[key] = session
}

// Delete removes session data for the given key.
func (s *SessionStore) Delete(key string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, key)
}
