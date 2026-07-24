import re

from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.filing_section import FilingSection


SECTION_PATTERNS = [
    {
        "section_name": "Risk Factors",
        "section_order": 1,
        "start_patterns": [
            r"item\s+1a[\.\s\-–—:]+risk\s+factors",
        ],
        "end_patterns": [
            r"item\s+1b[\.\s\-–—:]+unresolved\s+staff\s+comments",
            r"item\s+2[\.\s\-–—:]+management",
        ],
    },
    {
        "section_name": "Management Discussion and Analysis",
        "section_order": 2,
        "start_patterns": [
            r"item\s+2[\.\s\-–—:]+management[’'`s\s]+discussion\s+and\s+analysis",
        ],
        "end_patterns": [
            r"item\s+3[\.\s\-–—:]+quantitative\s+and\s+qualitative",
            r"item\s+4[\.\s\-–—:]+controls\s+and\s+procedures",
        ],
    },
    {
        "section_name": "Quantitative and Qualitative Disclosures",
        "section_order": 3,
        "start_patterns": [
            r"item\s+3[\.\s\-–—:]+quantitative\s+and\s+qualitative",
        ],
        "end_patterns": [
            r"item\s+4[\.\s\-–—:]+controls\s+and\s+procedures",
        ],
    },
    {
        "section_name": "Controls and Procedures",
        "section_order": 4,
        "start_patterns": [
            r"item\s+4[\.\s\-–—:]+controls\s+and\s+procedures",
        ],
        "end_patterns": [
            r"part\s+ii",
            r"item\s+1[\.\s\-–—:]+legal\s+proceedings",
        ],
    },
]


def normalize_section_text(text: str) -> str:
    lines = []

    for line in text.splitlines():
        cleaned_line = " ".join(line.split())

        if cleaned_line:
            lines.append(cleaned_line)

    return "\n".join(lines).strip()


def find_pattern_position(
    text: str,
    patterns: list[str],
    start_position: int = 0,
) -> int | None:
    search_text = text[start_position:]

    for pattern in patterns:
        match = re.search(
            pattern,
            search_text,
            flags=re.IGNORECASE,
        )

        if match:
            return start_position + match.start()

    return None


def extract_section_text(
    text: str,
    start_patterns: list[str],
    end_patterns: list[str],
) -> str | None:
    start_position = find_pattern_position(
        text=text,
        patterns=start_patterns,
    )

    if start_position is None:
        return None

    end_position = find_pattern_position(
        text=text,
        patterns=end_patterns,
        start_position=start_position + 1,
    )

    if end_position is None:
        section_text = text[start_position:]
    else:
        section_text = text[start_position:end_position]

    cleaned_section_text = normalize_section_text(section_text)

    if len(cleaned_section_text.split()) < 50:
        return None

    return cleaned_section_text


def get_sections_by_document(
    db: Session,
    document_id: int,
) -> list[FilingSection]:
    return (
        db.query(FilingSection)
        .filter(FilingSection.document_id == document_id)
        .order_by(FilingSection.section_order.asc())
        .all()
    )


def extract_sections_for_document(
    db: Session,
    document_id: int,
) -> list[FilingSection] | None:
    document = db.query(Document).filter(Document.id == document_id).first()

    if document is None:
        return None

    existing_sections = get_sections_by_document(
        db=db,
        document_id=document_id,
    )

    if existing_sections:
        return existing_sections

    new_sections: list[FilingSection] = []

    for section_config in SECTION_PATTERNS:
        section_text = extract_section_text(
            text=document.raw_text,
            start_patterns=section_config["start_patterns"],
            end_patterns=section_config["end_patterns"],
        )

        if section_text is None:
            continue

        filing_section = FilingSection(
            document_id=document.id,
            ticker=document.ticker,
            section_name=section_config["section_name"],
            section_order=section_config["section_order"],
            text=section_text,
            word_count=len(section_text.split()),
        )

        db.add(filing_section)
        new_sections.append(filing_section)

    db.commit()

    for section in new_sections:
        db.refresh(section)

    return new_sections


def extract_sections_for_documents(
    db: Session,
    documents: list[Document],
) -> int:
    created_section_count = 0

    for document in documents:
        sections = extract_sections_for_document(
            db=db,
            document_id=document.id,
        )

        if sections is not None:
            created_section_count += len(sections)

    return created_section_count