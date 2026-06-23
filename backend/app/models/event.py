from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    type = Column(String)
    signal = Column(String)
    impact = Column(String)
    confidence = Column(String)
    source = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)