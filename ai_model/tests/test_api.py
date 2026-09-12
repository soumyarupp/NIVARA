import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from api import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "NIVARA AI Model"
    print("✓ /health passed")


def test_predict_standard_payload():
    payload = {
        "project_id": "PRJ001",
        "report_date": "2026-07-01",
        "state": "West Bengal",
        "sector": "Road",
        "agency": "Example Agency",
        "original_cost": 40,
        "revised_cost": 42,
        "physical_progress": 58,
        "financial_progress": 62,
        "cumulative_expenditure": 26,
        "monthly_progress_history": [4, 4, 4, 4, 4, 3],
        "monthly_expenditure_history": [2, 2.5, 2.5, 2, 2.5, 2.5],
        "original_completion_date": "2026-12-31",
        "delay_months": 0
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["project_id"] == "PRJ001"
    assert "predicted_remaining_months" in data
    assert "predicted_completion_date" in data
    assert "expected_delay_months" in data
    assert "predicted_final_expenditure" in data
    assert "expected_additional_expenditure" in data
    assert "expected_cost_overrun" in data
    assert "risk_score" in data
    assert "risk_level" in data
    assert "warnings" in data
    assert isinstance(data["warnings"], list)
    assert data["risk_level"] in ["Low", "Medium", "High", "Critical"]
    print("✓ /predict passed with response:", json.dumps(data, indent=2)[:400], "...\n")


def test_predict_backend_compatibility():
    """Test compatibility with payload from backend/src/services/ai.service.js"""
    payload = {
        "project_id": "612786",
        "original_cost_crore": 255.69,
        "revised_cost_crore": 255.69,
        "cumulative_expenditure_crore": 161.06,
        "physical_progress_pct": 63.0,
        "expenditure_ratio": 0.63,
        "cost_change_ratio": 0.0,
        "schedule_delay_months": 3.0,
        "month_num": 7,
        "agency": "Airport Authority of India [AAI]",
        "state": "Andhra Pradesh"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "risk" in data
    assert "3_month" in data["risk"]
    assert "decision" in data
    assert "next_action" in data
    assert "shap_factors" in data
    print("✓ /predict backend compatibility passed")


def test_project_history():
    payload = {
        "project_id": "400005",
        "months": 3,
        "records": []
    }
    response = client.post("/project-history", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == "400005"
    assert "last_3_months" in data
    assert "summary" in data
    print("✓ /project-history passed")


def test_classify_delay():
    payload = {"text": "Work delayed due to land acquisition problem and pending compensation."}
    response = client.post("/classify-delay", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Land Acquisition"
    assert data["confidence"] > 0
    print("✓ /classify-delay passed with category:", data["category"])


def test_simulate_delay():
    payload = {
        "project_id": "PRJ001",
        "additional_delay_months": 3,
        "current_prediction": {
            "predicted_completion_date": "2027-01-28",
            "predicted_final_expenditure": 44.8,
            "current_expenditure": 26.0,
            "original_cost": 40.0,
            "last_3_months": [
                {"monthly_expenditure": 2.5},
                {"monthly_expenditure": 2.5},
                {"monthly_expenditure": 2.0}
            ]
        }
    }
    response = client.post("/simulate-delay", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "new_predicted_completion_date" in data
    assert "estimated_additional_expenditure" in data
    assert "new_expected_final_expenditure" in data
    print("✓ /simulate-delay passed")


def test_get_projects():
    response = client.get("/projects?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] > 0
    assert len(data["projects"]) == 5
    print("✓ /projects list passed with total count:", data["total_count"])


if __name__ == "__main__":
    print("Running test suite...")
    test_health_endpoint()
    test_predict_standard_payload()
    test_predict_backend_compatibility()
    test_project_history()
    test_classify_delay()
    test_simulate_delay()
    test_get_projects()
    print("\nALL AUTOMATED TESTS PASSED SUCCESSFULLY!")
