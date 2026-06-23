from sqlalchemy.orm import Session

from app.models.report import Report
from app.schemas.report import ReportCreate


def seed_reports(db: Session):
    existing_reports = db.query(Report).count()

    if existing_reports > 0:
        return

    starter_reports = [
        Report(
            ticker="NVDA",
            title="NVDA Intelligence Report",
            summary="Vantage detected a high-impact signal related to stronger data center guidance and enterprise AI demand.",
            confidence_score="87%",
            evidence="Q2 Earnings Transcript; Prior quarter comparison; Analyst context note",
        ),
        Report(
            ticker="AAPL",
            title="AAPL Filing Risk Report",
            summary="Vantage detected new regulatory risk language in Apple's latest quarterly filing.",
            confidence_score="78%",
            evidence="Latest 10-Q Filing; Prior 10-Q comparison; Risk factor section",
        ),
    ]

    db.add_all(starter_reports)
    db.commit()


def get_reports(db: Session):
    return db.query(Report).order_by(Report.created_at.desc()).all()


def create_report(db: Session, report_data: ReportCreate):
    new_report = Report(
        ticker=report_data.ticker.upper(),
        title=report_data.title,
        summary=report_data.summary,
        confidence_score=report_data.confidence_score,
        evidence=report_data.evidence,
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return new_report


def generate_mock_report(db: Session, ticker: str):
    ticker = ticker.upper()

    report_data = ReportCreate(
        ticker=ticker,
        title=f"{ticker} Intelligence Report",
        summary=(
            f"Vantage generated a mock intelligence report for {ticker}. "
            "In the future, this will use retrieved SEC filings, earnings calls, "
            "and RAG-based evidence to produce a citation-backed report."
        ),
        confidence_score="84%",
        evidence="Mock SEC filing context; Mock earnings transcript; Mock event signal",
    )

    return create_report(db, report_data)