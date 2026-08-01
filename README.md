# Vantage

Vantage is a financial intelligence platform for analyzing SEC filings. It ingests recent 10-Q and 10-K filings, stores filing text, compares changes between reporting periods, and generates evidence-backed reports.

The goal is to make SEC filings easier to review by combining document processing, semantic search, filing comparison, and structured report generation.

## Features

- SEC filing ingestion for recent 10-Q and 10-K reports
- Document chunking for long filing text
- PostgreSQL storage with pgvector semantic retrieval
- Filing comparison across reporting periods
- AI-assisted materiality classification
- Evidence-backed report generation
- One-click analysis workflow from ticker to report

## Tech Stack

- Next.js
- FastAPI
- PostgreSQL
- pgvector
- SQLAlchemy
- OpenAI API
- Docker

## How It Works

```text
Ticker
→ SEC filing ingestion
→ document storage
→ chunking
→ embedding generation
→ pgvector retrieval
→ filing comparison
→ materiality classification
→ evidence-backed report
```

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

Swagger docs:

```text
http://localhost:8000/docs
```

### Frontend

```bash
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

## PostgreSQL + pgvector

Vantage uses PostgreSQL with pgvector for semantic search.

Example Docker setup for Windows PowerShell:

```powershell
docker run --name vantage-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=vantagepass `
  -e POSTGRES_DB=vantage `
  -p 5433:5432 `
  -d pgvector/pgvector:pg18
```

Inside the database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Example `.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:vantagepass@localhost:5433/vantage
OPENAI_API_KEY=your_api_key_here
```

## Main API Routes

```text
POST /api/pipeline/{ticker}
POST /api/sec/ingest/{ticker}
POST /api/embeddings/{ticker}
POST /api/comparisons/{ticker}
POST /api/ai/reports/{ticker}
GET  /api/reports
GET  /api/documents
```

## Current Status

Vantage currently supports an end-to-end local workflow:

```text
Enter ticker
→ run analysis
→ ingest filings
→ generate chunks and embeddings
→ compare filings
→ generate report
```

Next improvements include faster SEC parsing, clearer progress states, and a cleaner production-style interface.