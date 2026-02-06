# QA-инженер

> **Навигация:** [← Роли](./README.md)

---

## Обзор роли

QA-инженер отвечает за качество кода и стабильность системы FillDocs через создание тестов, проведение тестирования и обеспечение покрытия кодовой базы.

## Ключевые обязанности

### Юнит-тестирование
- Написание unit-тестов для backend-сервисов (Python/pytest)
- Тестирование React-компонентов (Vitest + Testing Library)
- Тестирование алгоритма сопоставления лейблов
- Мокирование файловых операций и внешних зависимостей
- Поддержание покрытия кода на уровне > 80%

### Интеграционное тестирование
- Тестирование API endpoints
- Проверка обработки документов end-to-end
- Тестирование загрузки и скачивания файлов
- Проверка валидации входных данных

### E2E тестирование
- Сценарные тесты критических пользовательских путей
- Тестирование двухпанельного интерфейса
- Проверка работы с localStorage
- Тестирование drag-and-drop загрузки

### Code Review
- Ревью тестов в pull requests
- Проверка тестируемости нового кода
- Рекомендации по улучшению покрытия

## Стек технологий

### Backend (Python/FastAPI)

| Инструмент | Назначение |
|------------|------------|
| pytest | Unit и интеграционные тесты |
| pytest-asyncio | Тестирование async функций |
| httpx | Тестирование HTTP endpoints |
| pytest-cov | Покрытие кода |

### Frontend (React/TypeScript)

| Инструмент | Назначение |
|------------|------------|
| Vitest | Unit-тесты |
| React Testing Library | Тестирование UI компонентов |
| Playwright | E2E тестирование |
| MSW (Mock Service Worker) | Мокирование API |

## Принципы тестирования

| Принцип | Описание |
|---------|----------|
| **Изоляция** | Каждый тест независим и не влияет на другие |
| **Детерминизм** | Тесты дают одинаковый результат при повторных запусках |
| **Скорость** | Unit-тесты выполняются < 100ms каждый |
| **Читаемость** | Тест — документация поведения системы |
| **AAA-паттерн** | Arrange → Act → Assert |

## Структура тестов

```
filldocs/
├── backend/
│   ├── app/
│   │   └── services/
│   │       └── docx_filler.py
│   └── tests/
│       ├── unit/
│       │   ├── test_docx_filler.py
│       │   └── test_label_mapping.py
│       ├── integration/
│       │   ├── test_extract_api.py
│       │   └── test_fill_api.py
│       └── conftest.py
│
└── frontend/
    ├── src/
    │   └── components/
    └── tests/
        ├── unit/
        │   ├── RequisitesForm.test.tsx
        │   └── FileUploader.test.tsx
        └── e2e/
            └── fill-document.spec.ts
```

## Примеры тестов

### Backend: тест сервиса заполнения

```python
# tests/unit/test_docx_filler.py
import pytest
from app.services.docx_filler import fill_document, find_label_in_table

class TestLabelMapping:
    def test_find_inn_label(self):
        """Должен найти лейбл ИНН в различных форматах"""
        # Arrange
        labels = ["ИНН", "ИНН/КПП", "ИНН организации"]

        # Act & Assert
        for label in labels:
            result = find_label_in_table(label, "inn")
            assert result is True

    def test_unknown_label_returns_none(self):
        """Неизвестный лейбл должен вернуть None"""
        result = find_label_in_table("Неизвестное поле", "unknown")
        assert result is None


class TestFillDocument:
    @pytest.fixture
    def sample_requisites(self):
        return {
            "company_name": "ООО Тест",
            "inn": "1234567890",
            "kpp": "123456789",
        }

    def test_fill_document_with_valid_data(self, sample_requisites, tmp_path):
        """Должен заполнить документ корректными данными"""
        # Arrange
        template_path = tmp_path / "template.docx"
        create_test_template(template_path)

        # Act
        result_path = fill_document(template_path, sample_requisites)

        # Assert
        assert result_path.exists()
        # Проверить содержимое документа
```

