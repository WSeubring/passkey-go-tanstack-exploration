package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

	"github.com/go-webauthn/webauthn/webauthn"
	_ "github.com/mattn/go-sqlite3"
)

// App holds all application dependencies.
type App struct {
	db           *sql.DB
	webAuthn     *webauthn.WebAuthn
	sessionStore *SessionStore
}

// NewApp creates a new App with the given database path and WebAuthn config.
func NewApp(dbPath string, config *webauthn.Config) (*App, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	if err := createTables(db); err != nil {
		return nil, fmt.Errorf("create tables: %w", err)
	}

	wa, err := webauthn.New(config)
	if err != nil {
		return nil, fmt.Errorf("init webauthn: %w", err)
	}

	return &App{
		db:           db,
		webAuthn:     wa,
		sessionStore: NewSessionStore(),
	}, nil
}

func createTables(db *sql.DB) error {
	createUsersTable := `CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE,
		display_name TEXT
	);`

	createCredentialsTable := `CREATE TABLE IF NOT EXISTS credentials (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		credential_json TEXT NOT NULL,
		FOREIGN KEY(user_id) REFERENCES users(id)
	);`

	if _, err := db.Exec(createUsersTable); err != nil {
		return err
	}
	if _, err := db.Exec(createCredentialsTable); err != nil {
		return err
	}
	return nil
}

// User represents the user model.
type User struct {
	ID          int
	Name        string
	DisplayName string
	Credentials []webauthn.Credential
}

// WebAuthn interface implementation.

func (u *User) WebAuthnID() []byte {
	return []byte(fmt.Sprintf("%d", u.ID))
}

func (u *User) WebAuthnName() string {
	return u.Name
}

func (u *User) WebAuthnDisplayName() string {
	return u.DisplayName
}

func (u *User) WebAuthnIcon() string {
	return ""
}

func (u *User) WebAuthnCredentials() []webauthn.Credential {
	return u.Credentials
}

// Database helpers — methods on App so they use the instance's db.

func (a *App) saveUser(username, displayName string) (*User, error) {
	res, err := a.db.Exec("INSERT INTO users (username, display_name) VALUES (?, ?)", username, displayName)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return &User{ID: int(id), Name: username, DisplayName: displayName}, nil
}

func (a *App) getUser(username string) (*User, error) {
	var u User
	err := a.db.QueryRow("SELECT id, username, display_name FROM users WHERE username = ?", username).Scan(&u.ID, &u.Name, &u.DisplayName)
	if err != nil {
		return nil, err
	}
	u.Credentials = a.getCredentialsForUser(u.ID)
	return &u, nil
}

func (a *App) getUserByID(id int) (*User, error) {
	var u User
	err := a.db.QueryRow("SELECT id, username, display_name FROM users WHERE id = ?", id).Scan(&u.ID, &u.Name, &u.DisplayName)
	if err != nil {
		return nil, err
	}
	u.Credentials = a.getCredentialsForUser(u.ID)
	return &u, nil
}

func (a *App) saveCredential(userID int, cred webauthn.Credential) error {
	credJSON, err := json.Marshal(cred)
	if err != nil {
		return fmt.Errorf("failed to marshal credential: %w", err)
	}
	_, err = a.db.Exec("INSERT INTO credentials (user_id, credential_json) VALUES (?, ?)", userID, string(credJSON))
	return err
}

func (a *App) getCredentialsForUser(userID int) []webauthn.Credential {
	rows, err := a.db.Query("SELECT credential_json FROM credentials WHERE user_id = ?", userID)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var creds []webauthn.Credential
	for rows.Next() {
		var credJSON string
		if err := rows.Scan(&credJSON); err != nil {
			continue
		}
		var c webauthn.Credential
		if err := json.Unmarshal([]byte(credJSON), &c); err != nil {
			log.Printf("failed to unmarshal credential: %v", err)
			continue
		}
		creds = append(creds, c)
	}
	return creds
}
