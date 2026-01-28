# TraceQL

**TraceQL** is a lightweight observability platform that provides **live log ingestion, indexed search, and distributed trace reconstruction** for backend services.

It simulates how modern systems track requests across APIs, workers, and databases using trace and span relationships.

---

## What TraceQL Does

In real distributed systems, a single request often spans:

-an API gateway
-background workers
-database layer

TraceQL shows how those events are correlated using traceId, spanId, and parentSpanId, allowing developers to:

-follow a request end to end
-inspect latency per service
-debug failures across system boundaries

This project focuses on observability mechanics, not production scale.

### Core Features
- Live event streaming
- Indexed log search
- Distributed trace reconstruction
- Structured event inspection

---

## Architecture Overview
```bash
Generator → API → SQLite
↓
Search + Trace APIs
↓
Next.js Frontend
```
---

## File Structure
```bash
traceql/
├── backend/
│   ├── server.js        # Fastify API (ingest, search, stream)
│   ├── db.js            # SQLite schema + indexes
│   ├── generate.js      # Synthetic trace generator
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx     # Live log + search UI
│   │   └── trace/[id]/  # Trace reconstruction view
│   ├── globals.css
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml   # Full stack orchestration
└── README.md

```
---

## Tech Stack

### Backend
- Node.js
- Fastify
- SQLite

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS

---
## Running with Docker
This is the intended way to run TraceQL.
Install dependencies:
```bash
docker compose up --build
```
Then open:
```bash
http://localhost:3000
```
This will start:

-the backend API
-the event generator
-the frontend UI

No local installs required beyond Docker.

## Running Locally

### For Backend
```bash
cd backend
npm install
npm run dev
```
### Generator(Open in new terminal)
```bash
node generate.js
```

### Installing Frontend
```bash
cd frontend
npm install
npm run dev
```
### Open
```bash
http://localhost:3000
```
and enjoy!

