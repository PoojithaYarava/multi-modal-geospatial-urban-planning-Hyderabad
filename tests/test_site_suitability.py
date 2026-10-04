from backend.services.site_suitability import calculate_site_suitability, validate_weights


def test_validate_weights_accepts_valid_distribution():
    params = {
        "population_demand": 0.30,
        "hospital_gap": 0.25,
        "road_accessibility": 0.20,
        "metro_accessibility": 0.15,
        "environmental_factor": 0.10,
    }
    validated = validate_weights(params)
    assert validated["population_demand"] == 0.30
    assert abs(sum(validated.values()) - 1.0) < 1e-9


def test_calculate_site_suitability_ranks_areas():
    wards = [
        {
            "ward_id": "W-101",
            "population": 60000,
            "population_density": 12500,
            "distance_to_hospital_km": 4.5,
            "road_accessibility": 0.8,
            "metro_accessibility": 0.7,
            "environmental_score": 0.6,
            "hospital_gap_score": 0.9,
            "population_score": 0.85,
        },
        {
            "ward_id": "W-102",
            "population": 20000,
            "population_density": 4800,
            "distance_to_hospital_km": 9.2,
            "road_accessibility": 0.5,
            "metro_accessibility": 0.4,
            "environmental_score": 0.5,
            "hospital_gap_score": 0.4,
            "population_score": 0.35,
        },
    ]

    results = calculate_site_suitability(wards)
    assert len(results) == 2
    assert results[0]["ward_id"] == "W-101"
    assert results[0]["final_score"] > results[1]["final_score"]
    assert "High suitability" in results[0]["explanation"]
