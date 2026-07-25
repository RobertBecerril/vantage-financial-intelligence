import re
from difflib import SequenceMatcher
from typing import Iterable

from sqlalchemy.orm import Session, joinedload

from app.models.comparison import Comparison
from app.models.comparison_change import ComparisonChange
from app.models.document import Document
from app.models.filing_section import FilingSection


SIMILARITY_THRESHOLD = 0.72
MAX_SAVED_CHANGES = 75
MAX_SENTENCES_PER_SECTION = 250
MAX_FULL_DOCUMENT_SENTENCES = 400


HIGH_PRIORITY_TERMS = [
    "material adverse",
    "adversely affect",
    "adversely affected",
    "substantial doubt",
    "going concern",
    "cybersecurity incident",
    "data breach",
    "regulatory investigation",
    "government investigation",
    "lawsuit",
    "litigation",
    "class action",
    "compliance",
    "supply constraint",
    "supply chain disruption",
    "liquidity",
    "debt covenant",
    "default",
    "impairment",
    "restructuring",
    "layoff",
    "workforce reduction",
    "customer concentration",
    "loss of customers",
    "material weakness",
    "internal control",
]

MEDIUM_PRIORITY_TERMS = [
    "risk",
    "uncertain",
    "volatility",
    "inflation",
    "interest rates",
    "foreign exchange",
    "competition",
    "demand",
    "revenue",
    "margin",
    "costs",
    "expenses",
    "inventory",
    "legal proceedings",
    "tax",
    "tariff",
    "geopolitical",
    "macroeconomic",
]


def normalize_text(text: str) -> str:
    return " ".join(text.split()).strip()


def split_into_sentences(text: str) -> list[str]:
    cleaned_text = normalize_text(text)

    if not cleaned_text:
        return []

    sentences: list[str] = []
    current_sentence: list[str] = []

    for character in cleaned_text:
        current_sentence.append(character)

        if character in ".!?":
            sentence = "".join(current_sentence).strip()

            if sentence:
                sentences.append(sentence)

            current_sentence = []

    remaining_text = "".join(current_sentence).strip()

    if remaining_text:
        sentences.append(remaining_text)

    return sentences


def has_material_terms(
    old_text: str | None,
    new_text: str | None,
) -> bool:
    combined_text = f"{old_text or ''} {new_text or ''}".lower()

    return any(
        term in combined_text
        for term in HIGH_PRIORITY_TERMS + MEDIUM_PRIORITY_TERMS
    )


def limit_sentences(
    sentences: list[str],
    max_sentences: int,
) -> list[str]:
    material_sentences = [
        sentence
        for sentence in sentences
        if has_material_terms(sentence, None)
    ]

    if material_sentences:
        return material_sentences[:max_sentences]

    return sentences[:max_sentences]


def sentence_similarity(old_sentence: str, new_sentence: str) -> float:
    return SequenceMatcher(
        None,
        old_sentence.lower(),
        new_sentence.lower(),
    ).ratio()


def find_best_match(
    sentence: str,
    candidates: Iterable[str],
) -> tuple[str | None, float]:
    best_match: str | None = None
    best_score = 0.0

    for candidate in candidates:
        score = sentence_similarity(sentence, candidate)

        if score > best_score:
            best_match = candidate
            best_score = score

    return best_match, best_score


def normalize_for_materiality(text: str) -> str:
    cleaned_text = text.lower()

    cleaned_text = re.sub(r"\b20\d{2}\b", "YEAR", cleaned_text)
    cleaned_text = re.sub(r"\b19\d{2}\b", "YEAR", cleaned_text)
    cleaned_text = re.sub(r"\b\d+(\.\d+)?\b", "NUMBER", cleaned_text)

    cleaned_text = re.sub(
        r"\b(first|second|third|fourth)\s+quarter\b",
        "QUARTER",
        cleaned_text,
    )

    cleaned_text = re.sub(
        r"\b(three|six|nine|twelve)\s+months\s+ended\b",
        "PERIOD_ENDED",
        cleaned_text,
    )

    cleaned_text = re.sub(
        r"\b(january|february|march|april|may|june|july|august|"
        r"september|october|november|december)\b",
        "MONTH",
        cleaned_text,
    )

    cleaned_text = re.sub(r"\s+", " ", cleaned_text).strip()

    return cleaned_text


def is_mostly_reporting_period_change(
    old_text: str | None,
    new_text: str | None,
) -> bool:
    if not old_text or not new_text:
        return False

    normalized_old = normalize_for_materiality(old_text)
    normalized_new = normalize_for_materiality(new_text)

    similarity_after_normalization = SequenceMatcher(
        None,
        normalized_old,
        normalized_new,
    ).ratio()

    return similarity_after_normalization >= 0.94


