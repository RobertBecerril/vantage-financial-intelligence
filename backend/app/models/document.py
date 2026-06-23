from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    document_type = Column(String)
    title = Column(String)
    source_url = Column(String)
    raw_text = Column(Text)
    status = Column(String, default="stored")
    created_at = Column(DateTime, default=datetime.utcnow)