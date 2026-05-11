"""Тесты для эндпоинтов доната (ЮКасса)."""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


# --- POST /api/donate ---


@patch("app.services.payment_service.create_donation")
@patch("app.config.settings")
def test_donate_success(mock_settings, mock_create):
    """Успешное создание доната."""
    mock_settings.yookassa_shop_id = "test-shop"
    mock_settings.yookassa_secret_key = "test-key"
    mock_create.return_value = "https://yookassa.ru/checkout/test123"

    resp = client.post("/api/donate", json={"amount": 100})
    assert resp.status_code == 200
    assert resp.json()["confirmation_url"] == "https://yookassa.ru/checkout/test123"
    mock_create.assert_called_once_with(100)


def test_donate_amount_too_low():
    """Сумма меньше 10 — ошибка валидации."""
    resp = client.post("/api/donate", json={"amount": 5})
    assert resp.status_code == 422


def test_donate_amount_too_high():
    """Сумма больше 15000 — ошибка валидации."""
    resp = client.post("/api/donate", json={"amount": 20000})
    assert resp.status_code == 422


def test_donate_amount_missing():
    """Нет суммы — ошибка валидации."""
    resp = client.post("/api/donate", json={})
    assert resp.status_code == 422


@patch("app.config.settings")
def test_donate_no_keys(mock_settings):
    """Ключи ЮКассы не настроены — 503."""
    mock_settings.yookassa_shop_id = ""
    mock_settings.yookassa_secret_key = ""

    resp = client.post("/api/donate", json={"amount": 100})
    assert resp.status_code == 503


@patch("app.services.payment_service.create_donation", side_effect=Exception("API error"))
@patch("app.config.settings")
def test_donate_yookassa_error(mock_settings, mock_create):
    """Ошибка ЮКассы — 502."""
    mock_settings.yookassa_shop_id = "test-shop"
    mock_settings.yookassa_secret_key = "test-key"

    resp = client.post("/api/donate", json={"amount": 100})
    assert resp.status_code == 502


# --- GET /api/donate/success ---


def test_donate_success_page():
    """Страница спасибо."""
    resp = client.get("/api/donate/success")
    assert resp.status_code == 200
    assert "Спасибо за поддержку" in resp.text
