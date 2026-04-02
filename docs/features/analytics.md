# PRD: Аналитика и наблюдаемость (Вариант A)

## Проблема

Сейчас у FillDocs нет средств наблюдаемости:

- **Бэкенд** логирует только debug-информацию через `logger.warning` (таблица для LLM, инструкции, дамп ответа). Нет структурированных логов запросов, нет метрик длительности LLM-вызовов, нет учёта ошибок.
- **Фронтенд** не отправляет никаких событий. Мы не знаем, сколько пользователей дошло от загрузки реквизитов до скачивания документа.
- **Инфраструктура** (docker-compose) не имеет мониторинга доступности.

Без аналитики невозможно понять: пользуются ли продуктом, на каком этапе отваливаются, как часто падает LLM, какое среднее время ответа.

## Цели

1. Видеть воронку пользователя: extract -> fill -> download (конверсия по этапам).
2. Знать время отклика API и отдельно время LLM-вызовов.
3. Фиксировать ошибки с типизацией (LLM timeout, LLM parse error, validation error).
4. Мониторить доступность сервиса.

## Не-цели

- Полноценный APM (Datadog, New Relic) -- избыточно для текущего масштаба.
- Алерты в Slack/Telegram -- можно добавить позже поверх UptimeKuma.
- Трекинг персональных данных пользователей (IP, cookies, fingerprint).
- Метрики Prometheus / Grafana -- не нужны на этом этапе.
- A/B тестирование.

## Scope (Вариант A)

| Компонент | Объём работы | Приоритет |
|-----------|-------------|-----------|
| Structured JSON logging middleware | ~50 строк Python | P0 |
| Umami (веб-аналитика) | docker-compose + скрипт-тег | P0 |
| Кастомные события фронтенда | ~30 строк TS | P0 |
| UptimeKuma (мониторинг) | docker-compose | P1 (опционально) |

---

## 1. Structured JSON Logging Middleware

### Что делает

ASGI middleware в FastAPI, которая логирует каждый HTTP-запрос как одну JSON-строку в stdout. Для эндпоинтов с LLM-вызовами дополнительно логирует `llm_duration_ms`.

### Техническое решение

Новый файл: `backend/app/middleware/logging_middleware.py`

```python
# Middleware оборачивает каждый запрос, замеряет время, ловит статус-код.
# Для /api/extract-requisites и /api/fill — дополнительно замеряет LLM duration
# через context variable, которую выставляет llm_service.
```

Регистрация в `backend/app/main.py`:

```python
from app.middleware.logging_middleware import RequestLoggingMiddleware
app.add_middleware(RequestLoggingMiddleware)
```

### Формат лог-записи

```json
{
  "ts": "2026-04-02T12:00:00.123Z",
  "method": "POST",
  "path": "/api/fill",
  "status": 200,
  "duration_ms": 3420,
  "llm_duration_ms": 3100,
  "error_type": null,
  "file_ext": ".docx",
  "req_fields_count": 8,
  "filled_count": 6
}
```

### Поля

| Поле | Тип | Описание | Когда заполняется |
|------|-----|----------|-------------------|
| `ts` | string (ISO 8601) | Временная метка | Всегда |
| `method` | string | HTTP-метод | Всегда |
| `path` | string | Путь эндпоинта | Всегда |
| `status` | int | HTTP статус-код ответа | Всегда |
| `duration_ms` | int | Общее время обработки запроса | Всегда |
| `llm_duration_ms` | int \| null | Время LLM-вызова (без retry-пауз) | `/api/extract-requisites`, `/api/fill` |
| `error_type` | string \| null | Тип ошибки | При ошибке |
| `file_ext` | string \| null | Расширение загруженного файла | При загрузке файла |
| `req_fields_count` | int \| null | Кол-во полей реквизитов | `/api/extract-requisites` (ответ), `/api/fill` (вход) |
| `filled_count` | int \| null | Кол-во заполненных ячеек | `/api/fill` |

### Классификация error_type

