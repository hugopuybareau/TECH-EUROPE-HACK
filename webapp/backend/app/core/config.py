from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "read-it-from-env"
    JWT_SECRET: str = "read-it-from-env"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 120
    N8N_WEBHOOK_URL: str = ""  # n8n webhook URL for repo scanning

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()