from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.event import EventCreate, EventResponse
from app.services.event_service import create_event, get_events

router = APIRouter(prefix="/api", tags=["events"])


@router.get("/events", response_model=list[EventResponse])
def read_events(db: Session = Depends(get_db)):
    return get_events(db)


@router.post("/events", response_model=EventResponse)
def add_event(event_data: EventCreate, db: Session = Depends(get_db)):
    return create_event(db, event_data)