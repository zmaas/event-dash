# Event Dashboard Demo

Small demo full-stack app using TypeScript + Golang

## As-deployed

- Next.js + TypeScript Frontend on Vercel
- Backend handled by Neon Postgres
- Auth using BetterAuth with admin roles + passkeys implemented
- Drizzle ORM for frontend, Golang PGX for ingestion
- Schema representing synthetic logging events

## Available for deployment

- Docker-compose build for all components
- PostgreSQL backend DB,
- Golang based buffered ingestion service
-

## Setup

1. **Start the database:**

   ```bash
   docker-compose up postgres -d
   ```

2. **Run database migrations:**

   ```bash
   pnpm db:push
   ```

3. **Seed the database with sample data:**

   ```bash
   pnpm db:seed
   ```

4. **Start the ingestion service:**

   ```bash
   docker-compose up ingestion -d
   ```

5. **Start the Next.js app:**
   ```bash
   pnpm dev
   ```

## Services

### Ingestion Service

A buffered ingestion service written in Go that accepts event data via HTTP POST and batches inserts into PostgreSQL.

**Endpoints:**

- `POST /ingest` - Accept event data (JSON)
- `GET /health` - Health check with buffer status

**Configuration (environment variables):**

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 8080)
- `BUFFER_SIZE` - In-memory buffer capacity (default: 1000)
- `BATCH_SIZE` - Batch insert size (default: 100)
- `FLUSH_INTERVAL` - Time-based flush interval (default: 5s)

**Example event payload:**

```json
{
  "event_type": "api_call",
  "severity": "low",
  "ip_address": "192.168.1.1",
  "user_id": "user123",
  "endpoint": "/api/test",
  "http_method": "GET",
  "status_code": 200,
  "metadata": {
    "user_agent": "test-agent",
    "response_time": 150
  }
}
```

**Testing:**

```bash
cd ingest
./test_ingest.sh
```

## TODO

### UI

- [x] Minimal UI with ShadCN
- [x] Schema setup
- [x] Insert synthetic data
- [x] Have frontend pull from DB
- [x] Fix navigation bug
- [ ] Add auth?

### Ingestion Engine

- [x] Ingestion service in Go
- [x] HTTP API for event submission
- [x] Batch database inserts
- [x] Health check endpoint
- [x] Docker containerization
- [x] Integration with docker-compose
