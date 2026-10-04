from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_site_suitability_endpoint():
    response = client.post(
        "/api/v1/analysis/site-suitability",
        json={
            "weights": {
                "population_demand": 0.30,
                "hospital_gap": 0.25,
                "road_accessibility": 0.20,
                "metro_accessibility": 0.15,
                "environmental_factor": 0.10,
            }
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert "results" in payload
    assert payload["results"][0]["final_score"] >= payload["results"][-1]["final_score"]
