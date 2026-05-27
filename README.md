# GLP-1 

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

> [!NOTE]
> If using **pnpm v10+**, you may see a warning about blocked build scripts. Run `pnpm approve-builds` to whitelist `@nestjs/core`, `@prisma/client`, and other dependencies.

### 2. Start PostgreSQL

Choose **one** of the two database setups below:

#### Option A: Docker (Standard)
If Docker Desktop is running, start the container:
```bash
docker compose up -d
```

#### Option B: Local PostgreSQL Fallback (If Docker is not running)
If Docker is not available or your system port `5432` is occupied by another Postgres service, you can spin up a new local cluster on port `5433`:
1. Initialize a new cluster in the repository:
   ```bash
   initdb -D ./db-data -U postgres --auth=trust
   ```
2. Open `./db-data/postgresql.conf` and set:
   ```conf
   port = 5433
   ```
3. Start the instance:
   ```bash
   pg_ctl -D ./db-data -l ./db-data/logfile start
   ```

### 3. Configure environment

1. Copy the environment file:
   ```bash
   cp .env.example apps/api/.env
   ```
2. If using the **Docker** setup, keep the default values. If using the **Local Fallback** setup, update `DATABASE_URL` in `apps/api/.env` to:
   ```env
   DATABASE_URL="postgresql://postgres@127.0.0.1:5433/glp1db"
   ```

### 4. Run database migrations

Initialize the database schema:
```bash
cd apps/api
npx prisma db push
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
pnpm --filter @glp1/shared test
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
