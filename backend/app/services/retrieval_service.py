from sqlalchemy.orm import Session

from app.models.chunk import Chunk
from app.services.embedding_service import create_embedding


DEFAULT_TOP_K = 5


def retrieve_relevant_chunks(
    db: Session,
    ticker: str,
    query: str,
    top_k: int = DEFAULT_TOP_K,
) -> list[dict]:
    query_embedding = create_embedding(query)

    results = (
        db.query(
            Chunk,
            Chunk.embedding.cosine_distance(query_embedding).label("distance"),
        )
        .filter(
            Chunk.ticker == ticker.upper(),
            Chunk.embedding.isnot(None),
        )
        .order_by(Chunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
        .all()
    )

    return [
        {
            "chunk": chunk,
            "score": 1 - float(distance),
        }
        for chunk, distance in results
    ]


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