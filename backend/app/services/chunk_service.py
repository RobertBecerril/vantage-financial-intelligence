from sqlalchemy.orm import Session

from app.models.chunk import Chunk
from app.models.document import Document


DEFAULT_CHUNK_WORDS = 300
DEFAULT_OVERLAP_WORDS = 60


def simple_chunk_text(
    text: str,
    max_words: int = DEFAULT_CHUNK_WORDS,
    overlap_words: int = DEFAULT_OVERLAP_WORDS,
):
    words = text.split()
    chunks = []

    if not words:
        return chunks

    step_size = max_words - overlap_words

    if step_size <= 0:
        raise ValueError("overlap_words must be smaller than max_words")

    for start_index in range(0, len(words), step_size):
        chunk_words = words[start_index : start_index + max_words]
        chunk_text = " ".join(chunk_words).strip()

        if chunk_text:
            chunks.append(chunk_text)

        if start_index + max_words >= len(words):
            break

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


def chunk_document(db: Session, document_id: int, force_rechunk: bool = False):
    document = db.query(Document).filter(Document.id == document_id).first()

    if document is None:
        return None

    existing_chunks = (
        db.query(Chunk).filter(Chunk.document_id == document_id).all()
    )

    if existing_chunks and not force_rechunk:
        return get_chunks_by_document(db, document_id)

    if existing_chunks and force_rechunk:
        for chunk in existing_chunks:
            db.delete(chunk)

        db.commit()

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