import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy.orm import Session

from app.models.chunk import Chunk
from app.models.report import Report

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CACHE_DURATION_HOURS = 24


def get_context_for_ticker(db: Session, ticker: str):
    return (
        db.query(Chunk)
        .filter(Chunk.ticker == ticker.upper())
        .order_by(Chunk.document_id.asc(), Chunk.chunk_index.asc())
        .limit(6)
        .all()
    )


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


def build_context_text(chunks):
    context_blocks = []

    for chunk in chunks:
        context_blocks.append(
            f"Chunk {chunk.id} | "
            f"Document {chunk.document_id} | "
            f"Ticker {chunk.ticker}:\n"
            f"{chunk.text}"
        )

    return "\n\n".join(context_blocks)


def create_openai_report(ticker: str, context_text: str):
    prompt = f"""
You are a financial intelligence analyst.

Generate a concise report using ONLY the supplied document evidence.

Rules:
- Do not invent facts or numbers.
- Clearly state when evidence is limited.
- Base every conclusion on the supplied chunks.
- Do not provide personalized investment advice.

Ticker: {ticker}

Document evidence:
{context_text}

Return the report in this exact structure:

Detected Signal:
[1-2 sentences]

Why It Matters:
[2-3 sentences]

Evidence:
- [specific supporting evidence]
- [specific supporting evidence]
- [specific supporting evidence]

Risk Level:
[Low, Medium, or High]

Confidence:
[percentage]

Executive Summary:
[short paragraph]
"""

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
        max_output_tokens=600,
    )

    return response.output_text


def generate_ai_report(db: Session, ticker: str):
    ticker = ticker.strip().upper()

    # Return an existing recent report instead of spending more API credits.
    cached_report = get_recent_cached_report(db, ticker)

    if cached_report:
        return cached_report

    chunks = get_context_for_ticker(db, ticker)

    if not chunks:
        return None

    context_text = build_context_text(chunks)
    ai_text = create_openai_report(ticker, context_text)

    new_report = Report(
        ticker=ticker,
        title=f"{ticker} AI Intelligence Report",
        summary=ai_text,
        confidence_score="AI-generated",
        evidence=context_text[:1000],
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return new_report