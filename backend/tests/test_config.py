"""Тесты для конфигурации приложения"""
import os
import pytest


def test_default_settings():
    """Проверка значений по умолчанию"""
    # Import fresh to get defaults (no env vars with FILLDOCS_ prefix expected)
    from app.config import Settings

    s = Settings(
        _env_file=None,  # не читать .env файл в тестах
    )

    assert s.llm_api_key == ""
    assert s.llm_base_url == ""
    assert s.llm_model == "claude-sonnet-4-20250514"
    assert s.llm_temperature == 0.0
    assert s.llm_max_tokens == 4096
    assert s.max_file_size == 10 * 1024 * 1024
    assert s.allowed_extensions == {".doc", ".docx"}


def test_env_override(monkeypatch):
    """Проверка что env vars переопределяют defaults"""
    monkeypatch.setenv("FILLDOCS_LLM_API_KEY", "test-key-123")
    monkeypatch.setenv("FILLDOCS_LLM_BASE_URL", "https://custom.api.com")
    monkeypatch.setenv("FILLDOCS_LLM_MODEL", "gpt-4")
    monkeypatch.setenv("FILLDOCS_LLM_TEMPERATURE", "0.5")
    monkeypatch.setenv("FILLDOCS_LLM_MAX_TOKENS", "8192")
    monkeypatch.setenv("FILLDOCS_MAX_FILE_SIZE", "5242880")

    from app.config import Settings

    s = Settings(_env_file=None)

    assert s.llm_api_key == "test-key-123"
    assert s.llm_base_url == "https://custom.api.com"
    assert s.llm_model == "gpt-4"
    assert s.llm_temperature == 0.5
    assert s.llm_max_tokens == 8192
    assert s.max_file_size == 5242880
