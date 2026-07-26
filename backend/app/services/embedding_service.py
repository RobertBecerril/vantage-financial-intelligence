import json
import os
from typing import Iterable

from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy.orm import Session

from app.models.chunk import Chunk

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_BATCH_SIZE = 50


def create_embedding(text: str) -> list[float]:
    cleaned_text = " ".join(text.split())

    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=cleaned_text,
    )

    return response.data[0].embedding


def create_embeddings_batch(texts: Iterable[str]) -> list[list[float]]:
    cleaned_texts = [" ".join(text.split()) for text in texts]

    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=cleaned_texts,
    )

    return [item.embedding for item in response.data]


def serialize_embedding(embedding: list[float]) -> str:
    return json.dumps(embedding)


def deserialize_embedding(embedding_text: str | None) -> list[float] | None:
    if not embedding_text:
        return None

    try:
        parsed = json.loads(embedding_text)
    except json.JSONDecodeError:
        return None

    if not isinstance(parsed, list):
        return None

    return [float(value) for value in parsed]


def get_chunks_missing_embeddings(
    db: Session,
    ticker: str | None = None,
    limit: int = 200,
) -> list[Chunk]:
    query = db.query(Chunk).filter(Chunk.embedding.is_(None))

    if ticker:
        query = query.filter(Chunk.ticker == ticker.upper())

    return (
        query.order_by(Chunk.document_id.asc(), Chunk.chunk_index.asc())
        .limit(limit)
        .all()
    )


def embed_chunks(
    db: Session,
    ticker: str | None = None,
    limit: int = 200,
) -> dict:
    chunks = get_chunks_missing_embeddings(
        db=db,
        ticker=ticker,
        limit=limit,
    )

    if not chunks:
        return {
            "embedded_count": 0,
            "message": "No chunks without embeddings were found.",
        }

    embedded_count = 0

    for start_index in range(0, len(chunks), EMBEDDING_BATCH_SIZE):
        batch = chunks[start_index : start_index + EMBEDDING_BATCH_SIZE]
        batch_texts = [chunk.text for chunk in batch]

        embeddings = create_embeddings_batch(batch_texts)

        for chunk, embedding in zip(batch, embeddings):
            chunk.embedding = serialize_embedding(embedding)
            chunk.embedding_model = EMBEDDING_MODEL
            embedded_count += 1

        db.commit()

    return {
        "embedded_count": embedded_count,
        "embedding_model": EMBEDDING_MODEL,
        "message": f"Embedded {embedded_count} chunks.",
    }