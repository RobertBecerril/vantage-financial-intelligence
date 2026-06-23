from sqlalchemy.orm import Session

from app.models.chunk import Chunk
from app.models.document import Document


def simple_chunk_text(text: str, max_words: int = 40):
    words = text.split()
    chunks = []

    for i in range(0, len(words), max_words):
        chunk_words = words[i : i + max_words]
        chunk_text = " ".join(chunk_words)

        if chunk_text.strip():
            chunks.append(chunk_text)

    return chunks


def get_chunks(db: Session):
    return db.query(Chunk).order_by(Chunk.created_at.desc()).all()


def get_chunks_by_document(db: Session, document_id: int):
    return (
        db.query(Chunk)
        .filter(Chunk.document_id == document_id)
        .order_by(Chunk.chunk_index.asc())
        .all()
    )


def chunk_document(db: Session, document_id: int):
    document = db.query(Document).filter(Document.id == document_id).first()

    if document is None:
        return None

    existing_chunks = (
        db.query(Chunk).filter(Chunk.document_id == document_id).count()
    )

    if existing_chunks > 0:
        return get_chunks_by_document(db, document_id)

    chunk_texts = simple_chunk_text(document.raw_text)

    new_chunks = []

    for index, text in enumerate(chunk_texts):
        chunk = Chunk(
            document_id=document.id,
            ticker=document.ticker,
            chunk_index=index,
            text=text,
            token_estimate=len(text.split()),
        )

        db.add(chunk)
        new_chunks.append(chunk)

    db.commit()

    for chunk in new_chunks:
        db.refresh(chunk)

    return new_chunks