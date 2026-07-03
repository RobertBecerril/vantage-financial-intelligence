from datetime import date

from sqlalchemy.orm import Session

from app.models.document import Document
from app.schemas.document import DocumentCreate


def seed_documents(db: Session):
    existing_documents = db.query(Document).count()

    if existing_documents > 0:
        return

    starter_documents = [
        Document(
            ticker="AAPL",
            document_type="10-Q",
            title="Apple Q1 2026 Form 10-Q",
            source_url="https://example.com/aapl-2026-q1-10q",
            raw_text=(
                "The company discussed regulatory risk, supply chain uncertainty, "
                "foreign exchange exposure, and potential impacts from global market conditions. "
                "Management stated that new digital marketplace regulations may affect "
                "distribution practices and operating expenses."
            ),
            filing_date=date(2026, 1, 31),
            reporting_period="Q1 2026",
            accession_number="0000320193-26-000001",
            status="stored",
        ),
        Document(
            ticker="AAPL",
            document_type="10-Q",
            title="Apple Q2 2026 Form 10-Q",
            source_url="https://example.com/aapl-2026-q2-10q",
            raw_text=(
                "The company discussed increased regulatory risk, ongoing supply chain "
                "uncertainty, foreign exchange exposure, and impacts from global market "
                "conditions. New language emphasized heightened scrutiny of digital "
                "marketplaces and stated that regulatory changes have increased compliance "
                "costs in several regions."
            ),
            filing_date=date(2026, 5, 1),
            reporting_period="Q2 2026",
            accession_number="0000320193-26-000045",
            status="stored",
        ),
        Document(
            ticker="NVDA",
            document_type="10-Q",
            title="NVIDIA Q2 2026 Form 10-Q",
            source_url="https://example.com/nvda-2026-q2-10q",
            raw_text=(
                "Management discussed stronger-than-expected data center demand, "
                "enterprise AI infrastructure growth, and continued GPU supply constraints. "
                "The company raised guidance for the next quarter based on hyperscaler demand."
            ),
            filing_date=date(2026, 8, 20),
            reporting_period="Q2 2026",
            accession_number="0001045810-26-000020",
            status="stored",
        ),
        Document(
            ticker="MSFT",
            document_type="10-K",
            title="Microsoft 2025 Form 10-K",
            source_url="https://example.com/msft-2025-10k",
            raw_text=(
                "Microsoft reported continued cloud revenue growth, enterprise software "
                "demand, and expanding AI infrastructure investment. The filing highlighted "
                "Azure, productivity software, and AI platform opportunities."
            ),
            filing_date=date(2025, 7, 30),
            reporting_period="Fiscal Year 2025",
            accession_number="0000789019-25-000010",
            status="stored",
        ),
    ]

    db.add_all(starter_documents)
    db.commit()


def get_documents(db: Session):
    return (
        db.query(Document)
        .order_by(
            Document.filing_date.desc(),
            Document.created_at.desc(),
        )
        .all()
    )


def get_document_by_id(db: Session, document_id: int):
    return db.query(Document).filter(Document.id == document_id).first()


def create_document(db: Session, document_data: DocumentCreate):
    new_document = Document(
        ticker=document_data.ticker,
        document_type=document_data.document_type,
        title=document_data.title,
        source_url=document_data.source_url,
        raw_text=document_data.raw_text,
        filing_date=document_data.filing_date,
        reporting_period=document_data.reporting_period,
        accession_number=document_data.accession_number,
        status=document_data.status,
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    return new_document