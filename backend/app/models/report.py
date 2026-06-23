from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    title = Column(String)
    summary = Column(Text)
    confidence_score = Column(String)
    evidence = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)