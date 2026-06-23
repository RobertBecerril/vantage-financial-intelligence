from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.filing import FilingCreate, FilingResponse
from app.services.filing_service import (
    create_filing,
    get_filings,
    get_filings_by_ticker,
)

router = APIRouter(prefix="/api", tags=["filings"])


@router.get("/filings", response_model=list[FilingResponse])
def read_filings(db: Session = Depends(get_db)):
    return get_filings(db)


@router.get("/filings/{ticker}", response_model=list[FilingResponse])
def read_filings_by_ticker(ticker: str, db: Session = Depends(get_db)):
    return get_filings_by_ticker(db, ticker)


@router.post("/filings", response_model=FilingResponse)
def add_filing(filing_data: FilingCreate, db: Session = Depends(get_db)):
    return create_filing(db, filing_data)