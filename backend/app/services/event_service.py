from sqlalchemy.orm import Session

from app.models.event import Event
from app.schemas.event import EventCreate


def seed_events(db: Session):
    existing_events = db.query(Event).count()

    if existing_events > 0:
        return

    starter_events = [
        Event(
            ticker="NVDA",
            type="Earnings Call",
            signal="Data center guidance raised",
            impact="High",
            confidence="87%",
            source="Q2 Earnings Transcript",
        ),
        Event(
            ticker="AAPL",
            type="SEC Filing",
            signal="New regulatory risk language detected",
            impact="Medium",
            confidence="78%",
            source="Latest 10-Q Filing",
        ),
        Event(
            ticker="JPM",
            type="SEC Filing",
            signal="Credit-loss reserve language intensified",
            impact="Medium",
            confidence="74%",
            source="Quarterly Filing",
        ),
    ]

    db.add_all(starter_events)
    db.commit()


def get_events(db: Session):
    return db.query(Event).order_by(Event.created_at.desc()).all()


def create_event(db: Session, event_data: EventCreate):
    new_event = Event(
        ticker=event_data.ticker.upper(),
        type=event_data.type,
        signal=event_data.signal,
        impact=event_data.impact,
        confidence=event_data.confidence,
        source=event_data.source,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event