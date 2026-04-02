# Архитектура FillDocs v2

## Обзор системы

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              КЛИЕНТ                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     React + Tailwind v4                           │  │
│  │  ┌─────────────────────┐    ┌─────────────────────┐               │  │
│  │  │  RequisitesPanel    │    │    FillPanel        │               │  │
│  │  │  - DropZone         │    │    - DropZone       │               │  │
│  │  │  - JsonPreview      │    │    - FillReport     │               │  │
│  │  │  - localStorage     │    │    - Download       │               │  │
│  │  └─────────────────────┘    └─────────────────────┘               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    │ HTTP/REST                          │
│                                    ▼                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                              СЕРВЕР                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        FastAPI                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │  │
│  │  │   /api/     │  │   /api/     │  │   /api/     │                │  │
│  │  │  extract    │  │    fill     │  │  download   │                │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │  │
│  │         │                │                │                        │  │
│  │         ▼                ▼                ▼                        │  │
│  │  ┌─────────────────────────────────────────────────┐              │  │
│  │  │              Services Layer                      │              │  │
│  │  │  ┌─────────────┐  ┌─────────────┐               │              │  │
│  │  │  │ LLMService  │  │ DocxText    │               │              │  │
│  │  │  │ (Anthropic) │  │ (python-docx)│              │              │  │
│  │  │  └─────────────┘  └─────────────┘               │              │  │
│  │  │  ┌─────────────┐                                │              │  │
│  │  │  │  Converter  │                                │              │  │
│  │  │  │  doc→docx   │                                │              │  │
│  │  │  └─────────────┘                                │              │  │
│  │  └─────────────────────────────────────────────────┘              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                           ФАЙЛОВАЯ СИСТЕМА                              │
│  ┌─────────────┐  ┌─────────────┐                                      │
│  │   temp/     │  │   output/   │                                      │
│  │ (удаляется) │  │ (удаляется  │                                      │
│  │             │  │  после DL)  │                                      │
│  └─────────────┘  └─────────────┘                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                           LLM API (Anthropic)                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Claude API — извлечение реквизитов + генерация инструкций      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Структура проекта

```
filldocs/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI приложение
│   │   ├── config.py               # Settings (pydantic-settings)
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py           # REST эндпоинты
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── llm_service.py      # LLM API (Anthropic Claude)
│   │   │   ├── docx_text.py        # docx → текст, поиск таблиц
│   │   │   ├── docx_filler.py      # [legacy v1] regex-маппинг
│   │   │   └── converter.py        # .doc → .docx конвертация
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── requisites.py       # Pydantic-модели ответов
│   │   └── prompts/
│   │       ├── __init__.py
│   │       ├── extract.txt          # Промпт извлечения реквизитов
│   │       └── fill.txt             # Промпт генерации инструкций
│   ├── requirements.txt
│   ├── .env.example
│   └── tests/
│       ├── test_docx_text.py        # 11 тестов
│       ├── test_llm_service.py      # 12 тестов
│       ├── test_extract_endpoint.py # 10 тестов
│       ├── test_fill_endpoint.py    # 7 тестов
│       ├── test_config.py           # 2 тесты
│       └── conftest.py
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Layout (три колонки)
│   │   ├── main.tsx                # Точка входа
│   │   ├── index.css               # Tailwind v4
│   │   ├── api/
│   │   │   └── client.ts           # HTTP клиент
│   │   ├── components/
│   │   │   ├── RequisitesPanel.tsx  # Левая панель
│   │   │   ├── FillPanel.tsx        # Центральная панель
│   │   │   ├── FillReport.tsx       # Отчёт о заполнении
│   │   │   ├── DropZone.tsx         # Drag & drop
│   │   │   ├── JsonPreview.tsx      # Предпросмотр JSON
│   │   │   ├── HeuristicsPanel.tsx  # Правая панель (инфо)
│   │   │   └── Spinner.tsx          # Индикатор загрузки
│   │   ├── hooks/
│   │   │   └── useLocalStorage.ts
│   │   └── types/
│   │       └── index.ts            # TypeScript типы
│   ├── package.json
│   └── vite.config.ts
│
├── data/
│   ├── temp/                       # Временные файлы (удаляются сразу)
│   └── output/                     # Результаты (удаляются после скачивания)
│
├── agents/                         # Агенты разработки
│   ├── taskflow.md                 # Workflow процесс
│   ├── orchestrator.md
│   ├── researcher.md
│   ├── planner.md
│   ├── architect.md
│   ├── coder.md
│   ├── tester.md
│   └── reviewer.md
│
├── scripts/                        # CLI утилиты
│   ├── fill_docx.py
│   ├── convert_doc.py
│   └── inspect_docx.py
│
└── docs/
    ├── TASK.md                     # Техническое задание (UI)
    ├── architecture.md             # Этот документ
    ├── solution.md                 # Алгоритмы и потоки данных
    └── V2-MIGRATION.md             # История миграции v1→v2
```

---

## Потоки данных

### 1. Извлечение реквизитов (Extract)

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌────────────┐    ┌─────────┐
│  Файл    │───▶│ Frontend │───▶│   Backend    │───▶│  DocxText  │───▶│   LLM   │
│  .docx   │    │ DropZone │    │ /api/extract │    │ docx→text  │    │ Claude  │
└──────────┘    └──────────┘    └──────────────┘    └────────────┘    └─────────┘
                     │                                                     │
                     │                                                     │
                     ▼                                                     ▼
              ┌────────────┐                                        ┌────────────┐
              │localStorage│◀───────────────────────────────────────│  XML→JSON  │
              │ requisites │          dict[str, str]                 │ реквизиты  │
              └────────────┘                                        └────────────┘
