import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


DEFAULT_CLASSIFICATION = {
    "keep": True,
    "category": "uncertain",
    "importance": "medium",
    "risk_direction": "uncertain",
    "confidence": 0.5,
    "uncertainty_reason": (
        "The change could not be confidently classified, so it was kept for review."
    ),
    "reason": "The change may be relevant but needs more context.",
}


VALID_IMPORTANCE_VALUES = {"high", "medium", "low"}
VALID_RISK_DIRECTIONS = {"increased", "decreased", "neutral", "uncertain"}


def truncate_text(text: str | None, max_chars: int = 1400) -> str:
    if not text:
        return ""

    cleaned = " ".join(text.split())

    if len(cleaned) <= max_chars:
        return cleaned

    return cleaned[:max_chars] + "..."


def clamp_confidence(value) -> float:
    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return 0.5

    if confidence < 0:
        return 0.0

    if confidence > 1:
        return 1.0

    return confidence


def parse_ai_json(output_text: str) -> dict:
    try:
        parsed = json.loads(output_text)
    except json.JSONDecodeError:
        return DEFAULT_CLASSIFICATION.copy()

    if not isinstance(parsed, dict):
        return DEFAULT_CLASSIFICATION.copy()

    importance = str(parsed.get("importance", "medium")).lower()
    risk_direction = str(parsed.get("risk_direction", "uncertain")).lower()

    if importance not in VALID_IMPORTANCE_VALUES:
        importance = "medium"

    if risk_direction not in VALID_RISK_DIRECTIONS:
        risk_direction = "uncertain"

    return {
        "keep": bool(parsed.get("keep", True)),
        "category": str(parsed.get("category", "uncertain")),
        "importance": importance,
        "risk_direction": risk_direction,
        "confidence": clamp_confidence(parsed.get("confidence", 0.5)),
        "uncertainty_reason": str(
            parsed.get(
                "uncertainty_reason",
                "No uncertainty explanation was provided.",
            )
        ),
        "reason": str(
            parsed.get(
                "reason",
                "No explanation was provided by the classifier.",
            )
        ),
    }


def classify_change_materiality(
    ticker: str,
    section_name: str,
    change_type: str,
    old_text: str | None,
    new_text: str | None,
) -> dict:
    old_text_clean = truncate_text(old_text)
    new_text_clean = truncate_text(new_text)

    prompt = f"""
You are a financial filing materiality classifier.

Your job is to classify whether a detected SEC filing change is useful for a financial intelligence system.

Ticker: {ticker}
Section: {section_name}
Change type: {change_type}

Older filing text:
{old_text_clean if old_text_clean else "[No older text]"}

Newer filing text:
{new_text_clean if new_text_clean else "[No newer text]"}

Classify this change.

Rules:
- Keep changes that may affect business risk, revenue, liquidity, profitability, debt, legal exposure, cybersecurity, regulation, operations, competition, macroeconomic exposure, or management discussion.
- Discard glossary definitions, abbreviation lists, table-of-contents text, formatting artifacts, repeated boilerplate, generic legal language, and reporting-period-only changes.
- Do not overrate a change just because it contains words like SEC, FDIC, risk, loan, credit, regulation, market, tax, cost, or revenue.
- If the change is only defining a term, classify it as glossary and set keep to false.
- If the change is mostly about dates, quarters, fiscal years, or filing periods with no business meaning, classify it as reporting_period_only and set keep to false.
- If the text is too fragmented to confidently judge, set category to uncertain, confidence below 0.65, and explain the uncertainty.
- If uncertain but potentially useful, keep it with medium or low importance.
- Risk direction means whether the newer filing suggests risk increased, decreased, stayed neutral, or cannot be determined.

Return ONLY valid JSON in this exact structure:
{{
  "keep": true,
  "category": "material_risk_change | financial_performance | liquidity_or_capital | legal_or_regulatory | cybersecurity | operations | macroeconomic | competition | management_discussion | boilerplate | glossary | formatting_artifact | reporting_period_only | uncertain",
  "importance": "high | medium | low",
  "risk_direction": "increased | decreased | neutral | uncertain",
  "confidence": 0.0,
  "uncertainty_reason": "One short sentence explaining what limits confidence, or say 'No major uncertainty.'",
  "reason": "One short sentence explaining the classification."
}}
"""

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
        max_output_tokens=300,
    )

    return parse_ai_json(response.output_text)