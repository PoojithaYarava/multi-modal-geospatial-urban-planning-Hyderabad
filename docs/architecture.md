# Architecture Notes

The platform is structured around a modular data pipeline that ingests public geospatial datasets, validates them, and scores planning units for accessibility and hospital site suitability.

## Core layers

1. Data ingestion
2. Validation and cleaning
3. Spatial preprocessing
4. PostGIS persistence
5. Accessibility analysis
6. Multi-criteria suitability scoring
7. FastAPI service
8. React dashboard

## Data flow

The system prioritizes ward-based planning and can be extended to parcel-level data when reliable land-use products are available.
