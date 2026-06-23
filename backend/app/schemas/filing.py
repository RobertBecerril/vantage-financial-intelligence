from pydantic import BaseModel


class FilingCreate(BaseModel):
    ticker: str
    form_type: str
    title: str
    source_url: str
    status: str = "ready_for_ingestion"


class FilingResponse(FilingCreate):
    id: int

    class Config:
        from_attributes = True