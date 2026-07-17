import os
import re
from datetime import date
from typing import Any

import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from app.models.document import Document
from app.services.chunk_service import chunk_document


load_dotenv()

SEC_USER_AGENT = os.getenv("SEC_USER_AGENT", "").strip()

SEC_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json"
SEC_SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK{cik}.json"
SEC_ARCHIVES_URL = (
    "https://www.sec.gov/Archives/edgar/data/"
    "{cik}/{accession_without_dashes}/{primary_document}"
)


class SECServiceError(Exception):
    pass


def get_sec_headers() -> dict[str, str]:
    if not SEC_USER_AGENT:
        raise SECServiceError(
            "SEC_USER_AGENT is missing. Add it to backend/.env."
        )

    return {
        "User-Agent": SEC_USER_AGENT,
        "Accept-Encoding": "gzip, deflate",
        "Host": "www.sec.gov",
    }


def get_data_sec_headers() -> dict[str, str]:
    if not SEC_USER_AGENT:
        raise SECServiceError(
            "SEC_USER_AGENT is missing. Add it to backend/.env."
        )

    return {
        "User-Agent": SEC_USER_AGENT,
        "Accept-Encoding": "gzip, deflate",
        "Host": "data.sec.gov",
    }


def request_json(
    url: str,
    headers: dict[str, str],
) -> dict[str, Any]:
    try:
        with httpx.Client(
            headers=headers,
            timeout=30.0,
            follow_redirects=True,
        ) as client:
            response = client.get(url)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as error:
        raise SECServiceError(
            f"SEC request failed with status "
            f"{error.response.status_code}."
        ) from error

    except httpx.RequestError as error:
        raise SECServiceError(
            "Unable to connect to the SEC."
        ) from error

    except ValueError as error:
        raise SECServiceError(
            "The SEC returned invalid JSON."
        ) from error


def request_html(url: str) -> str:
    try:
        with httpx.Client(
            headers=get_sec_headers(),
            timeout=60.0,
            follow_redirects=True,
        ) as client:
            response = client.get(url)
            response.raise_for_status()
            return response.text

    except httpx.HTTPStatusError as error:
        raise SECServiceError(
            f"Unable to download SEC filing. "
            f"Status {error.response.status_code}."
        ) from error

    except httpx.RequestError as error:
        raise SECServiceError(
            "Unable to connect to the SEC filing archive."
        ) from error


def normalize_ticker(ticker: str) -> str:
    cleaned_ticker = ticker.strip().upper()

    if not re.fullmatch(r"[A-Z0-9.-]{1,10}", cleaned_ticker):
        raise SECServiceError(
            "Ticker must contain only letters, numbers, periods, or hyphens."
        )

    return cleaned_ticker


def resolve_ticker_to_cik(ticker: str) -> str:
    normalized_ticker = normalize_ticker(ticker)

    ticker_data = request_json(
        SEC_TICKERS_URL,
        get_sec_headers(),
    )

    for company in ticker_data.values():
        company_ticker = str(company.get("ticker", "")).upper()

        if company_ticker == normalized_ticker:
            cik_value = int(company["cik_str"])
            return str(cik_value).zfill(10)

    raise SECServiceError(
        f"No SEC CIK was found for ticker {normalized_ticker}."
    )


def get_recent_filings(
    ticker: str,
    form_type: str,
    limit: int,
) -> tuple[str, list[dict[str, str]]]:
    normalized_ticker = normalize_ticker(ticker)
    cleaned_form_type = form_type.strip().upper()

    if cleaned_form_type not in {"10-Q", "10-K"}:
        raise SECServiceError(
            "Only 10-Q and 10-K filings are supported."
        )

    if limit < 1 or limit > 5:
        raise SECServiceError(
            "Limit must be between 1 and 5."
        )

    cik = resolve_ticker_to_cik(normalized_ticker)

    submissions_url = SEC_SUBMISSIONS_URL.format(cik=cik)

    submissions = request_json(
        submissions_url,
        get_data_sec_headers(),
    )

    recent = submissions.get("filings", {}).get("recent", {})

    forms = recent.get("form", [])
    accession_numbers = recent.get("accessionNumber", [])
    filing_dates = recent.get("filingDate", [])
    reporting_dates = recent.get("reportDate", [])
    primary_documents = recent.get("primaryDocument", [])

    filings: list[dict[str, str]] = []

    for index, filing_form in enumerate(forms):
        if filing_form != cleaned_form_type:
            continue

        filings.append(
            {
                "ticker": normalized_ticker,
                "cik": cik,
                "form_type": filing_form,
                "accession_number": accession_numbers[index],
                "filing_date": filing_dates[index],
                "reporting_period": reporting_dates[index],
                "primary_document": primary_documents[index],
            }
        )

        if len(filings) >= limit:
            break

    if not filings:
        raise SECServiceError(
            f"No recent {cleaned_form_type} filings were found "
            f"for {normalized_ticker}."
        )

    return cik, filings


