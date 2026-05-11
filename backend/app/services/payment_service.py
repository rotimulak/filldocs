"""Сервис оплаты через ЮКассу (донат)."""

import ipaddress
import logging
import uuid

from yookassa import Configuration, Payment

from app.config import settings

logger = logging.getLogger(__name__)

# IP whitelist для верификации webhook'ов ЮКассы
ALLOWED_IP_RANGES = [
    "185.71.76.0/27",
    "185.71.77.0/27",
    "77.75.153.0/25",
    "77.75.154.128/25",
]
ALLOWED_IPS = [
    "77.75.156.11",
    "77.75.156.35",
]


def _configure():
    """Инициализировать SDK ЮКассы (вызывается лениво)."""
    if settings.yookassa_shop_id and settings.yookassa_secret_key:
        Configuration.configure(settings.yookassa_shop_id, settings.yookassa_secret_key)


def create_donation(amount: int) -> str:
    """Создать платёж-донат в ЮКассе.

    Args:
        amount: сумма в рублях (целое число, >= 10)

    Returns:
        confirmation_url для редиректа пользователя
    """
    _configure()

    payment = Payment.create({
        "amount": {
            "value": f"{amount}.00",
            "currency": "RUB",
        },
        "capture": True,
        "confirmation": {
            "type": "redirect",
            "return_url": settings.yookassa_return_url,
        },
        "description": f"Благодарность FillDocs — {amount} руб.",
        "metadata": {"type": "donation"},
    }, uuid.uuid4())

    logger.info(
        "Donation payment created: payment_id=%s, amount=%d",
        payment.id, amount,
    )

    return payment.confirmation.confirmation_url


def verify_payment(payment_id: str) -> bool:
    """Верифицировать платёж через API ЮКассы.

    Returns:
        True если платёж succeeded
    """
    _configure()
    try:
        payment = Payment.find_one(payment_id)
        if payment.status == "succeeded":
            logger.info(
                "Donation verified: payment_id=%s, amount=%s",
                payment.id, payment.amount.value,
            )
            return True
        logger.warning(
            "Donation status mismatch: payment_id=%s, status=%s",
            payment_id, payment.status,
        )
        return False
    except Exception as e:
        logger.error("Failed to verify payment %s: %s", payment_id, e)
        return False


def is_ip_allowed(ip: str) -> bool:
    """Проверить IP по whitelist ЮКассы."""
    try:
        client_ip = ipaddress.ip_address(ip)
        for allowed_ip in ALLOWED_IPS:
            if client_ip == ipaddress.ip_address(allowed_ip):
                return True
        for network in ALLOWED_IP_RANGES:
            if client_ip in ipaddress.ip_network(network):
                return True
        return False
    except ValueError:
        logger.warning("Invalid IP address: %s", ip)
        return False
