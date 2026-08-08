<p align="center">
  <img src="./public/vantage-full-logo.png" alt="Vantage logo" width="320" />
</p>

# Vantage

Vantage is a financial intelligence platform for analyzing SEC filings.

It takes a company ticker, pulls recent 10-Q or 10-K filings, processes the filing text, compares changes across reporting periods, and generates an evidence-backed report that highlights what changed and why it may matter.

The project is built around a simple idea:

> See what changed. Know what matters.

## What It Does

Vantage turns a manual SEC filing review process into a structured workflow:

```text
Ticker
→ SEC filing ingestion
→ document storage
→ text chunking
→ embedding generation
→ pgvector retrieval
→ filing comparison
→ materiality analysis
→ evidence-backed report
```

The app is currently focused on local analysis and portfolio demonstration. Deployment preparation is in progress!

## Screenshots

### Dashboard overview
![Dashboard overview](docs/screenshots/dashboard-overview.png)

### One-click analysis workflow
![Pipeline workflow](docs/screenshots/pipeline-workflow.png)

### Evidence-backed intelligence report
![Intelligence report](docs/screenshots/intelligence-report.png)

### Filing signal analysis
![Filing signals](docs/screenshots/signals-filings.png)

### Backend API routes
![Backend API routes](docs/screenshots/backend-api-routes.png)

### Backend pipeline execution
![Backend pipeline execution](docs/screenshots/backend-pipeline-runs.png)

## Features

- One-click company analysis from ticker to report
- SEC 10-Q and 10-K filing ingestion
- Document chunking with overlapping text windows
- PostgreSQL storage with pgvector semantic search
- 1,536-dimensional OpenAI embeddings
- Filing comparison across reporting periods
- AI-assisted materiality classification
- Risk direction, confidence, and uncertainty scoring
- Evidence-backed report generation
- Clean dashboard for reviewing generated reports

## Tech Stack

**Frontend**
- Next.js
- TypeScript
- Tailwind CSS

**Backend**
- FastAPI
- Python
- SQLAlchemy

**Database**
- PostgreSQL
- pgvector
- Docker

**AI / Retrieval**
- OpenAI API
- RAG pipeline
- Vector similarity search

## Why I Built This

SEC filings contain useful information, but reviewing them manually can be slow and repetitive. The goal of Vantage is to make filing changes easier to find, compare, and understand.

Instead of using AI as a simple chatbot, Vantage uses a more structured pipeline:

1. Store and process the filing text
2. Break filings into searchable chunks
3. Embed those chunks into a vector database
4. Compare filing sections across periods
5. Classify material changes
6. Generate a report grounded in retrieved evidence

This makes the output easier to inspect and less dependent on a single prompt.

## Current Workflow

The main workflow is handled through a one-click pipeline:

```text
Enter ticker
→ Run Analysis
→ Ingest recent filings
→ Generate chunks and embeddings
→ Compare filings
→ Generate report
→ Review evidence
```

Main endpoint:

```text
POST /api/pipeline/{ticker}
```

Example:

```text
POST /api/pipeline/AAPL?form_type=10-Q&limit=2
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
GET  /api/status
```

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/RobertBecerril/vantage-financial-intelligence.git
cd vantage-financial-intelligence
```

### 2. Start PostgreSQL with pgvector

```powershell
docker run --name vantage-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=vantagepass `
  -e POSTGRES_DB=vantage `
  -p 5433:5432 `
  -d pgvector/pgvector:pg18
```

Then enable pgvector:

```powershell
docker exec -it vantage-postgres psql -U postgres -d vantage
```

```sql
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 3. Configure environment variables

Create a `.env` file inside the `backend` folder:

```env
DATABASE_URL=postgresql+psycopg2://postgres:vantagepass@localhost:5433/vantage
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Start the backend

```powershell
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

### 5. Start the frontend

In a second terminal:

```powershell
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

## Database Reset for Local Development

To clear local demo data:

```powershell
docker exec -it vantage-postgres psql -U postgres -d vantage
```

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

Then restart the backend.

## Deployment Status

Vantage currently runs locally with a Next.js frontend, FastAPI backend, PostgreSQL database, and pgvector extension.

Deployment preparation is in progress. The next deployment steps are:

- production environment configuration
- managed PostgreSQL setup with pgvector
- backend hosting
- frontend hosting
- production API routing
- environment variable cleanup

## Roadmap

Near-term improvements:

- faster SEC filing parsing
- cleaner loading and progress states
- latest-report-only display option
- duplicate report prevention
- production deployment (still digging more into secure deployment)
- many many more features regarding UX..

## Project Status

Vantage is functional as a local end-to-end prototype.

The core pipeline is working:

```text
SEC filings
→ chunks
→ embeddings
→ vector retrieval
→ filing comparison
→ materiality classification
→ evidence-backed report
```

I have many more ideas for vantage and im excited for the future of this project! 
any questions feel free to contact me: robertbecerril@vt.edu 