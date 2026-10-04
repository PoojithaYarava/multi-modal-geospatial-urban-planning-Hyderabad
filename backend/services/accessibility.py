from __future__ import annotations

from typing import Iterable


def normalize_metric(value: float, lower: float, upper: float) -> float:
    if upper <= lower:
        return 0.0
    return max(0.0, min(1.0, (value - lower) / (upper - lower)))


def hospital_accessibility_score(distance_km: float | None, *, threshold_km: float = 5.0) -> float:
    if distance_km is None:
        return 0.0
    return max(0.0, min(1.0, 1.0 - distance_km / threshold_km))


def metro_accessibility_score(distance_km: float | None, *, threshold_km: float = 2.5) -> float:
    if distance_km is None:
        return 0.0
    return max(0.0, min(1.0, 1.0 - distance_km / threshold_km))


def road_accessibility_score(road_length_km: float | None, *, max_road_length_km: float = 50.0) -> float:
    if road_length_km is None:
        return 0.0
    return max(0.0, min(1.0, road_length_km / max_road_length_km))


def average(values: Iterable[float]) -> float:
    sequence = list(values)
    if not sequence:
        return 0.0
    return sum(sequence) / len(sequence)
