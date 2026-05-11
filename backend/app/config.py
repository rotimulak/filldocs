"""Конфигурация приложения FillDocs"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LLM
    llm_api_key: str = ""
    llm_base_url: str = ""  # для совместимости с разными провайдерами
    llm_model: str = "claude-sonnet-4-20250514"
    llm_temperature: float = 0.0
    llm_max_tokens: int = 4096

    # YooKassa (donation)
    yookassa_shop_id: str = ""
    yookassa_secret_key: str = ""
    yookassa_return_url: str = "https://filldocs.ru/api/donate/success"

    # SMTP (feedback)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    feedback_to: str = "rotimulak@gmail.com"

    # App
    max_file_size: int = 10 * 1024 * 1024  # 10 MB
    allowed_extensions: set[str] = {".doc", ".docx"}

    model_config = {"env_file": ".env", "env_prefix": "FILLDOCS_"}


settings = Settings()
