from fastapi import APIRouter

from backend.services.site_suitability import DEFAULT_WEIGHTS, calculate_site_suitability, validate_weights

router = APIRouter(prefix="/api/v1")

SAMPLE_WARDS = [
    {
        "ward_id": "W-101",
        "population": 62000,
        "population_density": 12600,
        "distance_to_hospital_km": 3.8,
        "population_score": 0.90,
        "hospital_gap_score": 0.88,
        "road_accessibility": 0.82,
        "metro_accessibility": 0.73,
        "environmental_score": 0.66,
    },
    {
        "ward_id": "W-102",
        "population": 41000,
        "population_density": 9200,
        "distance_to_hospital_km": 5.4,
        "population_score": 0.72,
        "hospital_gap_score": 0.70,
        "road_accessibility": 0.62,
        "metro_accessibility": 0.55,
        "environmental_score": 0.58,
    },
]


@router.get("/analysis/summary")
def summary() -> dict:
    return {
        "total_wards": len(SAMPLE_WARDS),
        "population": sum(item["population"] for item in SAMPLE_WARDS),
        "hospitals": 12,
        "schools": 58,
        "metro_stations": 18,
        "road_length_km": 420,
        "parks": 16,
    }


@router.post("/analysis/site-suitability")
def site_suitability(payload: dict | None = None) -> dict:
    supplied = payload or {}
    weights = validate_weights(supplied.get("weights", DEFAULT_WEIGHTS))
    results = calculate_site_suitability(SAMPLE_WARDS, weights)
    return {"weights": weights, "results": results}
