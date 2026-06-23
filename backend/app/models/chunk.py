from datetime import datetime

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
    created_at = Column(DateTime, default=datetime.utcnow)