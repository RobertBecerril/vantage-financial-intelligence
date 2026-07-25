import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy.orm import Session, joinedload

from app.models.chunk import Chunk
from app.models.comparison import Comparison
from app.models.comparison_change import ComparisonChange
from app.models.report import Report

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CACHE_DURATION_HOURS = 24
MAX_COMPARISON_CHANGES = 12
MAX_FALLBACK_CHUNKS = 6


def get_recent_cached_report(db: Session, ticker: str):
    cache_cutoff = datetime.utcnow() - timedelta(
        hours=CACHE_DURATION_HOURS
    )

    return (
        db.query(Report)
        .filter(
            Report.ticker == ticker.upper(),
            Report.title == f"{ticker.upper()} AI Intelligence Report",
            Report.created_at >= cache_cutoff,
        )
        .order_by(Report.created_at.desc())
        .first()
    )


def get_latest_comparison(db: Session, ticker: str):
    return (
        db.query(Comparison)
        .options(joinedload(Comparison.changes))
        .filter(Comparison.ticker == ticker.upper())
        .order_by(Comparison.created_at.desc())
        .first()
    )


def get_context_for_ticker(db: Session, ticker: str):
    return (
        db.query(Chunk)
        .filter(Chunk.ticker == ticker.upper())
        .order_by(Chunk.document_id.asc(), Chunk.chunk_index.asc())
        .limit(MAX_FALLBACK_CHUNKS)
        .all()
    )


def change_importance_score(change: ComparisonChange) -> int:
    if change.importance == "high":
        return 3

    if change.importance == "medium":
        return 2

    return 1


def truncate_text(text: str | None, max_chars: int = 900) -> str:
    if not text:
        return "[No text]"

    cleaned = " ".join(text.split())

    if len(cleaned) <= max_chars:
        return cleaned

    return cleaned[:max_chars] + "..."


def build_comparison_evidence(comparison: Comparison) -> str:
    changes = sorted(
        comparison.changes,
        key=change_importance_score,
        reverse=True,
    )[:MAX_COMPARISON_CHANGES]

    evidence_blocks = []

    for index, change in enumerate(changes, start=1):
        evidence_blocks.append(
            f"Change {index}\n"
            f"Section: {change.section_name}\n"
            f"Change type: {change.change_type}\n"
            f"Importance: {change.importance}\n"
            f"Classifier explanation: {change.explanation}\n"
            f"Older filing text: {truncate_text(change.old_text)}\n"
            f"Newer filing text: {truncate_text(change.new_text)}"
        )

    return "\n\n".join(evidence_blocks)


def build_chunk_evidence(chunks):
    context_blocks = []

    for chunk in chunks:
        context_blocks.append(
            f"Chunk {chunk.id} | "
            f"Document {chunk.document_id} | "
            f"Ticker {chunk.ticker}:\n"
            f"{chunk.text}"
        )

    return "\n\n".join(context_blocks)


def create_openai_report(
    ticker: str,
    evidence_text: str,
    evidence_source: str,
):
    prompt = f"""
You are a financial intelligence analyst.

Generate a concise financial intelligence report using ONLY the supplied evidence.

Rules:
- Do not invent facts, numbers, or events.
- Clearly state when evidence is limited.
- Base every conclusion on the supplied evidence.
- Do not provide personalized investment advice.
- Focus on material business changes, risk direction, legal/regulatory exposure, liquidity, operations, and management discussion.
- If confidence or uncertainty is included in the evidence, reflect it honestly.

Ticker: {ticker}

Evidence source:
{evidence_source}

Evidence:
{evidence_text}

Return the report in this exact structure:

Detected Signal:
[1-2 sentences]

Why It Matters:
[2-3 sentences]

Key Evidence:
- [specific supporting evidence]
- [specific supporting evidence]
- [specific supporting evidence]

Risk Direction:
[Increased, Decreased, Stable, or Unclear]

Confidence:
[Low, Medium, or High, with one short reason]

Uncertainty:
[What limits the conclusion, or "No major uncertainty based on supplied evidence."]

Executive Summary:
[short paragraph]
"""

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
        max_output_tokens=800,
    )

    return response.output_text


def generate_ai_report(db: Session, ticker: str):
    ticker = ticker.strip().upper()

    cached_report = get_recent_cached_report(db, ticker)

    if cached_report:
        return cached_report

    latest_comparison = get_latest_comparison(db, ticker)

    if latest_comparison and latest_comparison.changes:
        evidence_text = build_comparison_evidence(latest_comparison)
        evidence_source = (
            "AI-filtered SEC filing comparison changes, ranked by importance."
        )
    else:
        chunks = get_context_for_ticker(db, ticker)

        if not chunks:
            return None

        evidence_text = build_chunk_evidence(chunks)
        evidence_source = (
            "Fallback document chunks. No filing comparison changes were found."
        )

    ai_text = create_openai_report(
        ticker=ticker,
        evidence_text=evidence_text,
        evidence_source=evidence_source,
    )

    new_report = Report(
        ticker=ticker,
        title=f"{ticker} AI Intelligence Report",
        summary=ai_text,
        confidence_score="AI-generated",
        evidence=evidence_text[:1000],
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return new_report