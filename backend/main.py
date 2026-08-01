from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai_reports import router as ai_reports_router
from app.api.chunks import router as chunks_router
from app.api.comparisons import router as comparisons_router
from app.api.documents import router as documents_router
from app.api.events import router as events_router
from app.api.filings import router as filings_router
from app.api.reports import router as reports_router
from app.database import Base, SessionLocal, engine
from app.api.sec import router as sec_router
from app.api.embeddings import router as embeddings_router
from app.api.retrieval import router as retrieval_router
from app.api.pipeline import router as pipeline_router

# Import every SQLAlchemy model before create_all().
# This ensures SQLAlchemy knows which database tables to create.
from app.models.chunk import Chunk
from app.models.comparison import Comparison
from app.models.comparison_change import ComparisonChange
from app.models.document import Document
from app.models.event import Event
from app.models.filing import Filing
from app.models.filing_section import FilingSection
from app.models.report import Report

from app.services.document_service import seed_documents
from app.services.event_service import seed_events
from app.services.filing_service import seed_filings
from app.services.report_service import seed_reports


app = FastAPI(
    title="Vantage API",
    description=(
        "Backend API for financial document storage, chunking, "
        "AI report generation, and filing comparison."
    ),
    version="1.5.0",
)


Base.metadata.create_all(bind=engine)


def seed_database() -> None:
    db = SessionLocal()

    try:
        seed_events(db)
        seed_filings(db)
        seed_reports(db)
        seed_documents(db)
    finally:
        db.close()


seed_database()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(events_router)
app.include_router(filings_router)
app.include_router(reports_router)
app.include_router(documents_router)
app.include_router(chunks_router)
app.include_router(ai_reports_router)
app.include_router(comparisons_router)
app.include_router(sec_router)
app.include_router(embeddings_router)
app.include_router(retrieval_router)
app.include_router(pipeline_router)


@app.get("/")
def root():
    return {
        "message": "Vantage API is running",
        "status": "healthy",
        "version": "1.5.0",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }


@app.get("/api/status")
def api_status():
    return {
        "app": "Vantage",
        "backend": "FastAPI",
        "status": "connected",
        "version": "1.5.0",
        "message": "Frontend successfully connected to Vantage API",
    }