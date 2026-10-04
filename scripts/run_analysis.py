from __future__ import annotations

import json

from backend.services.site_suitability import DEFAULT_WEIGHTS, calculate_site_suitability, validate_weights

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


def main() -> None:
    weights = validate_weights(DEFAULT_WEIGHTS)
    results = calculate_site_suitability(SAMPLE_WARDS, weights)
    print(json.dumps({"weights": weights, "results": results}, indent=2))


if __name__ == "__main__":
    main()
