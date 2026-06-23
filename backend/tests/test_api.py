from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Vantage API is running",
        "status": "healthy",
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


def test_get_documents():
    response = client.get("/api/documents")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


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