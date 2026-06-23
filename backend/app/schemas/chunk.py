from pydantic import BaseModel


class ChunkCreate(BaseModel):
    document_id: int
    ticker: str
    chunk_index: int
    text: str
    token_estimate: int


class ChunkResponse(ChunkCreate):
    id: int

    class Config:
        from_attributes = True