| error_type | Условие |
|------------|---------|
| `"llm_timeout"` | `openai.APITimeoutError` |
| `"llm_api_error"` | `openai.APIStatusError` |
| `"llm_connection"` | `openai.APIConnectionError` |
| `"llm_parse"` | `ValueError` при парсинге XML/JSON |
| `"validation"` | HTTP 400 (неверный формат, размер) |
| `"doc_convert"` | Ошибка конвертации .doc -> .docx |
| `null` | Нет ошибки |

### Передача llm_duration_ms

Используем `contextvars.ContextVar` для передачи времени LLM из `llm_service._call_llm()` в middleware:

```python
# backend/app/middleware/request_context.py
import contextvars
llm_duration_var: contextvars.ContextVar[float | None] = contextvars.ContextVar("llm_duration", default=None)
```

В `llm_service._call_llm()` замеряем `time.monotonic()` вокруг `self.client.chat.completions.create()` и записываем в `llm_duration_var`.

Middleware читает `llm_duration_var.get()` после выполнения запроса.

### Куда пишем

В stdout (через `python-json-logger` или ручной `json.dumps`). Docker Compose собирает stdout в `docker logs`. На этом этапе не нужен отдельный лог-коллектор.

### Зависимости

Никаких новых зависимостей не требуется. Используем стандартный `logging` + `json.dumps`.

---

## 2. Umami (веб-аналитика)

### Что это

