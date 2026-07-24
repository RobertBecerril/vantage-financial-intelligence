from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class FilingSection(Base):
    __tablename__ = "filing_sections"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        Integer,
        ForeignKey("documents.id"),
        nullable=False,
        index=True,
    )

    ticker = Column(String, index=True, nullable=False)

    section_name = Column(String, nullable=False, index=True)
    section_order = Column(Integer, nullable=False)

    text = Column(Text, nullable=False)
    word_count = Column(Integer, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    document = relationship("Document")