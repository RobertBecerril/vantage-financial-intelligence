from sqlalchemy.orm import Session

from app.models.filing import Filing
from app.schemas.filing import FilingCreate


def seed_filings(db: Session):
    existing_filings = db.query(Filing).count()

    if existing_filings > 0:
        return

    starter_filings = [
        Filing(
            ticker="AAPL",
            form_type="10-Q",
            title="Apple Quarterly Filing",
            source_url="https://www.sec.gov/example/aapl-10q",
            status="ready_for_ingestion",
        ),
        Filing(
            ticker="NVDA",
            form_type="10-Q",
            title="NVIDIA Quarterly Filing",
            source_url="https://www.sec.gov/example/nvda-10q",
            status="ready_for_ingestion",
        ),
        Filing(
            ticker="MSFT",
            form_type="10-K",
            title="Microsoft Annual Filing",
            source_url="https://www.sec.gov/example/msft-10k",
            status="ready_for_ingestion",
        ),
    ]

    db.add_all(starter_filings)
    db.commit()


def get_filings(db: Session):
    return db.query(Filing).order_by(Filing.created_at.desc()).all()


def get_filings_by_ticker(db: Session, ticker: str):
    return (
        db.query(Filing)
        .filter(Filing.ticker == ticker.upper())
        .order_by(Filing.created_at.desc())
        .all()
    )


def create_filing(db: Session, filing_data: FilingCreate):
    new_filing = Filing(
        ticker=filing_data.ticker.upper(),
        form_type=filing_data.form_type,
        title=filing_data.title,
        source_url=filing_data.source_url,
        status=filing_data.status,
    )

    db.add(new_filing)
    db.commit()
    db.refresh(new_filing)

    return new_filing