def is_low_information_sentence(text: str | None) -> bool:
    if not text:
        return True

    cleaned_text = text.strip()

    if len(cleaned_text.split()) < 8:
        return True

    low_value_patterns = [
        r"table of contents",
        r"page\s+\d+",
        r"signatures",
        r"exhibit\s+\d+",
        r"index",
        r"not applicable",
    ]

    return any(
        re.search(pattern, cleaned_text, flags=re.IGNORECASE)
        for pattern in low_value_patterns
    )


def determine_importance(
    change_type: str,
    old_text: str | None,
    new_text: str | None,
) -> str:
    combined_text = f"{old_text or ''} {new_text or ''}".lower()

    if any(term in combined_text for term in HIGH_PRIORITY_TERMS):
        return "high"

    if any(term in combined_text for term in MEDIUM_PRIORITY_TERMS):
        return "medium"

    if change_type == "modified":
        return "low"

    return "low"


def is_noise_change(change: dict) -> bool:
    old_text = change["old_text"]
    new_text = change["new_text"]
    change_type = change["change_type"]

    if is_low_information_sentence(old_text) and is_low_information_sentence(
        new_text
    ):
        return True

    if change_type == "modified":
        if is_mostly_reporting_period_change(old_text, new_text):
            return True

    if not has_material_terms(old_text, new_text):
        if change_type == "modified":
            return True

        combined_text = f"{old_text or ''} {new_text or ''}"

        if len(combined_text.split()) < 20:
            return True

    return False


def build_explanation(
    change_type: str,
    old_text: str | None,
    new_text: str | None,
) -> str:
    if change_type == "added":
        return "This material language appears in the newer filing but not in the older filing."

    if change_type == "removed":
        return "This material language appeared in the older filing but is absent from the newer filing."

    if change_type == "modified":
        return (
            "The newer filing contains similar material language, but the wording "
            "or risk framing changed from the prior filing."
        )

    return "A material filing change was detected."


def compare_sentences(
    older_sentences: list[str],
    newer_sentences: list[str],
    section_name: str,
) -> list[dict]:
    detected_changes: list[dict] = []
    matched_new_sentences: set[str] = set()

    for old_sentence in older_sentences:
        best_match, similarity_score = find_best_match(
            old_sentence,
            newer_sentences,
        )

        if best_match is None:
            detected_changes.append(
                {
                    "change_type": "removed",
                    "section_name": section_name,
                    "old_text": old_sentence,
                    "new_text": None,
                }
            )
            continue

        if similarity_score >= 0.98:
            matched_new_sentences.add(best_match)
            continue

        if similarity_score >= SIMILARITY_THRESHOLD:
            matched_new_sentences.add(best_match)

            detected_changes.append(
                {
                    "change_type": "modified",
                    "section_name": section_name,
                    "old_text": old_sentence,
                    "new_text": best_match,
                }
            )
            continue

        detected_changes.append(
            {
                "change_type": "removed",
                "section_name": section_name,
                "old_text": old_sentence,
                "new_text": None,
            }
        )

    for new_sentence in newer_sentences:
        if new_sentence not in matched_new_sentences:
            detected_changes.append(
                {
                    "change_type": "added",
                    "section_name": section_name,
                    "old_text": None,
                    "new_text": new_sentence,
                }
            )

    return detected_changes


def change_priority_score(change: dict) -> int:
    importance = determine_importance(
        change["change_type"],
        change["old_text"],
        change["new_text"],
    )

    if importance == "high":
        return 3

    if importance == "medium":
        return 2

    return 1


def filter_meaningful_changes(changes: list[dict]) -> list[dict]:
    filtered_changes = [
        change
        for change in changes
        if not is_noise_change(change)
    ]

    sorted_changes = sorted(
        filtered_changes,
        key=change_priority_score,
        reverse=True,
    )

    return sorted_changes[:MAX_SAVED_CHANGES]


def get_two_newest_matching_filings(
    db: Session,
    ticker: str,
) -> tuple[Document, Document] | None:
    normalized_ticker = ticker.strip().upper()

    documents = (
        db.query(Document)
        .filter(
            Document.ticker == normalized_ticker,
            Document.filing_date.isnot(None),
        )
        .order_by(
            Document.filing_date.desc(),
            Document.created_at.desc(),
        )
        .all()
    )

    if len(documents) < 2:
        return None

    newest_document = documents[0]

    older_document = next(
        (
            document
            for document in documents[1:]
            if document.document_type == newest_document.document_type
        ),
        None,
    )

    if older_document is None:
        return None

    return older_document, newest_document


