from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.database import Base


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), index=True)
    ticker = Column(String, index=True)
    chunk_index = Column(Integer)
    text = Column(Text)
    token_estimate = Column(Integer)

    embedding = Column(Vector(1536), nullable=True)
    embedding_model = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)