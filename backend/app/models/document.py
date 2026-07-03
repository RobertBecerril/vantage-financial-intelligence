from datetime import date, datetime, timezone

from sqlalchemy import Column, Date, DateTime, Integer, String, Text

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    ticker = Column(String, index=True, nullable=False)
    document_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    source_url = Column(String, nullable=False)
    raw_text = Column(Text, nullable=False)

    filing_date = Column(Date, nullable=True, index=True)
    reporting_period = Column(String, nullable=True)
    accession_number = Column(String, nullable=True, unique=True, index=True)

    status = Column(String, default="stored", nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )