CREATE INDEX IF NOT EXISTS idx_wards_geometry ON wards USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_roads_geometry ON roads USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_hospitals_geometry ON hospitals USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_metro_stops_geometry ON metro_stops USING GIST (geometry);
