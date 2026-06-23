from sqlalchemy.orm import Session

from app.models.document import Document
from app.schemas.document import DocumentCreate


def seed_documents(db: Session):
    existing_documents = db.query(Document).count()

    if existing_documents > 0:
        return

    starter_documents = [
        Document(
            ticker="NVDA",
            document_type="Earnings Call Transcript",
            title="NVIDIA Q2 Earnings Call Transcript",
            source_url="https://example.com/nvda-q2-earnings",
            raw_text=(
                "Management discussed stronger-than-expected data center demand, "
                "enterprise AI infrastructure growth, and continued GPU supply constraints. "
                "The company raised guidance for the next quarter based on hyperscaler demand."
            ),
            status="stored",
        ),
        Document(
            ticker="AAPL",
            document_type="10-Q",
            title="Apple Quarterly Filing Risk Factors",
            source_url="https://example.com/aapl-10q",
            raw_text=(
                "The company discussed regulatory risk, supply chain uncertainty, "
                "foreign exchange exposure, and potential impacts from global market conditions. "
                "New language emphasized increased scrutiny of digital marketplaces."
            ),
            status="stored",
        ),
        Document(
            ticker="MSFT",
            document_type="10-K",
            title="Microsoft Annual Filing Cloud Segment",
            source_url="https://example.com/msft-10k",
            raw_text=(
                "Microsoft reported continued cloud revenue growth, enterprise software demand, "
                "and expanding AI infrastructure investment. The filing highlighted Azure, "
                "productivity software, and AI platform opportunities."
            ),
            status="stored",
        ),
    ]

    db.add_all(starter_documents)
    db.commit()


def get_documents(db: Session):
    return db.query(Document).order_by(Document.created_at.desc()).all()


def get_document_by_id(db: Session, document_id: int):
    return db.query(Document).filter(Document.id == document_id).first()


def create_document(db: Session, document_data: DocumentCreate):
    new_document = Document(
        ticker=document_data.ticker.upper(),
        document_type=document_data.document_type,
        title=document_data.title,
        source_url=document_data.source_url,
        raw_text=document_data.raw_text,
        status=document_data.status,
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    return new_document