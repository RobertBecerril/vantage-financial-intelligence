from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.services.report_service import generate_mock_report, get_reports

router = APIRouter(prefix="/api", tags=["reports"])


@router.get("/reports", response_model=list[ReportResponse])
def read_reports(db: Session = Depends(get_db)):
    return get_reports(db)


@router.post("/reports/generate", response_model=ReportResponse)
def generate_report(
    request: ReportGenerateRequest,
    db: Session = Depends(get_db),
):
    return generate_mock_report(db, request.ticker)