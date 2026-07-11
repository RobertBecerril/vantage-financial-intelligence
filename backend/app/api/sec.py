from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.sec import SECIngestionResponse
from app.services.sec_service import (
    SECServiceError,
    ingest_recent_filings,
)


router = APIRouter(
    prefix="/api/sec",
    tags=["sec"],
)


@router.post(
    "/ingest/{ticker}",
    response_model=SECIngestionResponse,
)
def ingest_sec_filings(
    ticker: str,
    form_type: str = Query(
        default="10-Q",
        description="Supported values: 10-Q or 10-K",
    ),
    limit: int = Query(
        default=2,
        ge=1,
        le=5,
        description="Number of recent filings to ingest.",
    ),
    db: Session = Depends(get_db),
):
    try:
        return ingest_recent_filings(
            db=db,
            ticker=ticker,
            form_type=form_type,
            limit=limit,
        )

    except SECServiceError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="An unexpected SEC ingestion error occurred.",
        ) from error