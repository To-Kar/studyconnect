# Exercise 4 – Backend Quick Start (StudyConnect)
---

This guide shows how to start the backend and run the tests.

---

## 1) Prerequisites
- Node.js v18+ (check with: `node -v`)
- npm v9+ (check with: `npm -v`)
- Docker Desktop (to run Postgres with Docker Compose)

---

## 2) Start the Database (Docker Compose)
First, start the PostgreSQL database using Docker Compose:

```bash
# From repository root
# Start Postgres in the background
docker compose up -d postgres

# Check container status and health
docker compose ps

# Tail logs until you see "database system is ready to accept connections"
docker compose logs -f postgres
```

---

## 3) Install and Verify Setup
```bash
# From repository root
cd backend

# Install dependencies
npm install

# Run tests
npm run test
```

---

## 3a) Backend Environment Configuration
Create a backend environment file so the app can connect to the database:

```bash
# Create backend/.env with these values
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=studyconnect
```

Notes:
- When running the backend on your host (npm run dev), use `DB_HOST=localhost` (the compose file publishes port 5432).
- If you later run the backend in Docker as a service, use `DB_HOST=postgres` (the Docker service name).
- Data is persisted in the `postgres_data` volume. To reset the DB completely:

```bash
docker compose down -v
docker compose up -d postgres
```

---

## 4) Start the Backend 
```bash
# Development mode (TypeScript + watch, port 3001)
npm run dev

# Or build and start production
npm run build

npm start
```

---

## 5) Run Unit Tests (Exercise 4.3)
Exercise 4 requires unit tests for core domain models. Use these commands:
```bash
# Run all tests
npm test

# Run with verbose output
npm run test:verbose

# Run in watch mode 
npm run test:watch

# Run a single suite
npm test -- src/__tests__/group.test.ts
```

---

## 6) Commands Cheat Sheet
```bash
# Install
cd backend && npm install

# Run all tests
npm test

# Start dev server 
npm run dev
```

---