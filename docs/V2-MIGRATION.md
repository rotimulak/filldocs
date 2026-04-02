# FillDocs v2: Миграция на LLM-подход

> **Статус: ЗАВЕРШЕНА** (2026-03-29)
> Все 7 задач выполнены, 44 backend теста проходят, frontend билдится.

## Что было (v1) → Что стало (v2)

| Компонент | v1 | v2 |
|-----------|----|----|
| Извлечение реквизитов | Regex LABEL_MAPPING (~50 паттернов) | LLM (Anthropic Claude) |
| Заполнение документа | Partial string match по меткам таблицы | LLM генерирует инструкции {row, col, value} |
| Модель реквизитов | Фиксированная Pydantic (25 полей) | Динамический `dict[str, str]` |
| Составные поля | Ручной COMPOSITE_FIELDS | LLM разделяет автоматически |
| Валидация/нормализация | VALIDATORS, NORMALIZERS, EXTRACTORS | LLM нормализует в промпте |
| Frontend типы | `interface Requisites {company_name?: ...}` | `Record<string, string>` |
| FillReport | Детальный used/unused fields | "Заполнено N из M ячеек" |

## Что осталось без изменений

- Общая архитектура: FastAPI + React + Vite + Tailwind
- Конвертация .doc → .docx (pywin32 / LibreOffice)
- Drag & Drop UI
- localStorage для реквизитов
- Stateless сервер без БД
- Жизненный цикл временных файлов (cleanup в finally)

## Выполненные задачи (Linear)

| # | Задача | Волна |
|---|--------|-------|
| ROT-107 | LLM-сервис (Anthropic SDK, retry, парсинг) | 1 |
| ROT-108 | docx → текст (Markdown-таблицы, метаданные) | 1 |
| ROT-113 | Конфигурация (pydantic-settings, .env) | 1 |
| ROT-109 | Extract endpoint → LLM | 2 |
| ROT-110 | Fill endpoint → LLM | 2 |
| ROT-111 | Упрощение Pydantic-моделей | 3 |
| ROT-112 | Frontend → динамические поля | 3 |

## Новые файлы (v2)

```
backend/app/config.py              # Settings (pydantic-settings)
backend/app/services/llm_service.py # LLM API (Anthropic)
backend/app/services/docx_text.py   # docx → текст
backend/app/prompts/extract.txt     # Промпт извлечения
backend/app/prompts/fill.txt        # Промпт заполнения
backend/.env.example                # Пример переменных окружения
```

## Legacy v1 (можно удалить)

```
backend/app/services/docx_filler.py  # Старый regex-маппинг
  → LABEL_MAPPING/COMPOSITE_FIELDS ещё используются для скоринга таблиц в docx_text.py
  → Остальное (extract, fill, validators, normalizers) не используется
```
