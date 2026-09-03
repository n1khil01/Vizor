from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    supabase_db_url: str

    asu_api_key: str
    asu_api_base: str = "https://openai.rc.asu.edu/v1"
    asu_chat_model: str
    asu_embedding_model: str

    cors_allowed_origins: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
