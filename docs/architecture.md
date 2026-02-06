# Архитектура FillDocs

## Обзор системы

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              КЛИЕНТ                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     React + Tailwind                              │  │
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
│  │  │  │ DocxFiller  │  │  Converter  │               │              │  │
│  │  │  │ - extract   │  │  doc→docx   │               │              │  │
│  │  │  │ - fill      │  │  (pywin32)  │               │              │  │
│  │  │  └─────────────┘  └─────────────┘               │              │  │
│  │  └─────────────────────────────────────────────────┘              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                           ФАЙЛОВАЯ СИСТЕМА                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │  templates/ │  │   output/   │  │ requisites/ │                      │
│  │  .docx      │  │  _filled    │  │   .json     │                      │
│  │  .doc       │  │  .docx      │  │             │                      │
│  └─────────────┘  └─────────────┘  └─────────────┘                      │
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
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py           # REST эндпоинты
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── docx_filler.py      # Логика заполнения docx
│   │   │   └── converter.py        # Конвертация doc→docx
│   │   └── models/
│   │       ├── __init__.py
│   │       └── requisites.py       # Pydantic схемы
│   ├── requirements.txt
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Главный компонент
│   │   ├── main.tsx                # Точка входа
│   │   ├── index.css               # Tailwind
│   │   ├── api/
│   │   │   └── client.ts           # HTTP клиент
│   │   ├── components/
│   │   │   ├── RequisitesForm.tsx
│   │   │   └── TemplateSelect.tsx
│   │   └── types/
│   │       └── index.ts            # TypeScript типы
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts
│
├── data/
│   ├── templates/                  # Исходные шаблоны
│   ├── output/                     # Заполненные документы
│   └── requisites/                 # JSON с реквизитами
│
├── scripts/                        # CLI утилиты
│   ├── fill_docx.py
│   ├── convert_doc.py
│   └── inspect_docx.py
│
└── docs/
    ├── TASK.md                     # Техническое задание
    └── architecture.md             # Этот документ
```

---

## Потоки данных

### 1. Извлечение реквизитов

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌────────────┐
│  Файл    │───▶│ Frontend │───▶│   Backend    │───▶│ python-docx│
│  .docx   │    │ DropZone │    │ /api/extract │    │  parse     │
└──────────┘    └──────────┘    └──────────────┘    └────────────┘
                     │                                     │
                     │                                     │
                     ▼                                     ▼
              ┌────────────┐                        ┌────────────┐
              │localStorage│◀───────────────────────│   JSON     │
              │ requisites │                        │ response   │
              └────────────┘                        └────────────┘
```

### 2. Заполнение документа

```
┌──────────┐    ┌────────────┐    ┌──────────────┐    ┌────────────┐
│ Шаблон   │───▶│  Frontend  │───▶│   Backend    │───▶│ DocxFiller │
│  .docx   │    │  DropZone  │    │  /api/fill   │    │  .fill()   │
└──────────┘    └────────────┘    └──────────────┘    └────────────┘
                     │                   │                   │
                     │                   │                   ▼
              ┌────────────┐             │            ┌────────────┐
              │localStorage│─────────────┘            │   output/  │
              │ requisites │  (JSON в запросе)        │ filled.docx│
              └────────────┘                          └────────────┘
                                                            │
                     ┌──────────────────────────────────────┘
                     ▼
              ┌────────────┐    ┌────────────────┐
              │  Download  │◀───│ /api/download  │
              │   .docx    │    │   FileResponse │
              └────────────┘    └────────────────┘
```

---

## API Endpoints

| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | `/health` | Проверка работоспособности |
| GET | `/api/templates` | Список шаблонов |
| POST | `/api/templates/upload` | Загрузить шаблон |
| POST | `/api/extract-requisites` | Извлечь реквизиты из документа |
| POST | `/api/fill` | Заполнить документ |
| GET | `/api/download/{filename}` | Скачать результат |
| POST | `/api/convert` | Конвертировать doc→docx |
| GET | `/api/requisites/sample` | Пример структуры реквизитов |

---

## Модели данных

### Requisites (Pydantic)

