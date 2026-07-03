from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ComparisonChange(Base):
    __tablename__ = "comparison_changes"

    id = Column(Integer, primary_key=True, index=True)

    comparison_id = Column(
        Integer,
        ForeignKey("comparisons.id"),
        nullable=False,
        index=True,
    )

    change_type = Column(String, nullable=False)
    section_name = Column(String, nullable=True)

    old_text = Column(Text, nullable=True)
    new_text = Column(Text, nullable=True)

    importance = Column(String, default="medium", nullable=False)
    explanation = Column(Text, nullable=True)

    comparison = relationship(
        "Comparison",
        back_populates="changes",
    )