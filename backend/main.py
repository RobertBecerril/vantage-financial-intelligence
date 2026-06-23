from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chunks import router as chunks_router
from app.api.documents import router as documents_router
from app.api.events import router as events_router
from app.api.filings import router as filings_router
from app.api.reports import router as reports_router
from app.api.ai_reports import router as ai_reports_router
from app.database import Base, SessionLocal, engine
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.event import Event
from app.models.filing import Filing
from app.models.report import Report
from app.services.document_service import seed_documents
from app.services.event_service import seed_events
from app.services.filing_service import seed_filings
from app.services.report_service import seed_reports

app = FastAPI(title="Vantage API")

Base.metadata.create_all(bind=engine)

db = SessionLocal()
seed_events(db)
seed_filings(db)
seed_reports(db)
seed_documents(db)
db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
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


@app.get("/")
def root():
    return {
        "message": "Vantage API is running",
        "status": "healthy",
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
        "message": "Frontend successfully connected to Vantage API",
    }