### Backend: интеграционный тест API

```python
# tests/integration/test_fill_api.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_fill_endpoint_success():
    """POST /api/fill должен вернуть заполненный документ"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Arrange
        with open("tests/fixtures/template.docx", "rb") as f:
            files = {"file": ("template.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            data = {"requisites": '{"company_name": "ООО Тест", "inn": "1234567890"}'}

            # Act
            response = await client.post("/api/fill", files=files, data=data)

        # Assert
        assert response.status_code == 200
        assert "filename" in response.json()


@pytest.mark.asyncio
async def test_fill_endpoint_invalid_file():
    """POST /api/fill должен вернуть 400 для неверного формата"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        files = {"file": ("test.txt", b"not a docx", "text/plain")}
        data = {"requisites": "{}"}

        response = await client.post("/api/fill", files=files, data=data)

        assert response.status_code == 400
```

### Frontend: тест компонента

```typescript
// tests/unit/RequisitesForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RequisitesForm } from '@/components/RequisitesForm';

describe('RequisitesForm', () => {
  it('should render all requisite fields', () => {
    render(<RequisitesForm requisites={{}} onSave={vi.fn()} />);

    expect(screen.getByLabelText(/название компании/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/инн/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/кпп/i)).toBeInTheDocument();
  });

  it('should call onSave with updated values', async () => {
    const onSave = vi.fn();
    render(<RequisitesForm requisites={{}} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/инн/i), {
      target: { value: '1234567890' },
    });
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ inn: '1234567890' })
    );
  });

  it('should load values from localStorage', () => {
    localStorage.setItem('requisites', JSON.stringify({ inn: '9876543210' }));

    render(<RequisitesForm requisites={{ inn: '9876543210' }} onSave={vi.fn()} />);

    expect(screen.getByLabelText(/инн/i)).toHaveValue('9876543210');
  });
});
```

## Метрики качества

| Метрика | Целевое значение |
|---------|------------------|
| Code Coverage (lines) | > 80% |
| Code Coverage (branches) | > 70% |
| Unit-тесты на сервис | 100% публичных методов |
| Время выполнения unit-тестов | < 30 сек |
| Время выполнения integration-тестов | < 2 мин |

## Команды запуска тестов

```bash
# Backend
cd backend
pytest                           # Все тесты
pytest tests/unit               # Только unit-тесты
pytest --cov=app --cov-report=html  # С покрытием

# Frontend
cd frontend
npm run test                    # Все тесты
npm run test:unit              # Только unit-тесты
npm run test:e2e               # E2E тесты
npm run test:coverage          # С покрытием
```

## Чеклист перед merge

- [ ] Все существующие тесты проходят
- [ ] Новый код покрыт unit-тестами
- [ ] Критические пути покрыты интеграционными тестами
- [ ] Coverage не упал ниже порога
- [ ] Нет flaky-тестов
- [ ] Тесты запускаются локально

## Тестовые сценарии FillDocs

### Извлечение реквизитов
1. Загрузка валидного .docx с таблицей реквизитов
2. Загрузка .doc (конвертация в .docx)
3. Загрузка файла без таблиц
4. Загрузка файла с нестандартной структурой таблицы
5. Загрузка слишком большого файла
6. Загрузка неподдерживаемого формата

### Заполнение шаблона
1. Заполнение шаблона полным набором реквизитов
2. Заполнение шаблона частичными реквизитами
3. Заполнение шаблона с пустыми полями
4. Сохранение форматирования документа
5. Обработка документа с несколькими таблицами

### UI/UX
1. Drag-and-drop загрузка файла
2. Сохранение реквизитов в localStorage
3. Восстановление реквизитов после перезагрузки
4. Отображение ошибок валидации
5. Индикатор прогресса обработки

## Взаимодействие с командой

| Роль | Взаимодействие |
|------|----------------|
| Разработчик | Код-ревью тестов, консультации по тестируемости |
| Архитектор | Согласование стратегии тестирования |
