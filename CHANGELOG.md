# Changelog

## [Unreleased]

### Added
- **ROT-142**: Интеграция ЮКассы для доната
  - `POST /api/donate` — создание платежа (сумма 10–15000 руб.)
  - `POST /api/webhook/yookassa` — webhook с IP-whitelist и верификацией
  - `GET /api/donate/success` — страница "Спасибо за поддержку"
  - `backend/app/services/payment_service.py` — сервис оплаты
  - Конфиг: `FILLDOCS_YOOKASSA_SHOP_ID`, `FILLDOCS_YOOKASSA_SECRET_KEY`, `FILLDOCS_YOOKASSA_RETURN_URL`
  - 13 тестов

### Changed
- **ROT-111**: Упрощена Pydantic-модель: удалены `Requisites` и `FillRequest`, обновлён `FillResponse` под v2 API, `/api/requisites/sample` возвращает dict с русскими ключами
- **ROT-109**: Переписан `/api/extract-requisites` с regex-подхода на LLM-подход
  - Извлечение текста через `docx_to_text()` вместо `filler.extract()`
  - Отправка текста в LLM через `llm_service.extract_requisites()`
  - LLM возвращает dict с русскими названиями полей
  - Обработка ошибок LLM (ValueError, timeout, API error, connection error) -> HTTP 502
  - Добавлены тесты endpoint: success, invalid file, LLM errors
