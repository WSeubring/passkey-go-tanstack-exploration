# Passkey Go + TanStack Exploration

A full-stack demo application exploring **Passkey (WebAuthn) authentication** with a Go backend and a React/TanStack frontend. Features an interactive animated visualization of the passkey registration and login flows.

**Live demo:** https://passkey.wseubring.nl

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│    Frontend      │  REST   │    Backend       │
│  React/TanStack  │◄──────►│  Go + WebAuthn   │
│  (port 3000)     │         │  (port 8080)     │
│                  │         │                  │
│  Nginx (Docker)  │         │  SQLite          │
└─────────────────┘         └─────────────────┘
```

## Tech Stack

**Backend**
- Go with `net/http`
- [go-webauthn/webauthn](https://github.com/go-webauthn/webauthn) for WebAuthn/passkey support
- SQLite via `mattn/go-sqlite3`
- In-memory WebAuthn session store

**Frontend**
- React 19 with TanStack Start (SSR framework)
- TanStack Router (file-based routing)
- Tailwind CSS + shadcn/ui components
- Framer Motion for animations
- `@simplewebauthn/browser` for client-side WebAuthn
- Vite + TypeScript

**Infrastructure**
- Docker with multi-stage builds
- Docker Compose for orchestration
- Nginx for production frontend serving

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

For local development without Docker:
- [Go](https://go.dev/dl/) 1.24+
- [Bun](https://bun.sh/) (package manager and runtime)

### Run with Docker Compose

```bash
docker compose up --build
```

This starts both services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### Run Locally

**Backend:**
```bash
cd backend
go run .
```

The API server starts on port 8080.

**Frontend:**
```bash
cd frontend
bun install
bun dev
```

The dev server starts on port 3000.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register/begin?username=X` | Begin passkey registration |
| `POST` | `/api/auth/register/finish?username=X` | Complete passkey registration |
| `POST` | `/api/auth/login/begin` | Begin discoverable passkey login |
| `POST` | `/api/auth/login/finish` | Complete passkey login |
| `POST` | `/api/login` | Fallback password login |

## Project Structure

```
├── backend/
│   ├── main.go            # HTTP server, routes, CORS middleware
│   ├── handlers.go        # WebAuthn + password login handlers
│   ├── db.go              # SQLite database and user model
│   ├── session.go         # In-memory WebAuthn session store
│   ├── handlers_test.go   # Backend tests
│   ├── Dockerfile         # Multi-stage Go build
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── routes/        # TanStack file-based routes
│   │   ├── components/    # React components + shadcn/ui
│   │   ├── hooks/         # Passkey auth + utility hooks
│   │   └── lib/           # Utilities
│   ├── public/            # Static assets
│   ├── Dockerfile         # Multi-stage Node build -> Nginx
│   ├── nginx.conf         # SPA routing config
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml     # Service orchestration
└── README.md
```

## Running Tests

**Backend:**
```bash
cd backend
go test ./...
```

**Frontend:**
```bash
cd frontend
bun test
```
