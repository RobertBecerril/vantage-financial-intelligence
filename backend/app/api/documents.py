from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.document import DocumentCreate, DocumentResponse
from app.services.document_service import (
    create_document,
    get_document_by_id,
    get_documents,
)

router = APIRouter(prefix="/api", tags=["documents"])


@router.get("/documents", response_model=list[DocumentResponse])
def read_documents(db: Session = Depends(get_db)):
    return get_documents(db)


@router.get("/documents/{document_id}", response_model=DocumentResponse)
def read_document(document_id: int, db: Session = Depends(get_db)):
    document = get_document_by_id(db, document_id)

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    return document


@router.post("/documents", response_model=DocumentResponse)
def add_document(document_data: DocumentCreate, db: Session = Depends(get_db)):
    return create_document(db, document_data)