import math

from sqlalchemy.orm import Session

from app.models.chunk import Chunk
from app.services.embedding_service import (
    create_embedding,
    deserialize_embedding,
)


DEFAULT_TOP_K = 5


def cosine_similarity(
    first_vector: list[float],
    second_vector: list[float],
) -> float:
    if len(first_vector) != len(second_vector):
        return 0.0

    dot_product = sum(
        first_value * second_value
        for first_value, second_value in zip(first_vector, second_vector)
    )

    first_magnitude = math.sqrt(
        sum(first_value * first_value for first_value in first_vector)
    )

    second_magnitude = math.sqrt(
        sum(second_value * second_value for second_value in second_vector)
    )

    if first_magnitude == 0 or second_magnitude == 0:
        return 0.0

    return dot_product / (first_magnitude * second_magnitude)


def get_embedded_chunks_for_ticker(
    db: Session,
    ticker: str,
    limit: int = 1000,
) -> list[Chunk]:
    return (
        db.query(Chunk)
        .filter(
            Chunk.ticker == ticker.upper(),
            Chunk.embedding.isnot(None),
        )
        .order_by(Chunk.document_id.desc(), Chunk.chunk_index.asc())
        .limit(limit)
        .all()
    )


def retrieve_relevant_chunks(
    db: Session,
    ticker: str,
    query: str,
    top_k: int = DEFAULT_TOP_K,
) -> list[dict]:
    query_embedding = create_embedding(query)

    chunks = get_embedded_chunks_for_ticker(
        db=db,
        ticker=ticker,
    )

    scored_chunks = []

    for chunk in chunks:
        chunk_embedding = deserialize_embedding(chunk.embedding)

        if chunk_embedding is None:
            continue

        score = cosine_similarity(query_embedding, chunk_embedding)

        scored_chunks.append(
            {
                "chunk": chunk,
                "score": score,
            }
        )

    scored_chunks.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return scored_chunks[:top_k]


def build_retrieved_context(retrieved_chunks: list[dict]) -> str:
    context_blocks = []

    for index, item in enumerate(retrieved_chunks, start=1):
        chunk = item["chunk"]
        score = item["score"]

        context_blocks.append(
            f"Retrieved chunk {index}\n"
            f"Similarity score: {score:.4f}\n"
            f"Chunk ID: {chunk.id}\n"
            f"Document ID: {chunk.document_id}\n"
            f"Ticker: {chunk.ticker}\n"
            f"Chunk index: {chunk.chunk_index}\n"
            f"Text:\n{chunk.text}"
        )

    return "\n\n".join(context_blocks)