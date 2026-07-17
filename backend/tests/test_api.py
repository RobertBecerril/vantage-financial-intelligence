from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Vantage API is running",
        "status": "healthy",
        "version": "1.5.0",
    }


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
    }


def test_api_status_endpoint():
    response = client.get("/api/status")

    assert response.status_code == 200

    data = response.json()

    assert data["app"] == "Vantage"
    assert data["backend"] == "FastAPI"
    assert data["status"] == "connected"
    assert data["version"] == "1.5.0"


def test_get_documents():
    response = client.get("/api/documents")

    assert response.status_code == 200

    documents = response.json()

    assert isinstance(documents, list)
    assert len(documents) >= 2


def test_documents_include_filing_metadata():
    response = client.get("/api/documents")

    assert response.status_code == 200

    documents = response.json()

    aapl_documents = [
        document
        for document in documents
        if document["ticker"] == "AAPL"
    ]

    assert len(aapl_documents) >= 2

    for document in aapl_documents:
        assert "filing_date" in document
        assert "reporting_period" in document
        assert "accession_number" in document


def test_get_reports():
    response = client.get("/api/reports")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_invalid_ticker_is_rejected():
    response = client.post("/api/ai/reports/AAPL!!!")

    assert response.status_code == 422
    assert "Ticker must contain" in response.json()["detail"]


def test_missing_ticker_data_returns_404():
    response = client.post("/api/ai/reports/ZZZZZZZZZZ")

    assert response.status_code == 404
    assert "No document chunks were found" in response.json()["detail"]


def test_generate_comparison():
    response = client.post("/api/comparisons/AAPL")

    assert response.status_code == 201

    comparison = response.json()

    assert comparison["ticker"] == "AAPL"
    assert comparison["older_document_id"] != comparison["newer_document_id"]
    assert comparison["status"] == "completed"
    assert isinstance(comparison["changes"], list)
    assert len(comparison["changes"]) > 0


def test_comparison_contains_detected_change_types():
    response = client.post("/api/comparisons/AAPL")

    assert response.status_code == 201

    comparison = response.json()

    change_types = {
        change["change_type"]
        for change in comparison["changes"]
    }

    assert change_types
    assert change_types.issubset(
        {
            "added",
            "removed",
            "modified",
        }
    )


def test_get_comparisons():
    client.post("/api/comparisons/AAPL")

    response = client.get("/api/comparisons")

    assert response.status_code == 200

    comparisons = response.json()

    assert isinstance(comparisons, list)
    assert len(comparisons) > 0


def test_get_comparison_by_id():
    create_response = client.post("/api/comparisons/AAPL")

    assert create_response.status_code == 201

    comparison_id = create_response.json()["id"]

    response = client.get(
        f"/api/comparisons/{comparison_id}"
    )

    assert response.status_code == 200

    comparison = response.json()

    assert comparison["id"] == comparison_id
    assert comparison["ticker"] == "AAPL"
    assert isinstance(comparison["changes"], list)


def test_missing_comparison_returns_404():
    response = client.get("/api/comparisons/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Comparison not found."


def test_comparison_requires_two_matching_filings():
    response = client.post("/api/comparisons/ONLYONE")

    assert response.status_code == 404
    assert (
        "At least two filings of the same document type"
        in response.json()["detail"]
    )