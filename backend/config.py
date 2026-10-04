from __future__ import annotations

import os
from functools import lru_cache

from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "HYDERABAD GEOSPATIAL ANALYTICS"
    environment: str = os.getenv("APP_ENV", "development")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data/hyderabad_app.db")
    tgrac_api_url: str = os.getenv(
        "TGRAC_API_URL",
        "https://tgrac.telangana.gov.in/arcgis/rest/services/SchoolGIS_Folder/Schools/MapServer/13",
    )
    overpass_api_url: str = os.getenv("OVERPASS_API_URL", "https://overpass-api.de/api/interpreter")
    copernicus_client_id: str = os.getenv("COPERNICUS_CLIENT_ID", "")
    copernicus_client_secret: str = os.getenv("COPERNICUS_CLIENT_SECRET", "")


@lru_cache
def get_settings() -> Settings:
    return Settings()
