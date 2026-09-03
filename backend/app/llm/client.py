from functools import lru_cache

from openai import OpenAI

from app.config import get_settings


@lru_cache
def get_llm_client() -> OpenAI:
    settings = get_settings()
    return OpenAI(api_key=settings.asu_api_key, base_url=settings.asu_api_base)
