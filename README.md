# Shift Maestro

Shift Maestro is a personnel duty scheduling application for generating and finalizing fair daily duty schedules.

The scheduler uses persisted assignment history to distribute workload across personnel, prioritizing rested employees for harder duties while reducing repeated heavy workload over consecutive days.

## V1 Features

### Personnel

- Add, edit, save, and remove personnel
- Company, ESSO, entry date, I-class, armed status, and notes
- Personnel filtering and grouping
- Assignment history per employee
- Workload and fatigue information

### Scheduling

- Configurable jobs and shift groups
- Job difficulty
- Shift difficulty
- Required personnel per job
- Historical fatigue-aware ranking
- Recent workload balancing
- Job repetition consideration
- Manual pinned assignments
- Drag-and-drop assignment swaps
- Duplicate-person conflict protection
- CSV schedule export

### Finalization and History

- Finalized schedules are persisted to SQLite
- A date cannot be finalized twice
- Assignment history affects future schedules
- Pinned assignments are preserved in history
- Historical jobs and shifts remain available even when removed from the active configuration

### Configuration

- Jobs and shifts are stored in the database
- Jobs and shifts can be added, edited, and removed from the active catalogue
- Removed catalogue entries are deactivated instead of physically deleted
- Historical assignments therefore remain intact

### Docker Deployment

- React/Vite frontend
- nginx web server and reverse proxy
- Express API backend
- Prisma ORM
- SQLite database
- Persistent Docker database volume
- Prisma migrations applied automatically when the backend starts

---

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Zustand
- shadcn/ui
- Tailwind CSS
- React Router
- Recharts

### Backend

- Node.js
- Express
- Prisma
- SQLite
- Zod

### Testing and Deployment

- Vitest
- TypeScript compiler
- Docker
- Docker Compose
- nginx

---

# Local Development

## Requirements

Install:

- Node.js 20+
- npm

## Environment

Copy the example environment file:

```bash
cp .env.example .env
```

The default local development configuration is:

```env
DATABASE_URL="file:./dev.db"
VITE_API_URL=http://localhost:3000/api
```

The real `.env` file is ignored by Git.

---

## Install Dependencies

Install root/frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
cd ..
```

Generate the Prisma client:

```bash
npx prisma generate
```

Apply development migrations:

```bash
npx prisma migrate dev
```

---

## Start the Backend

Open one terminal:

```bash
cd backend
npm run dev
```

The API runs on:

```text
http://localhost:3000
```

---

## Start the Frontend

Open another terminal from the project root:

```bash
npm run dev
```

Open the URL printed by Vite.

---

# Tests

Run the TypeScript check:

```bash
npx tsc -p tsconfig.app.json --noEmit
```

Run the automated test suite:

```bash
npm test
```

Create a production frontend build:

```bash
npm run build
```

The V1 scheduling tests cover areas including:

- workload calculation
- fatigue
- assignment history
- ranking
- scheduler behavior
- finalization
- pinned assignments

---

# Docker

Shift Maestro can run as a Docker Compose stack.

The frontend is served through nginx, which also proxies `/api` requests to the Express backend.

## Build

```bash
docker compose build
```

## Start

```bash
docker compose up -d
```

Open:

```text
http://localhost:8080
```

## Check Container Status

```bash
docker compose ps
```

## Backend Logs

```bash
docker compose logs backend
```

## Frontend Logs

```bash
docker compose logs frontend
```

## Stop

```bash
docker compose down
```

Do not use:

```bash
docker compose down -v
```

unless you intentionally want to delete the persistent Docker database volume.

---

# Docker Database

The Docker deployment stores SQLite data in a persistent named volume.

The current volume is:

```text
shift-maestro_shift_maestro_data
```

Inside the backend container the database is stored at:

```text
/data/shift-maestro.db
```

The Docker backend uses:

```env
DATABASE_URL=file:/data/shift-maestro.db
```

Prisma migrations are automatically applied when the backend container starts.

This means normal operations such as:

```bash
docker compose down
docker compose up -d
```

do not delete personnel, configuration, schedules, or assignment history.

---

# Import Existing Development Database into Docker

If Docker starts with a fresh database and you want to import the existing local development database, first stop the application:

```bash
docker compose down
```

Then copy `prisma/dev.db` into the persistent Docker volume:

```bash
docker run --rm \
  -v shift-maestro_shift_maestro_data:/data \
  -v "$PWD/prisma:/source" \
  alpine \
  sh -c 'cp /source/dev.db /data/shift-maestro.db'
```

Start the application again:

```bash
docker compose up -d
```

The Docker deployment will now use the imported database.

---

# Database Backups

SQLite databases are intentionally ignored by Git.

Before major database changes, a local backup can be created with:

```bash
cp prisma/dev.db \
  prisma/dev.db.backup-$(date +%Y%m%d-%H%M%S)
```

Database backups should not be committed to the repository.

---

# Scheduling Model

Shift Maestro uses persisted assignment history when generating schedules.

The scheduler considers factors including:

1. Current fatigue
2. Recent workload
3. Repetition of the target job
4. Deterministic tie-breaking

Harder job/shift combinations are allocated before easier assignments so that better-rested personnel can absorb higher workloads.

A person's historical assignments therefore influence future scheduling decisions.

## Pinned Assignments

Personnel can be manually pinned to a specific job and shift before schedule generation.

Pinned assignments override normal ranking for that slot while still respecting scheduling constraints such as:

- required slot capacity
- duplicate-person protection

Pinned status is persisted when a schedule is finalized and is available in assignment history.

---

# Configuration History

Jobs and shift groups are not physically deleted when removed from the active configuration.

Instead, they are marked inactive.

This allows old finalized schedules to continue referencing the exact jobs and shifts that existed when those schedules were created.

Only active jobs and shifts are presented to the current scheduler and configuration UI.

---

# V1 Scope

Shift Maestro V1 focuses on:

- Personnel management
- Scheduling configuration
- Duty generation
- Historical workload balancing
- Fatigue-aware scheduling
- Pinned assignments
- Schedule finalization
- Assignment history
- CSV export
- Persistent SQLite storage
- Docker deployment

Second Office functionality is intentionally deferred to V2.

---
