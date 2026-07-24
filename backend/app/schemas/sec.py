from pydantic import BaseModel, Field


class SECIngestionResponse(BaseModel):
    ticker: str
    form_type: str
    requested: int
    created: int
    skipped: int
    created_document_ids: list[int]
    skipped_accession_numbers: list[str]
    created_chunk_count: int
    created_section_count: int


class SECIngestionRequest(BaseModel):
    form_type: str = Field(default="10-Q")
    limit: int = Field(default=2, ge=1, le=5)