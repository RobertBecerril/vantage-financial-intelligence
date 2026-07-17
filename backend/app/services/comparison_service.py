from difflib import SequenceMatcher
from typing import Iterable

from sqlalchemy.orm import Session, joinedload

from app.models.comparison import Comparison
from app.models.comparison_change import ComparisonChange
from app.models.document import Document


SIMILARITY_THRESHOLD = 0.72


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


def determine_importance(
    change_type: str,
    old_text: str | None,
    new_text: str | None,
) -> str:
    combined_text = f"{old_text or ''} {new_text or ''}".lower()

    high_priority_terms = [
        "regulatory",
        "investigation",
        "lawsuit",
        "compliance",
        "material",
        "adversely affected",
        "increased costs",
        "supply constraint",
        "cybersecurity",
        "restructuring",
    ]

    if any(term in combined_text for term in high_priority_terms):
        return "high"

    if change_type == "modified":
        return "medium"

    return "low"


def build_explanation(
    change_type: str,
    old_text: str | None,
    new_text: str | None,
) -> str:
    if change_type == "added":
        return "This language appears in the newer filing but not in the older filing."

    if change_type == "removed":
        return "This language appeared in the older filing but is absent from the newer filing."

    if change_type == "modified":
        return (
            "The newer filing contains similar language, but the wording or "
            "severity changed from the prior filing."
        )

    return "A filing change was detected."


def compare_sentences(
    older_sentences: list[str],
    newer_sentences: list[str],
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
                    "section_name": "Document text",
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
                    "section_name": "Document text",
                    "old_text": old_sentence,
                    "new_text": best_match,
                }
            )
            continue

        detected_changes.append(
            {
                "change_type": "removed",
                "section_name": "Document text",
                "old_text": old_sentence,
                "new_text": None,
            }
        )

    for new_sentence in newer_sentences:
        if new_sentence not in matched_new_sentences:
            detected_changes.append(
                {
                    "change_type": "added",
                    "section_name": "Document text",
                    "old_text": None,
                    "new_text": new_sentence,
                }
            )

    return detected_changes


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

    older_sentences = split_into_sentences(older_document.raw_text)
    newer_sentences = split_into_sentences(newer_document.raw_text)

    changes = compare_sentences(
        older_sentences,
        newer_sentences,
    )

    comparison = Comparison(
        ticker=ticker.strip().upper(),
        older_document_id=older_document.id,
        newer_document_id=newer_document.id,
        summary=(
            f"Detected {len(changes)} language changes between "
            f"{older_document.reporting_period or older_document.title} and "
            f"{newer_document.reporting_period or newer_document.title}."
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