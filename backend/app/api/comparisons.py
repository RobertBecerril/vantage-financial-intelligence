from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.comparison import ComparisonResponse
from app.services.comparison_service import (
    create_comparison,
    get_comparison_by_id,
    get_comparisons,
)


router = APIRouter(
    prefix="/api/comparisons",
    tags=["comparisons"],
)


@router.get(
    "",
    response_model=list[ComparisonResponse],
)
def read_comparisons(db: Session = Depends(get_db)):
    return get_comparisons(db)


@router.get(
    "/{comparison_id}",
    response_model=ComparisonResponse,
)
def read_comparison(
    comparison_id: int,
    db: Session = Depends(get_db),
):
    comparison = get_comparison_by_id(
        db,
        comparison_id,
    )

    if comparison is None:
        raise HTTPException(
            status_code=404,
            detail="Comparison not found.",
        )

    return comparison


@router.post(
    "/{ticker}",
    response_model=ComparisonResponse,
    status_code=201,
)
def generate_comparison(
    ticker: str,
    db: Session = Depends(get_db),
):
    cleaned_ticker = ticker.strip().upper()

    if not cleaned_ticker:
        raise HTTPException(
            status_code=422,
            detail="Ticker cannot be empty.",
        )

    comparison = create_comparison(
        db,
        cleaned_ticker,
    )

    if comparison is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "At least two filings of the same document type "
                "are required for comparison."
            ),
        )

    return comparison