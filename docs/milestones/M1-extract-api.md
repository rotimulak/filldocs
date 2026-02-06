# M1: Backend - Extract API

**Цель**: Реализовать извлечение реквизитов из загруженного документа

**Блокирует**: M3 (Левая панель)

---

## Задачи

- [ ] Добавить метод `extract()` в `DocxFiller`
- [ ] Реализовать обратный маппинг (label → json_key)
- [ ] Добавить endpoint `POST /api/extract-requisites`
- [ ] Обработка .doc файлов (конвертация в .docx)
- [ ] Автоудаление временных файлов после обработки

---

## Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `backend/app/services/docx_filler.py` | Добавить метод `extract(doc_path) → dict` |
| `backend/app/api/routes.py` | Добавить `@router.post("/extract-requisites")` |
| `backend/app/models/requisites.py` | Добавить `ExtractResponse` модель |

---

## API Спецификация

```
POST /api/extract-requisites
Content-Type: multipart/form-data

Request:
  - file: binary (.doc или .docx)

Response (200):
{
  "success": true,
  "requisites": {
    "company_name": "ООО Рога и Копыта",
    "inn": "1234567890",
    "kpp": "123456789",
    ...
  },
  "raw_fields": [
    {"label": "Наименование, фирменное наименование", "value": "ООО Рога и Копыта", "matched_key": "company_name"},
    {"label": "ИНН и КПП", "value": "1234567890", "matched_key": "inn"},
    ...
  ],
  "unmatched_count": 2
}

Response (400):
{
  "detail": "Не удалось распознать реквизиты в документе"
}
```

---

## Алгоритм extract()

```python
def extract(self, doc_path: Path) -> dict:
    """
    1. Открыть документ
    2. Найти все таблицы
    3. Для каждой строки таблицы:
       - Получить текст из столбца меток (col 1)
       - Получить текст из столбца значений (col 2)
       - Найти соответствие в REVERSE_MAPPING
       - Добавить в результат
    4. Вернуть словарь реквизитов
    """
```

---

## Критерии завершения

- [ ] API возвращает корректный JSON с реквизитами
- [ ] Поддержка .doc и .docx файлов
- [ ] Временные файлы удаляются
- [ ] Обработка ошибок (пустой документ, нет таблиц)