def build_filing_url(
    cik: str,
    accession_number: str,
    primary_document: str,
) -> str:
    accession_without_dashes = accession_number.replace("-", "")
    cik_without_leading_zeroes = str(int(cik))

    return SEC_ARCHIVES_URL.format(
        cik=cik_without_leading_zeroes,
        accession_without_dashes=accession_without_dashes,
        primary_document=primary_document,
    )


def clean_filing_html(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")

    for element in soup(
        [
            "script",
            "style",
            "noscript",
            "svg",
            "img",
            "button",
            "input",
        ]
    ):
        element.decompose()

    text = soup.get_text(separator="\n")

    cleaned_lines: list[str] = []

    for line in text.splitlines():
        cleaned_line = " ".join(line.split())

        if cleaned_line:
            cleaned_lines.append(cleaned_line)

    cleaned_text = "\n".join(cleaned_lines)

    if len(cleaned_text) < 500:
        raise SECServiceError(
            "The downloaded filing did not contain enough readable text."
        )

    return cleaned_text


def document_exists(
    db: Session,
    accession_number: str,
) -> bool:
    return (
        db.query(Document)
        .filter(Document.accession_number == accession_number)
        .first()
        is not None
    )


def chunk_created_documents(
    db: Session,
    documents: list[Document],
) -> int:
    created_chunk_count = 0

    for document in documents:
        chunks = chunk_document(db, document.id)

        if chunks is not None:
            created_chunk_count += len(chunks)

    return created_chunk_count


def ingest_recent_filings(
    db: Session,
    ticker: str,
    form_type: str = "10-Q",
    limit: int = 2,
) -> dict[str, Any]:
    normalized_ticker = normalize_ticker(ticker)

    cik, filings = get_recent_filings(
        ticker=normalized_ticker,
        form_type=form_type,
        limit=limit,
    )

    created_documents: list[Document] = []
    skipped_accession_numbers: list[str] = []

    try:
        for filing in filings:
            accession_number = filing["accession_number"]

            if document_exists(db, accession_number):
                skipped_accession_numbers.append(accession_number)
                continue

            filing_url = build_filing_url(
                cik=cik,
                accession_number=accession_number,
                primary_document=filing["primary_document"],
            )

            filing_html = request_html(filing_url)
            filing_text = clean_filing_html(filing_html)

            filing_date_value = date.fromisoformat(
                filing["filing_date"]
            )

            reporting_period_value = (
                filing["reporting_period"]
                or filing["filing_date"]
            )

            document = Document(
                ticker=normalized_ticker,
                document_type=filing["form_type"],
                title=(
                    f"{normalized_ticker} "
                    f"{filing['form_type']} "
                    f"filed {filing['filing_date']}"
                ),
                source_url=filing_url,
                raw_text=filing_text,
                filing_date=filing_date_value,
                reporting_period=reporting_period_value,
                accession_number=accession_number,
                status="stored",
            )

            db.add(document)
            created_documents.append(document)

        db.commit()

        for document in created_documents:
            db.refresh(document)

        created_chunk_count = chunk_created_documents(
            db=db,
            documents=created_documents,
        )

    except Exception:
        db.rollback()
        raise

    return {
        "ticker": normalized_ticker,
        "form_type": form_type.strip().upper(),
        "requested": limit,
        "created": len(created_documents),
        "skipped": len(skipped_accession_numbers),
        "created_document_ids": [
            document.id
            for document in created_documents
        ],
        "skipped_accession_numbers": skipped_accession_numbers,
        "created_chunk_count": created_chunk_count,
    }