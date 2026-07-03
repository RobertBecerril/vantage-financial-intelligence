from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ComparisonChangeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    comparison_id: int
    change_type: str
    section_name: str | None
    old_text: str | None
    new_text: str | None
    importance: str
    explanation: str | None


class ComparisonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticker: str
    older_document_id: int
    newer_document_id: int
    summary: str | None
    overall_risk_direction: str | None
    status: str
    created_at: datetime
    changes: list[ComparisonChangeResponse]