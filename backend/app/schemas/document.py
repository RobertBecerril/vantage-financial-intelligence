from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DocumentBase(BaseModel):
    ticker: str = Field(min_length=1, max_length=10)
    document_type: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=1, max_length=300)
    source_url: str
    raw_text: str = Field(min_length=1)

    filing_date: date | None = None
    reporting_period: str | None = Field(default=None, max_length=100)
    accession_number: str | None = Field(default=None, max_length=50)

    status: str = "stored"

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, value: str) -> str:
        cleaned_value = value.strip().upper()

        if not cleaned_value:
            raise ValueError("Ticker cannot be empty.")

        return cleaned_value

    @field_validator(
        "document_type",
        "title",
        "source_url",
        "raw_text",
        "status",
    )
    @classmethod
    def remove_surrounding_whitespace(cls, value: str) -> str:
        cleaned_value = value.strip()

        if not cleaned_value:
            raise ValueError("This field cannot be empty.")

        return cleaned_value

    @field_validator("reporting_period", "accession_number")
    @classmethod
    def clean_optional_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None

        cleaned_value = value.strip()

        return cleaned_value or None


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime