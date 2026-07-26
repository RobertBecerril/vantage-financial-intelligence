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
from app.services.embedding_service import embed_chunks

router = APIRouter(prefix="/api/embeddings", tags=["embeddings"])

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


@router.post("/{ticker}")
def create_embeddings_for_ticker(
    ticker: str,
    db: Session = Depends(get_db),
):
    cleaned_ticker = validate_ticker(ticker)

    try:
        result = embed_chunks(
            db=db,
            ticker=cleaned_ticker,
            limit=500,
        )

        return result

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
            detail="The AI provider could not complete the embedding request.",
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Embeddings could not be saved to the database.",
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating embeddings.",
        )