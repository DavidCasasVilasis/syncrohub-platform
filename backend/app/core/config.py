from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "SyncroHub Smart Building Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Base de datos (SQLite por defecto para portabilidad inmediata en demo, configurable a PostgreSQL)
    DATABASE_URL: str = "sqlite:///./syncrohub.db"
    
    # CORS para el frontend Vite
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    
    # Umbrales energéticos de referencia
    DEFAULT_CO2_FACTOR_KG_PER_KWH: float = 0.25  # Factor medio mix eléctrico España
    PEAK_RATE_EUR_KWH: float = 0.24
    FLAT_RATE_EUR_KWH: float = 0.16
    VALLEY_RATE_EUR_KWH: float = 0.10
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
