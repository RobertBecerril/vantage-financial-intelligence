from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.chunk import ChunkResponse
from app.services.chunk_service import (
    chunk_document,
    get_chunks,
    get_chunks_by_document,
)

router = APIRouter(prefix="/api", tags=["chunks"])


@router.get("/chunks", response_model=list[ChunkResponse])
def read_chunks(db: Session = Depends(get_db)):
    return get_chunks(db)


@router.get("/documents/{document_id}/chunks", response_model=list[ChunkResponse])
def read_document_chunks(document_id: int, db: Session = Depends(get_db)):
    return get_chunks_by_document(db, document_id)


@router.post("/documents/{document_id}/chunk", response_model=list[ChunkResponse])
def create_chunks_for_document(document_id: int, db: Session = Depends(get_db)):
    chunks = chunk_document(db, document_id)

    if chunks is None:
        raise HTTPException(status_code=404, detail="Document not found")

    return chunks