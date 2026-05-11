"""Сервис оплаты через ЮКассу (донат)."""

import logging
import uuid

from yookassa import Configuration, Payment

from app.config import settings

logger = logging.getLogger(__name__)

_configured = False


def _configure():
    """Инициализировать SDK ЮКассы (вызывается лениво, один раз)."""
    global _configured
    if _configured:
        return
    if settings.yookassa_shop_id and settings.yookassa_secret_key:
        Configuration.configure(settings.yookassa_shop_id, settings.yookassa_secret_key)
        _configured = True


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
