from pydantic import BaseModel


class EventCreate(BaseModel):
    ticker: str
    type: str
    signal: str
    impact: str
    confidence: str
    source: str


class EventResponse(EventCreate):
    id: int

    class Config:
        from_attributes = True