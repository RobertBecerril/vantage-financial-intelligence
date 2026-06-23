from pydantic import BaseModel


class ReportCreate(BaseModel):
    ticker: str
    title: str
    summary: str
    confidence_score: str
    evidence: str


class ReportGenerateRequest(BaseModel):
    ticker: str


class ReportResponse(ReportCreate):
    id: int

    class Config:
        from_attributes = True