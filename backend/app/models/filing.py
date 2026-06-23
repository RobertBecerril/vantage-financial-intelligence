from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class Filing(Base):
    __tablename__ = "filings"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    form_type = Column(String)
    title = Column(String)
    source_url = Column(String)
    status = Column(String, default="ready_for_ingestion")
    created_at = Column(DateTime, default=datetime.utcnow)