from fastapi import APIRouter, Depends, HTTPException, Query, status
from openai import (
    APIConnectionError,
    APIError,
    AuthenticationError,
    RateLimitError,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.services.ai_report_service import generate_ai_report
from app.services.chunk_service import chunk_document
from app.services.comparison_service import create_comparison
from app.services.embedding_service import embed_chunks
from app.services.sec_service import SECServiceError, ingest_recent_filings


router = APIRouter(
    prefix="/api/pipeline",
    tags=["pipeline"],
)


@router.post("/{ticker}")
def run_analysis_pipeline(
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
    cleaned_ticker = ticker.strip().upper()

    if not cleaned_ticker:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Ticker cannot be empty.",
        )

    try:
        ingestion_result = ingest_recent_filings(
            db=db,
            ticker=cleaned_ticker,
            form_type=form_type,
            limit=limit,
        )

        documents = (
            db.query(Document)
            .filter(Document.ticker == cleaned_ticker)
            .order_by(Document.created_at.desc())
            .all()
        )

        if len(documents) < 2:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "At least two documents are required to run the full "
                    "analysis pipeline."
                ),
            )

        chunked_document_count = 0
        total_chunks_created_or_found = 0

        for document in documents:
            chunks = chunk_document(
                db=db,
                document_id=document.id,
                force_rechunk=False,
            )

            if chunks:
                chunked_document_count += 1
                total_chunks_created_or_found += len(chunks)

        embedding_result = embed_chunks(
            db=db,
            ticker=cleaned_ticker,
            limit=500,
        )

        comparison = create_comparison(
            db=db,
            ticker=cleaned_ticker,
        )

        if comparison is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "At least two filings of the same document type are "
                    "required for comparison."
                ),
            )

        report = generate_ai_report(
            db=db,
            ticker=cleaned_ticker,
        )

        if report is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "No document chunks were found for report generation."
                ),
            )

        return {
            "status": "completed",
            "ticker": cleaned_ticker,
            "form_type": form_type,
            "requested_filing_limit": limit,
            "documents_available": len(documents),
            "chunked_documents": chunked_document_count,
            "chunks_created_or_found": total_chunks_created_or_found,
            "embedded_count": embedding_result.get("embedded_count", 0),
            "embedding_model": embedding_result.get("embedding_model"),
            "comparison_id": comparison.id,
            "report_id": report.id,
            "message": (
                f"Completed full Vantage pipeline for {cleaned_ticker}: "
                "SEC ingestion, chunking, embeddings, comparison, and AI report."
            ),
        }

    except HTTPException:
        raise

    except SECServiceError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except AuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service credentials are not configured correctly.",
        )

    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="The AI service usage limit has been reached. Please try again later.",
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

    except SQLAlchemyError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"The pipeline could not save data to the database: {str(error)}",
        ) from error

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected pipeline error occurred: {str(error)}",
        ) from error