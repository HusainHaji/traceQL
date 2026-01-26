# TraceQL

**TraceQL** is a lightweight observability platform that provides **live log ingestion, indexed search, and distributed trace reconstruction** for backend services.

It simulates how modern systems track requests across APIs, workers, and databases using trace and span relationships.

---

## What TraceQL Does

TraceQL ingests structured events from multiple services and reconstructs **end-to-end request traces** using `traceId`, `spanId`, and `parentSpanId`.

### Core Features
- Live event streaming
- Indexed log search
- Distributed trace reconstruction
- Structured event inspection

---

## Architecture Overview

Generator → API → SQLite
↓
Search + Trace APIs
↓
Next.js Frontend

---

## File Structure

traceql/
├── backend/
│ ├── server.js # Fastify API
│ ├── db.js # SQLite schema and queries
│ ├── generate.js # Event generator
│ └── package.json
│
├── frontend/
│ ├── app/
│ │ ├── page.tsx
│ │ └── trace/[traceId]/page.tsx
│ ├── globals.css
│ ├── layout.tsx
│ └── package.json

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