[Umami](https://umami.is/) -- self-hosted, privacy-friendly веб-аналитика. Не использует cookies, GDPR-compliant из коробки. Даёт: pageviews, уникальные посетители, custom events.

### Инфраструктура

Добавляем два сервиса в `docker-compose.yml`:

```yaml
  umami-db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: ${UMAMI_DB_PASSWORD:-umami_secret}
    volumes:
      - umami-data:/var/lib/postgresql/data

  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://umami:${UMAMI_DB_PASSWORD:-umami_secret}@umami-db:5432/umami
      APP_SECRET: ${UMAMI_APP_SECRET:-replace_me_in_production}
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - umami-db

volumes:
  umami-data:
```

### Подключение к фронтенду

После создания сайта в UI Umami (первый запуск: admin/umami), получаем `data-website-id`.

Скрипт-тег добавляем в `frontend/index.html`:

```html
<script defer src="http://localhost:3000/script.js" data-website-id="WEBSITE_ID"></script>
```

Для production `localhost:3000` заменяется на внутренний URL Umami (через Docker network или env-переменную `VITE_UMAMI_URL`).

### Конфигурация

Новые env-переменные (в корневом `.env` или docker-compose):

| Переменная | Значение по умолчанию | Описание |
|------------|----------------------|----------|
| `UMAMI_DB_PASSWORD` | `umami_secret` | Пароль PostgreSQL для Umami |
| `UMAMI_APP_SECRET` | `replace_me_in_production` | Секрет приложения Umami |
| `VITE_UMAMI_HOST` | (пусто) | URL Umami для скрипт-тега |
| `VITE_UMAMI_WEBSITE_ID` | (пусто) | ID сайта в Umami |

---

## 3. Кастомные события фронтенда

### Воронка

```
extract_start  -->  extract_success  -->  fill_start  -->  fill_success  -->  download
                \-> extract_error          \-> fill_error
```

### Список событий

| Событие | Когда отправляется | Данные (props) |
|---------|--------------------|----------------|
| `extract_start` | Пользователь загрузил файл в RequisitesPanel | `{ ext: ".docx" }` |
| `extract_success` | API вернул success=true | `{ fields_count: 8 }` |
| `extract_error` | API вернул ошибку или success=false | `{ error_type: "llm_timeout" }` |
| `fill_start` | Пользователь загрузил шаблон в FillPanel | `{ ext: ".docx" }` |
| `fill_success` | API вернул success=true | `{ filled: 6, total: 8 }` |
| `fill_error` | API вернул ошибку или success=false | `{ error_type: "llm_parse" }` |
| `download` | Пользователь нажал "Скачать документ" | -- |

### Техническое решение

Утилита-обёртка вокруг Umami API:

```typescript
// frontend/src/lib/analytics.ts

/** Отправить кастомное событие в Umami (если подключён) */
export function trackEvent(name: string, data?: Record<string, string | number>) {
  // umami — глобальная переменная, которую создаёт скрипт Umami
  if (typeof window !== 'undefined' && (window as any).umami) {
    (window as any).umami.track(name, data);
  }
}
```

Вызовы добавляются в `RequisitesPanel.tsx` и `FillPanel.tsx` в соответствующих местах (handleFile, handleDownload). Примерно по 5-6 строк на компонент.

### Где вставлять вызовы

**RequisitesPanel.tsx** -- метод `handleFile`:
- `trackEvent('extract_start', { ext })` -- перед вызовом `api.extractRequisites`
- `trackEvent('extract_success', { fields_count })` -- после успешного ответа
- `trackEvent('extract_error', { error_type })` -- в catch-блоке

**FillPanel.tsx** -- метод `handleFile`:
- `trackEvent('fill_start', { ext })` -- перед вызовом `api.fillDocument`
- `trackEvent('fill_success', { filled, total })` -- после успешного ответа
- `trackEvent('fill_error', { error_type })` -- в catch-блоке

**FillPanel.tsx** -- метод `handleDownload`:
- `trackEvent('download')` -- при нажатии кнопки "Скачать документ"

---

## 4. UptimeKuma (опционально, P1)

### Что это

[UptimeKuma](https://github.com/louislam/uptime-kuma) -- self-hosted мониторинг доступности. Пингует `/health` эндпоинт и показывает статус-страницу.

### Инфраструктура

```yaml
  uptime-kuma:
    image: louislam/uptime-kuma:1
    restart: unless-stopped
    ports:
      - "127.0.0.1:3001:3001"
    volumes:
      - uptime-kuma-data:/app/data

volumes:
  uptime-kuma-data:
```

### Настройка

После запуска: создать аккаунт в UI, добавить монитор HTTP(s) на `http://backend:8000/health`, интервал 60 секунд.

Опционально -- настроить нотификации (Telegram, email) при даунтайме.

---

## Приватность

1. **Umami не использует cookies** и не собирает PII. IP-адреса хешируются и не хранятся в сыром виде. GDPR-compliant без баннера.
2. **Backend-логи не содержат контента документов**. Логируются только метаданные: расширение файла, кол-во полей, время обработки.
3. **Кастомные события** не содержат содержимого реквизитов -- только числовые метрики (кол-во полей, filled/total).
4. **Все сервисы аналитики** доступны только на `127.0.0.1` (не экспонированы наружу). Для production -- закрыть за reverse proxy с авторизацией.

---

## Порядок реализации

| Шаг | Задача | Файлы |
|-----|--------|-------|
| 1 | Structured logging middleware | `backend/app/middleware/__init__.py`, `backend/app/middleware/logging_middleware.py`, `backend/app/middleware/request_context.py` |
| 2 | Интеграция context var в llm_service | `backend/app/services/llm_service.py` |
| 3 | Подключение middleware в main.py | `backend/app/main.py` |
| 4 | Удаление ad-hoc logger.warning из routes.py | `backend/app/api/routes.py` |
| 5 | Umami + PostgreSQL в docker-compose | `docker-compose.yml` |
| 6 | Скрипт-тег Umami в index.html | `frontend/index.html` |
| 7 | Утилита trackEvent | `frontend/src/lib/analytics.ts` |
| 8 | События в RequisitesPanel | `frontend/src/components/RequisitesPanel.tsx` |
| 9 | События в FillPanel | `frontend/src/components/FillPanel.tsx` |
| 10 | UptimeKuma в docker-compose (опционально) | `docker-compose.yml` |

---

## Открытые вопросы

1. **Ротация логов**: Docker по умолчанию хранит все stdout-логи. Нужно ли настроить `logging.driver` с max-size/max-file в docker-compose?
2. **Umami за reverse proxy**: В production Umami должен быть доступен фронтенду. Через Docker internal network (если фронтенд и Umami в одной сети) или через публичный URL? Влияет на скрипт-тег.
3. **Retention**: Как долго хранить данные в Umami PostgreSQL? По умолчанию -- бессрочно. Нужна ли авто-очистка?
4. **Версия Umami**: Использовать latest или зафиксировать конкретную версию в docker-compose для воспроизводимости?