```

### 2. Заполнение документа (Fill)

```
┌──────────┐    ┌────────────┐    ┌──────────────┐    ┌────────────┐    ┌─────────┐
│ Шаблон   │───▶│  Frontend  │───▶│   Backend    │───▶│  DocxText  │───▶│   LLM   │
│  .docx   │    │  DropZone  │    │  /api/fill   │    │find_table  │    │ Claude  │
└──────────┘    └────────────┘    └──────────────┘    └────────────┘    └─────────┘
                     │                   │                                   │
                     │                   │                                   ▼
              ┌────────────┐             │                           ┌────────────┐
              │localStorage│─────────────┘                          │ Инструкции │
              │ requisites │  (JSON в запросе)                      │ [{row,col, │
              └────────────┘                                        │   value}]  │
                                                                    └────────────┘
                                                                          │
                     ┌────────────────────────────────────────────────────┘
                     ▼
              ┌────────────┐    ┌────────────┐    ┌────────────────┐
              │  Применить │───▶│   output/   │───▶│ /api/download  │
              │  к docx    │    │ filled.docx │    │   FileResponse │
              └────────────┘    └────────────┘    └────────────────┘
```

---

## API Endpoints

| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | `/health` | Проверка работоспособности |
| GET | `/api/templates` | Список шаблонов |
| POST | `/api/templates/upload` | Загрузить шаблон |
| POST | `/api/extract-requisites` | docx → LLM → JSON реквизитов |
| POST | `/api/fill` | шаблон + реквизиты → LLM → заполненный docx |
| GET | `/api/download/{filename}` | Скачать результат |
| POST | `/api/convert` | Конвертировать doc→docx |
| GET | `/api/requisites/sample` | Пример структуры реквизитов |

---

## Модели данных

### ExtractResponse

```python
class ExtractResponse(BaseModel):
    success: bool
    requisites: Dict[str, Any]    # {"Наименование": "ООО ...", "ИНН": "123..."}
    raw_fields: List[RawField]
    warnings: List[str] = []
    message: str
```

### FillResponse

```python
class FillResponse(BaseModel):
    success: bool
    filled_fields: int            # Сколько ячеек заполнено
    total_instructions: int       # Сколько инструкций от LLM
    download_url: str
    filename: str
    message: str
```

### Frontend: Requisites

```typescript
type Requisites = Record<string, string>;
// Динамический набор полей с русскими ключами от LLM
// Пример: {"Наименование компании": "ООО Рога", "ИНН": "1234567890"}
```

---

## Ключевые сервисы

### LLMService (`backend/app/services/llm_service.py`)

- **Провайдер:** Anthropic Claude API
- **Два метода:**
  - `extract_requisites(text) → dict[str, str]` — извлечение реквизитов (XML-ответ)
  - `generate_fill_instructions(table_text, xml) → list[dict]` — инструкции заполнения (JSON-ответ)
- **Retry:** 3 попытки с exponential backoff
- **Промпты:** загружаются из `backend/app/prompts/`

### DocxText (`backend/app/services/docx_text.py`)

- `docx_to_text(path)` — полный текст документа (параграфы + таблицы в Markdown)
- `docx_tables_to_text(path)` — список таблиц с метаданными (index, rows, cols, cells)
- `find_requisites_table(path)` — эвристика поиска таблицы реквизитов (по ключевым словам)

### Converter (`backend/app/services/converter.py`)

- `.doc → .docx` через pywin32 (Windows) или LibreOffice (кроссплатформенно)

---

## Конфигурация

### Settings (`backend/app/config.py`)

```python
class Settings(BaseSettings):
    llm_api_key: str = ""
    llm_base_url: str = ""
    llm_model: str = "claude-sonnet-4-20250514"
    llm_temperature: float = 0.0
    llm_max_tokens: int = 4096
    max_file_size: int = 10 * 1024 * 1024
    allowed_extensions: set[str] = {".doc", ".docx"}

    model_config = {"env_file": ".env", "env_prefix": "FILLDOCS_"}
```

### Переменные окружения (.env)

```
FILLDOCS_LLM_API_KEY=your-api-key
FILLDOCS_LLM_BASE_URL=https://api.anthropic.com
FILLDOCS_LLM_MODEL=claude-sonnet-4-20250514
```

---

## Хранение данных

### Принцип: No Database

- **На клиенте:** реквизиты в localStorage (`filldocs_requisites`)
- **На сервере:** только временные файлы, удаляются сразу

### Жизненный цикл файлов

| Тип | Путь | Время жизни |
|-----|------|-------------|
| Загруженный документ | `data/temp/` | Удаляется сразу после обработки |
| Результат заполнения | `data/output/` | Удаляется после скачивания |

---

## Безопасность

- CORS настроен для фронтенда
- Валидация типов файлов (только .doc, .docx)
- Ограничение размера загрузки (10 МБ)
- Временные файлы удаляются в finally-блоках
- API ключи только в .env (не в коде)
- Нет постоянного хранения пользовательских данных

---

## Тестирование

44 backend теста:

| Файл | Тестов | Покрытие |
|------|--------|----------|
| `test_docx_text.py` | 11 | docx→текст, таблицы, поиск |
| `test_llm_service.py` | 12 | XML/JSON парсинг, промпты, retry |
| `test_extract_endpoint.py` | 10 | API extract, ошибки LLM |
| `test_fill_endpoint.py` | 7 | API fill, ошибки, инструкции |
| `test_config.py` | 2 | Настройки, env override |

Все внешние сервисы (LLM API) мокируются в тестах.

---

## Развёртывание

### Development

```bash
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev
```

### Production

```bash
# Backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
npm run build  # статика в dist/
```
