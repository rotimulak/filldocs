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


# --- POST /api/webhook/yookassa ---


@patch("app.services.payment_service.verify_payment")
@patch("app.services.payment_service.is_ip_allowed", return_value=True)
def test_webhook_success(mock_ip, mock_verify):
    """Успешный webhook."""
    mock_verify.return_value = True

    resp = client.post("/api/webhook/yookassa", json={
        "event": "payment.succeeded",
        "object": {"id": "pay_123", "amount": {"value": "100.00", "currency": "RUB"}},
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
    mock_verify.assert_called_once_with("pay_123")


@patch("app.services.payment_service.verify_payment", return_value=False)
@patch("app.services.payment_service.is_ip_allowed", return_value=True)
def test_webhook_verification_failed(mock_ip, mock_verify):
    """Верификация платежа не прошла — 400."""
    resp = client.post("/api/webhook/yookassa", json={
        "event": "payment.succeeded",
        "object": {"id": "pay_123", "amount": {"value": "100.00", "currency": "RUB"}},
    })
    assert resp.status_code == 400


@patch("app.services.payment_service.is_ip_allowed", return_value=False)
def test_webhook_ip_blocked(mock_ip):
    """Webhook с невалидного IP — 403."""
    resp = client.post("/api/webhook/yookassa", json={
        "event": "payment.succeeded",
        "object": {"id": "pay_123"},
    })
    assert resp.status_code == 403


@patch("app.services.payment_service.is_ip_allowed", return_value=True)
def test_webhook_ignores_other_events(mock_ip):
    """Webhook с другим event — ignored."""
    resp = client.post("/api/webhook/yookassa", json={
        "event": "payment.canceled",
        "object": {"id": "pay_123"},
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "ignored"


# --- GET /api/donate/success ---


def test_donate_success_page():
    """Страница спасибо."""
    resp = client.get("/api/donate/success")
    assert resp.status_code == 200
    assert "Спасибо за поддержку" in resp.text


# --- payment_service unit tests ---


def test_is_ip_allowed_valid():
    """IP из whitelist ЮКассы."""
    from app.services.payment_service import is_ip_allowed
    assert is_ip_allowed("185.71.76.1") is True
    assert is_ip_allowed("77.75.156.11") is True


def test_is_ip_allowed_invalid():
    """IP не из whitelist."""
    from app.services.payment_service import is_ip_allowed
    assert is_ip_allowed("1.2.3.4") is False
    assert is_ip_allowed("192.168.1.1") is False


def test_is_ip_allowed_bad_input():
    """Невалидный IP."""
    from app.services.payment_service import is_ip_allowed
    assert is_ip_allowed("not-an-ip") is False
