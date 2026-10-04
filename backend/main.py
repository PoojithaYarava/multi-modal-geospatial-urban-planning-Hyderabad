from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.services.site_suitability import DEFAULT_WEIGHTS, calculate_site_suitability, validate_weights

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Decision-support platform for geospatial planning and hospital site suitability in Hyderabad.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

sample_wards = [
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
    {
        "ward_id": "W-103",
        "population": 21000,
        "population_density": 4800,
        "distance_to_hospital_km": 8.8,
        "population_score": 0.35,
        "hospital_gap_score": 0.32,
        "road_accessibility": 0.48,
        "metro_accessibility": 0.43,
        "environmental_score": 0.67,
    },
]


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.get("/api/v1/data/status")
def data_status() -> dict[str, object]:
    return {
        "status": "ready",
        "data_sources": ["TGRAC", "OpenStreetMap", "GTFS", "Census"],
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/v1/wards")
def get_wards() -> dict[str, object]:
    return {"items": sample_wards, "count": len(sample_wards)}


@app.get("/api/v1/roads")
def get_roads() -> dict[str, object]:
    return {"items": [], "count": 0, "note": "Road data is loaded via ingestion pipelines when available."}


@app.get("/api/v1/hospitals")
def get_hospitals() -> dict[str, object]:
    return {"items": [], "count": 0, "note": "Hospital locations are ingested from OSM or official sources."}


@app.get("/api/v1/analysis/summary")
def analysis_summary() -> dict[str, object]:
    return {
        "total_wards": len(sample_wards),
        "population": sum(item["population"] for item in sample_wards),
        "hospitals": 0,
        "schools": 0,
        "metro_stations": 0,
        "road_length_km": 0,
        "parks": 0,
    }


@app.post("/api/v1/analysis/site-suitability")
def site_suitability(payload: dict | None = None) -> dict[str, object]:
    wards = sample_wards
    supplied = payload or {}
    requested_weights = supplied.get("weights") or DEFAULT_WEIGHTS
    validated = validate_weights(requested_weights)
    ranked = calculate_site_suitability(wards, validated)
    return {
        "weights": validated,
        "results": ranked,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/v1/analysis/results/{result_id}")
def get_results(result_id: str) -> dict[str, object]:
    ranked = calculate_site_suitability(sample_wards)
    for result in ranked:
        if result["ward_id"] == result_id:
            return {"result": result}
    return {"result": None, "message": "Result not found"}
