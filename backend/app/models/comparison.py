from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Comparison(Base):
    __tablename__ = "comparisons"

    id = Column(Integer, primary_key=True, index=True)

    ticker = Column(String, nullable=False, index=True)

    older_document_id = Column(
        Integer,
        ForeignKey("documents.id"),
        nullable=False,
    )

    newer_document_id = Column(
        Integer,
        ForeignKey("documents.id"),
        nullable=False,
    )

    summary = Column(Text, nullable=True)
    overall_risk_direction = Column(String, nullable=True)
    status = Column(String, default="completed", nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    older_document = relationship(
        "Document",
        foreign_keys=[older_document_id],
    )

    newer_document = relationship(
        "Document",
        foreign_keys=[newer_document_id],
    )

    changes = relationship(
        "ComparisonChange",
        back_populates="comparison",
        cascade="all, delete-orphan",
    )