```python
class Requisites(BaseModel):
    company_name: str           # Наименование компании
    inn: str                    # ИНН
    kpp: Optional[str]          # КПП
    ogrn: Optional[str]         # ОГРН
    address: str                # Юридический адрес
    postal_address: Optional[str]
    bank_name: Optional[str]    # Наименование банка
    bik: Optional[str]          # БИК
    account: Optional[str]      # Расчётный счёт
    corr_account: Optional[str] # Корр. счёт
    bank_details: Optional[str] # Полные банк. реквизиты
    director: Optional[str]     # Руководитель
    contact_person: Optional[str]
    phone: Optional[str]
    email: Optional[str]
```

### FillResponse

```python
class FillResponse(BaseModel):
    success: bool
    output_path: str
    filled_fields: int
    message: str
```

---

## Алгоритм заполнения

### Маппинг меток → полей

```python
LABEL_MAPPING = {
    "фирменное наименование": "company_name",
    "наименование, фирменное": "company_name",
    "сведения о месте нахождения": "address",
    "инн и кпп": "inn",
    "банковские реквизиты": "bank_details",
    "телефон участника": "phone",
    "адрес электронной почты": "email",
    ...
}
```

### Логика поиска в таблицах

1. Итерация по всем таблицам документа
2. Для каждой строки:
   - Получить текст из столбца меток (обычно 2-й столбец)
   - Найти соответствие в LABEL_MAPPING
   - Записать значение в столбец данных (обычно 3-й столбец)
3. Пропуск заголовков таблиц

---

## Конвертация .doc → .docx

### Windows (предпочтительно)

```python
# Через COM API (pywin32)
word = win32com.client.Dispatch("Word.Application")
doc = word.Documents.Open(path)
doc.SaveAs2(output_path, FileFormat=16)  # 16 = docx
```

### Кроссплатформенно

```bash
# Через LibreOffice headless
soffice --headless --convert-to docx --outdir output/ input.doc
```

---

## Хранение данных

### Принцип: No Database

Система работает **без базы данных**. Все данные хранятся:
- **На клиенте**: реквизиты в localStorage браузера
- **На сервере**: временные файлы в файловой системе

### Жизненный цикл файлов

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │────▶│  Temp file  │────▶│  Processing │────▶│   Delete    │
│   (клиент)  │     │  (сервер)   │     │  (сервис)   │     │  (cleanup)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Временные файлы

| Тип | Путь | Время жизни |
|-----|------|-------------|
| Загруженный документ | `data/temp/` | Удаляется сразу после обработки |
| Результат заполнения | `data/output/` | Удаляется после скачивания |
| Конвертированный .doc | `data/temp/` | Удаляется сразу после использования |

### Реализация очистки

```python
# После извлечения реквизитов
async def extract_requisites(file: UploadFile):
    temp_path = save_temp_file(file)
    try:
        result = parse_document(temp_path)
        return result
    finally:
        os.remove(temp_path)  # Всегда удаляем

# После скачивания результата
async def download_file(filename: str):
    file_path = OUTPUT_DIR / filename
    response = FileResponse(file_path)
    # Удаление через background task
    background_tasks.add_task(os.remove, file_path)
    return response
```

### Структура временных папок

```
data/
├── temp/           # Загруженные файлы (удаляются сразу)
│   └── (пусто)
├── output/         # Результаты (удаляются после скачивания)
│   └── (пусто)
└── templates/      # Постоянные шаблоны (опционально)
    └── example.docx
```

### Преимущества подхода

- Простота развёртывания (не нужна БД)
- Минимальное использование диска
- Приватность (файлы не хранятся)
- Stateless сервер (легко масштабировать)

---

## Безопасность

- CORS настроен для фронтенда
- Валидация типов файлов (только .doc, .docx)
- Ограничение размера загрузки (макс. 10 МБ)
- Временные файлы удаляются сразу после обработки
- Нет постоянного хранения пользовательских данных на сервере

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

### Docker (будущее)

```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    volumes: ["./data:/app/data"]

  frontend:
    build: ./frontend
    ports: ["80:80"]
```
