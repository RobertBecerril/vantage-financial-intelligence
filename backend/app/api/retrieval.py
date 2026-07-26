import re

from fastapi import APIRouter, Depends, HTTPException, Query, status
from openai import (
    APIConnectionError,
    APIError,
    AuthenticationError,
    RateLimitError,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.retrieval_service import retrieve_relevant_chunks

router = APIRouter(prefix="/api/retrieval", tags=["retrieval"])

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


@router.get("/{ticker}")
def retrieve_chunks_for_ticker(
    ticker: str,
    query: str = Query(..., min_length=3),
    top_k: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    cleaned_ticker = validate_ticker(ticker)

    try:
        results = retrieve_relevant_chunks(
            db=db,
            ticker=cleaned_ticker,
            query=query,
            top_k=top_k,
        )

        return {
            "ticker": cleaned_ticker,
            "query": query,
            "result_count": len(results),
            "results": [
                {
                    "chunk_id": item["chunk"].id,
                    "document_id": item["chunk"].document_id,
                    "chunk_index": item["chunk"].chunk_index,
                    "score": item["score"],
                    "text": item["chunk"].text,
                }
                for item in results
            ],
        }

    except AuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service credentials are not configured correctly.",
        )

    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="The AI service usage limit has been reached.",
        )

    except APIConnectionError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service could not be reached.",
        )

    except APIError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI provider could not complete the retrieval request.",
        )