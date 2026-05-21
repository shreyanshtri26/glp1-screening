# GLP-1 Eligibility Screening — PhoenixLabs Assignment

A full-stack 15-screen conditional eligibility form for GLP-1 weight-loss medication, built as a pnpm monorepo.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 3, Zustand 5 |
| Backend | NestJS 11, Prisma 6, PostgreSQL 15 |
| Shared Logic | Pure TypeScript package (`@glp1/shared`) |
| Testing | Vitest 2, Playwright 1, @testing-library/react |
| CI | GitHub Actions |
| Infra | Docker Compose |

## Project Structure

```
glp1-screening/
├── apps/
│   ├── api/           # NestJS 11 backend
│   └── web/           # Next.js 15 frontend
├── packages/
│   └── shared/        # Pure logic + form schema
├── docker-compose.yml
├── .github/workflows/ci.yml
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

## Local Development Setup

### 1. Clone & Install

```bash
git clone <repo>
cd glp1-screening
pnpm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp .env.example apps/api/.env
# Default values work with docker-compose
```

### 4. Run database migrations

```bash
cd apps/api
npx prisma migrate dev --name init
cd ../..
```

### 5. Build shared package

```bash
pnpm --filter @glp1/shared build
```

### 6. Start API + Web (separate terminals)

```bash
# Terminal 1 — API on :3001
pnpm --filter @glp1/api start:dev

# Terminal 2 — Web on :3000
pnpm --filter @glp1/web dev
```

Open http://localhost:3000

## Running Tests

### Unit tests (all packages)

```bash
pnpm --filter @glp1/shared test:unit
pnpm --filter @glp1/api test:unit
pnpm --filter @glp1/web test:unit
```

### E2E tests (requires running app)

```bash
pnpm --filter @glp1/web test:e2e
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/session/start` | Start a new screening session |
| `POST` | `/api/session/answer` | Submit an answer and get next step |
| `GET` | `/api/session/:id` | Resume an existing session |

### POST /api/session/start

```json
// Response
{
  "sessionId": "clxyz...",
  "step": { "id": 1, "key": "age", "prompt": "What is your age?", "type": "number", ... }
}
```

### POST /api/session/answer

```json
// Request
{ "sessionId": "clxyz...", "step": 1, "value": 45 }

// Response — next question
{ "next": { "id": 2, "key": "weight", ... } }

// Response — final result
{ "next": { "outcome": "eligible", "reason": "All criteria met" } }
```

### GET /api/session/:id

```json
// Response
{
  "session": { "id": "clxyz...", "currentStep": 5, "status": "in_progress", "result": null },
  "answers": [{ "step": 1, "value": 45 }, ...],
  "currentStep": 5
}
```

## Architecture Decisions

See [WRITEUP.md](./WRITEUP.md) for detailed trade-offs and ambiguity resolutions.
