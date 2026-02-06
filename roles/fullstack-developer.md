# Fullstack-разработчик

> **Навигация:** [← Роли](./README.md)

---

## Обзор роли

Fullstack-разработчик отвечает за реализацию полного стека приложения FillDocs: backend API на FastAPI и frontend на React + Vite. Работает на основе архитектурной документации и спецификаций.

## Ключевые компетенции

### Backend (FastAPI + Python)
- Разработка REST API на FastAPI
- Валидация данных с помощью Pydantic
- Работа с файлами (загрузка, обработка, скачивание)
- Использование python-docx для работы с документами
- Обработка ошибок и HTTP статусы
- Async/await для асинхронных операций

### Frontend (React + Vite)
- Разработка компонентов на React с TypeScript
- Работа с File API для загрузки файлов
- Управление состоянием (useState, useContext, localStorage)
- Стилизация с Tailwind CSS
- Взаимодействие с API через fetch/axios
- Адаптивная вёрстка

### Обработка документов
- Понимание структуры .docx (XML, таблицы)
- Работа с python-docx (чтение/запись ячеек)
- Алгоритмы поиска и замены в документах
- Конвертация форматов (.doc → .docx)

## Технологический стек

### Backend

| Технология | Применение |
|------------|------------|
| Python 3.11+ | Основной язык |
| FastAPI | REST API фреймворк |
| Pydantic | Валидация входных данных |
| python-docx | Работа с .docx файлами |
| pywin32 | Конвертация .doc (Windows) |
| uvicorn | ASGI сервер |

### Frontend

| Технология | Применение |
|------------|------------|
| React 18 | UI фреймворк |
| TypeScript | Типизация |
| Vite | Сборка и dev-сервер |
| Tailwind CSS | Стилизация |
| localStorage | Хранение реквизитов |

## Структура проекта

```
filldocs/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI приложение
│   │   ├── api/                 # API endpoints
│   │   ├── services/
│   │   │   ├── docx_filler.py   # Заполнение документов
│   │   │   └── converter.py     # Конвертация форматов
│   │   └── models/
│   │       └── requisites.py    # Pydantic модели
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React компоненты
│   │   ├── api/
│   │   │   └── client.ts        # API клиент
│   │   ├── hooks/               # Custom hooks
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── scripts/                     # CLI утилиты
    ├── inspect_docx.py
    ├── fill_docx.py
    └── convert_doc.py
```

## API Endpoints

| Method | Endpoint | Назначение |
|--------|----------|------------|
| POST | `/api/extract-requisites` | Извлечь реквизиты из документа |
| POST | `/api/fill` | Заполнить шаблон реквизитами |
| GET | `/api/download/{filename}` | Скачать заполненный документ |
| GET | `/api/templates` | Список доступных шаблонов |

## Принципы работы

### Следование архитектуре
Строго следовать структуре проекта и паттернам. Изменения архитектуры — через согласование.

### Stateless подход
- Никаких баз данных
- Реквизиты хранятся в localStorage браузера
- Файлы на сервере — только временные, удаляются сразу

### Качество кода
- Типизация: Pydantic на backend, TypeScript на frontend
- Осмысленные названия переменных и функций
- Обработка всех ошибок с понятными сообщениями

### Безопасность
- Валидация всех входных данных
- Проверка типа и размера загружаемых файлов
- Очистка временных файлов после использования

## Типичные задачи

### Backend
- Добавить новый endpoint для предпросмотра документа
- Расширить `LABEL_MAPPING` для новых форматов
- Реализовать обработку многостраничных документов
- Добавить логирование операций
- Оптимизировать поиск ячеек в таблицах

### Frontend
- Создать компонент drag-and-drop загрузки файлов
- Реализовать форму редактирования реквизитов
- Добавить индикатор прогресса обработки
- Сделать адаптивную версию двухпанельного UI
- Добавить валидацию полей реквизитов

## Примеры кода

### Backend: endpoint заполнения

```python
from fastapi import APIRouter, UploadFile, File
from app.services.docx_filler import fill_document
from app.models.requisites import Requisites

router = APIRouter()

@router.post("/api/fill")
async def fill_template(
    file: UploadFile = File(...),
    requisites: Requisites
):
    # Сохранить временный файл
    temp_path = save_temp_file(file)

    try:
        # Заполнить документ
        output_path = fill_document(temp_path, requisites.dict())
        return {"filename": output_path.name}
    finally:
        # Удалить временный файл
        temp_path.unlink(missing_ok=True)
```

### Frontend: загрузка файла

```typescript
// api/client.ts
export async function extractRequisites(file: File): Promise<Requisites> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/extract-requisites', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to extract requisites');
  }

  return response.json();
}
```

## Последовательность работы

### Реализация новой функции

```
1. Изучение спецификации
   └─→ Прочитать требования
   └─→ Изучить существующий код
   └─→ Уточнить неясности

2. Разработка API (если нужно)
   └─→ Добавить endpoint
   └─→ Реализовать сервисную логику
   └─→ Написать тесты

3. Разработка UI
   └─→ Создать компоненты
   └─→ Подключить к API
   └─→ Стилизовать

4. Тестирование
   └─→ Ручное тестирование
   └─→ Исправление багов

5. Code review и merge
```

### Исправление бага

```
1. Воспроизведение
   └─→ Понять шаги воспроизведения
   └─→ Проверить логи

2. Диагностика
   └─→ Найти причину в коде
   └─→ Понять масштаб проблемы

3. Исправление
   └─→ Написать фикс
   └─→ Добавить тест на регрессию

4. Проверка
   └─→ Убедиться, что баг исправлен
   └─→ Проверить, что не сломано другое
```

## Критерии успеха

| Метрика | Целевое значение |
|---------|------------------|
| Время ответа API | < 500ms |
| Время загрузки UI | < 2s |
| Размер frontend bundle | < 500KB gzipped |
| Покрытие тестами | > 70% бизнес-логики |

## Чек-лист перед code review

- [ ] Backend запускается без ошибок
- [ ] Frontend собирается (`npm run build`)
- [ ] Линтер не выдаёт ошибок
- [ ] Тесты проходят
- [ ] Входные данные валидируются
- [ ] Ошибки обрабатываются с понятными сообщениями
- [ ] Временные файлы удаляются
- [ ] Нет хардкода (пути, URL)

## Инструменты

| Категория | Инструменты |
|-----------|-------------|
| IDE | VS Code + расширения (Python, ESLint, Tailwind) |
| API тестирование | Postman, curl, Swagger UI (/docs) |
| Отладка | Chrome DevTools, Python debugger |
| Git | Git, GitHub |

## Взаимодействие с командой

| Роль | Взаимодействие |
|------|----------------|
| **Архитектор** | Согласование технических решений |
| **UX-дизайнер** | Получение макетов, обсуждение UI |
| **QA-инженер** | Совместное тестирование, исправление багов |
| **Системный аналитик** | Уточнение требований |

## Полезные команды

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Инспекция документа
PYTHONIOENCODING=utf-8 python scripts/inspect_docx.py "file.docx"
```
