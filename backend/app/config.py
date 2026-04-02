"""Конфигурация приложения FillDocs"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LLM
    llm_api_key: str = ""
    llm_base_url: str = ""  # для совместимости с разными провайдерами
    llm_model: str = "claude-sonnet-4-20250514"
    llm_temperature: float = 0.0
    llm_max_tokens: int = 4096

    # App
    max_file_size: int = 10 * 1024 * 1024  # 10 MB
    allowed_extensions: set[str] = {".doc", ".docx"}

    model_config = {"env_file": ".env", "env_prefix": "FILLDOCS_"}


settings = Settings()
