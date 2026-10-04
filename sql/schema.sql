CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    ward_id TEXT UNIQUE,
    geometry GEOMETRY(MultiPolygon, 4326),
    population INTEGER,
    source_name TEXT,
    ingestion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roads (
    id SERIAL PRIMARY KEY,
    source_id TEXT,
    geometry GEOMETRY(LineString, 4326),
    source_name TEXT,
    ingestion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospitals (
    id SERIAL PRIMARY KEY,
    source_id TEXT,
    geometry GEOMETRY(Point, 4326),
    source_name TEXT,
    ingestion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metro_stops (
    id SERIAL PRIMARY KEY,
    stop_id TEXT UNIQUE,
    geometry GEOMETRY(Point, 4326),
    source_name TEXT,
    ingestion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
