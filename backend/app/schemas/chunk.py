from datetime import datetime

from pydantic import BaseModel


class ChunkCreate(BaseModel):
    document_id: int
    ticker: str
    chunk_index: int
    text: str
    token_estimate: int


class ChunkResponse(BaseModel):
    id: int
    document_id: int
    ticker: str
    chunk_index: int
    text: str
    token_estimate: int
    embedding_model: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True