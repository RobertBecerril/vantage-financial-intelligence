import re

from fastapi import APIRouter, Depends, HTTPException, status
from openai import (
    APIConnectionError,
    APIError,
    AuthenticationError,
    RateLimitError,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.report import ReportResponse
from app.services.ai_report_service import generate_ai_report

router = APIRouter(prefix="/api/ai", tags=["ai-reports"])

TICKER_PATTERN = re.compile(r"^[A-Za-z0-9.-]{1,10}$")


def validate_ticker(ticker: str) -> str:
    cleaned_ticker = ticker.strip().upper()

    if not TICKER_PATTERN.fullmatch(cleaned_ticker):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Ticker must contain 1–10 letters, numbers, "
                "periods, or hyphens."
            ),
        )

    return cleaned_ticker


@router.post("/reports/{ticker}", response_model=ReportResponse)
def create_ai_report(
    ticker: str,
    db: Session = Depends(get_db),
):
    cleaned_ticker = validate_ticker(ticker)

    try:
        report = generate_ai_report(db, cleaned_ticker)

        if report is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"No document chunks were found for {cleaned_ticker}. "
                    "Store and chunk a document before generating a report."
                ),
            )

        return report

    except HTTPException:
        raise

    except AuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service credentials are not configured correctly.",
        )

    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "The AI service usage limit has been reached. "
                "Please try again later."
            ),
        )

    except APIConnectionError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service could not be reached. Please try again later.",
        )

    except APIError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI provider could not complete the request.",
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The report could not be saved to the database.",
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating the report.",
        )