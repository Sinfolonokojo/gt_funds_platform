# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "gt_funds"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()