from __future__ import annotations

from typing import Any

DEFAULT_WEIGHTS: dict[str, float] = {
    "population_demand": 0.30,
    "hospital_gap": 0.25,
    "road_accessibility": 0.20,
    "metro_accessibility": 0.15,
    "environmental_factor": 0.10,
}


def validate_weights(weights: dict[str, float] | None = None) -> dict[str, float]:
    if weights is None:
        weights = DEFAULT_WEIGHTS.copy()

    normalized = {key: float(weights.get(key, DEFAULT_WEIGHTS[key])) for key in DEFAULT_WEIGHTS}
    total = sum(normalized.values())
    if abs(total) < 1e-9:
        raise ValueError("Weight total must be greater than zero.")

    if any(value < 0 for value in normalized.values()):
        raise ValueError("Weights must be non-negative.")

    normalized = {key: value / total for key, value in normalized.items()}
    normalized["environmental_factor"] = round(
        1.0 - sum(value for key, value in normalized.items() if key != "environmental_factor"),
        12,
    )
    return normalized


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_range(values: list[float]) -> list[float]:
    if not values:
        return []
    min_value = min(values)
    max_value = max(values)
    if max_value == min_value:
        return [1.0 for _ in values]
    return [((value - min_value) / (max_value - min_value)) for value in values]


def calculate_site_suitability(wards: list[dict[str, Any]], weights: dict[str, float] | None = None) -> list[dict[str, Any]]:
    if not wards:
        return []

    validated_weights = validate_weights(weights)

    population_values = [
        _safe_float(ward.get("population_score"), 0.0)
        for ward in wards
    ]
    hospital_gap_values = [
        _safe_float(ward.get("hospital_gap_score"), 0.0)
        for ward in wards
    ]
    road_values = [
        _safe_float(ward.get("road_accessibility"), 0.0)
        for ward in wards
    ]
    metro_values = [
        _safe_float(ward.get("metro_accessibility"), 0.0)
        for ward in wards
    ]
    environmental_values = [
        _safe_float(ward.get("environmental_score"), 0.0)
        for ward in wards
    ]

    population_scores = _normalize_range(population_values)
    hospital_scores = _normalize_range(hospital_gap_values)
    road_scores = _normalize_range(road_values)
    metro_scores = _normalize_range(metro_values)
    environmental_scores = _normalize_range(environmental_values)

    results: list[dict[str, Any]] = []
    for index, ward in enumerate(wards):
        pop_score = population_scores[index]
        gap_score = hospital_scores[index]
        road_score = road_scores[index]
        metro_score = metro_scores[index]
        environment_score = environmental_scores[index]

        final_score = (
            pop_score * validated_weights["population_demand"]
            + gap_score * validated_weights["hospital_gap"]
            + road_score * validated_weights["road_accessibility"]
            + metro_score * validated_weights["metro_accessibility"]
            + environment_score * validated_weights["environmental_factor"]
        )

        if final_score >= 0.75:
            suitability_label = "High suitability"
        elif final_score >= 0.45:
            suitability_label = "Moderate suitability"
        else:
            suitability_label = "Low suitability"

        explanation = (
            f"{suitability_label} because the area has a strong population profile, "
            f"limited proximity to existing mapped hospitals, and a balanced accessibility profile."
        )

        results.append(
            {
                "ward_id": ward.get("ward_id", f"WARD-{index + 1}"),
                "population": _safe_float(ward.get("population") , 0.0),
                "population_density": _safe_float(ward.get("population_density"), 0.0),
                "distance_to_hospital_km": _safe_float(ward.get("distance_to_hospital_km"), 0.0),
                "population_score": round(pop_score, 6),
                "hospital_gap_score": round(gap_score, 6),
                "road_accessibility_score": round(road_score, 6),
                "metro_accessibility_score": round(metro_score, 6),
                "environmental_score": round(environment_score, 6),
                "final_score": round(final_score, 6),
                "explanation": explanation,
            }
        )

    results.sort(key=lambda item: item["final_score"], reverse=True)
    for rank, item in enumerate(results, start=1):
        item["rank"] = rank

    return results
