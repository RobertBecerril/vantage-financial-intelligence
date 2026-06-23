from pydantic import BaseModel


class DocumentCreate(BaseModel):
    ticker: str
    document_type: str
    title: str
    source_url: str
    raw_text: str
    status: str = "stored"


class DocumentResponse(DocumentCreate):
    id: int

    class Config:
        from_attributes = True