def get_sections_for_document(
    db: Session,
    document_id: int,
) -> list[FilingSection]:
    return (
        db.query(FilingSection)
        .filter(FilingSection.document_id == document_id)
        .order_by(FilingSection.section_order.asc())
        .all()
    )


def compare_matching_sections(
    db: Session,
    older_document: Document,
    newer_document: Document,
) -> list[dict]:
    older_sections = get_sections_for_document(
        db=db,
        document_id=older_document.id,
    )

    newer_sections = get_sections_for_document(
        db=db,
        document_id=newer_document.id,
    )

    if not older_sections or not newer_sections:
        return []

    newer_sections_by_name = {
        section.section_name: section
        for section in newer_sections
    }

    detected_changes: list[dict] = []

    for older_section in older_sections:
        matching_newer_section = newer_sections_by_name.get(
            older_section.section_name
        )

        if matching_newer_section is None:
            continue

        older_sentences = limit_sentences(
            split_into_sentences(older_section.text),
            MAX_SENTENCES_PER_SECTION,
        )

        newer_sentences = limit_sentences(
            split_into_sentences(matching_newer_section.text),
            MAX_SENTENCES_PER_SECTION,
        )

        section_changes = compare_sentences(
            older_sentences=older_sentences,
            newer_sentences=newer_sentences,
            section_name=older_section.section_name,
        )

        detected_changes.extend(section_changes)

    return detected_changes


def compare_full_documents(
    older_document: Document,
    newer_document: Document,
) -> list[dict]:
    older_sentences = limit_sentences(
        split_into_sentences(older_document.raw_text),
        MAX_FULL_DOCUMENT_SENTENCES,
    )

    newer_sentences = limit_sentences(
        split_into_sentences(newer_document.raw_text),
        MAX_FULL_DOCUMENT_SENTENCES,
    )

    return compare_sentences(
        older_sentences=older_sentences,
        newer_sentences=newer_sentences,
        section_name="Document text",
    )


def create_comparison(db: Session, ticker: str) -> Comparison | None:
    matching_documents = get_two_newest_matching_filings(db, ticker)

    if matching_documents is None:
        return None

    older_document, newer_document = matching_documents

    existing_comparison = (
        db.query(Comparison)
        .options(joinedload(Comparison.changes))
        .filter(
            Comparison.older_document_id == older_document.id,
            Comparison.newer_document_id == newer_document.id,
        )
        .first()
    )

    if existing_comparison is not None:
        return existing_comparison

    raw_changes = compare_matching_sections(
        db=db,
        older_document=older_document,
        newer_document=newer_document,
    )

    comparison_method = "section-based"

    if not raw_changes:
        raw_changes = compare_full_documents(
            older_document=older_document,
            newer_document=newer_document,
        )

        comparison_method = "full-document"

    changes = filter_meaningful_changes(raw_changes)

    comparison = Comparison(
        ticker=ticker.strip().upper(),
        older_document_id=older_document.id,
        newer_document_id=newer_document.id,
        summary=(
            f"Detected {len(changes)} meaningful {comparison_method} changes "
            f"between {older_document.reporting_period or older_document.title} "
            f"and {newer_document.reporting_period or newer_document.title}."
        ),
        overall_risk_direction=(
            "increased"
            if any(
                determine_importance(
                    change["change_type"],
                    change["old_text"],
                    change["new_text"],
                )
                == "high"
                for change in changes
            )
            else "stable"
        ),
        status="completed",
    )

    db.add(comparison)
    db.flush()

    comparison_changes = []

    for change in changes:
        comparison_changes.append(
            ComparisonChange(
                comparison_id=comparison.id,
                change_type=change["change_type"],
                section_name=change["section_name"],
                old_text=change["old_text"],
                new_text=change["new_text"],
                importance=determine_importance(
                    change["change_type"],
                    change["old_text"],
                    change["new_text"],
                ),
                explanation=build_explanation(
                    change["change_type"],
                    change["old_text"],
                    change["new_text"],
                ),
            )
        )

    db.add_all(comparison_changes)
    db.commit()

    return (
        db.query(Comparison)
        .options(joinedload(Comparison.changes))
        .filter(Comparison.id == comparison.id)
        .first()
    )


def get_comparisons(db: Session) -> list[Comparison]:
    return (
        db.query(Comparison)
        .options(joinedload(Comparison.changes))
        .order_by(Comparison.created_at.desc())
        .all()
    )


def get_comparison_by_id(
    db: Session,
    comparison_id: int,
) -> Comparison | None:
    return (
        db.query(Comparison)
        .options(joinedload(Comparison.changes))
        .filter(Comparison.id == comparison_id)
        .first()
    )