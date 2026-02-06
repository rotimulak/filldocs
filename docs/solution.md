# Solution: Архитектура решения

## Обзор подхода

Двухэтапный процесс:
1. **Extract** — извлечение реквизитов из документа-источника
2. **Fill** — заполнение шаблона извлечёнными реквизитами

---

## 1. Алгоритм Extract (извлечение)

### Входные данные
- Документ .docx с таблицей реквизитов компании

### Алгоритм

```
extract(document) → Requisites

1. ЗАГРУЗКА
   doc = Document(path)
   tables = doc.tables

2. ПОИСК БЛОКА РЕКВИЗИТОВ
   scores = {}
   for table in tables:
       score = count_keyword_matches(table, LABEL_MAPPING)
       scores[table] = score

   requisites_table = max(scores, key=scores.get)
   if scores[requisites_table] < 3:
       raise Error("Блок реквизитов не найден")

3. ИЗВЛЕЧЕНИЕ ДАННЫХ
   result = {}
   for row in requisites_table.rows:
       label = get_label_cell(row).text.strip()
       value = get_value_cell(row).text.strip()

       if not value:  # пустая ячейка — пропуск
           continue

       keys = find_matching_keys(label, LABEL_MAPPING)
       for key in keys:
           result[key] = value

4. ВОЗВРАТ
   return Requisites(**result)
```

### Структура данных

```python
LABEL_MAPPING = {
    "наименование": "company_name",
    "фирменное наименование": "company_name",
    "инн": "inn",
    "кпп": "kpp",
    "инн и кпп": ["inn", "kpp"],  # составное поле
    "инн / кпп": ["inn", "kpp"],
    ...
}
```

---

## 2. Алгоритм Fill (заполнение)

### Входные данные
- Шаблон .docx с пустой таблицей реквизитов
- JSON с реквизитами из localStorage

### Алгоритм

```
fill(template, requisites) → FilledDocument

1. ЗАГРУЗКА
   doc = Document(template_path)
   tables = doc.tables

2. ПОИСК БЛОКА РЕКВИЗИТОВ (аналогично extract)
   requisites_table = find_requisites_table(tables)

3. ЗАПОЛНЕНИЕ
   filled = []
   skipped = []
   errors = []
   used_keys = set()

   for row in requisites_table.rows:
       label_cell = get_label_cell(row)
       value_cell = get_value_cell(row)
       label = label_cell.text.strip().lower()

       # Проверка: ячейка должна быть пустой
       if value_cell.text.strip():
           errors.append(f"Ячейка уже заполнена: {label}")
           continue

       # Поиск ключевиков
       keys = find_matching_keys(label, LABEL_MAPPING)
       if not keys:
           continue

       # Фильтр уже использованных
       keys = [k for k in keys if k not in used_keys]
       if not keys:
           skipped.append(label)
           continue

       # Сбор значений
       values = []
       for key in keys:
           if key in requisites:
               values.append(requisites[key])
               used_keys.add(key)

       if values:
           # Запись с сохранением стиля
           value_cell.text = " ".join(values)
           copy_style(label_cell, value_cell)
           filled.append({"label": label, "keys": keys})

4. СОХРАНЕНИЕ
   doc.save(output_path)

5. ВОЗВРАТ ОТЧЁТА
   return FillReport(
       filled=filled,
       skipped=skipped,
       errors=errors,
       total=len(requisites_table.rows)
   )
```

---

## 3. Определение колонок таблицы

### Стратегия авто-определения

```python
def get_label_and_value_columns(table):
    """
    Определяет индексы колонок метки и значения
    """
    num_cols = len(table.columns)

    if num_cols == 2:
        # [Метка | Значение]
        return (0, 1)

    elif num_cols == 3:
        # [№ п/п | Метка | Значение]
        # Проверяем первую колонку на номера
        first_col_is_numbers = all(
            row.cells[0].text.strip().isdigit() or row.cells[0].text.strip() == ""
            for row in table.rows[1:]  # пропуск заголовка
        )
        if first_col_is_numbers:
            return (1, 2)
        else:
            return (0, 1)  # fallback

    else:
        # Эвристика: метка в предпоследней, значение в последней
        return (num_cols - 2, num_cols - 1)
```

---

## 4. Обработка составных полей

### Пример: "ИНН / КПП"

```python
COMPOSITE_FIELDS = {
    "инн и кпп": ["inn", "kpp"],
    "инн / кпп": ["inn", "kpp"],
    "инн/кпп": ["inn", "kpp"],
    "р/с, к/с": ["account", "corr_account"],
}

def find_matching_keys(label: str, mapping: dict) -> list[str]:
    """
    Возвращает список ключей для метки.
    Для составных полей — несколько ключей.
    """
    label_lower = label.lower()

    # Сначала проверяем составные поля (более специфичные)
    for pattern, keys in COMPOSITE_FIELDS.items():
        if pattern in label_lower:
            return keys

    # Затем одиночные поля
    for pattern, key in mapping.items():
        if pattern in label_lower:
            return [key]

    return []
```

---

## 5. Сохранение стиля

### Копирование форматирования

```python
def copy_style(source_cell, target_cell):
    """
    Копирует стиль из ячейки-источника в целевую
    """
    if not target_cell.paragraphs:
        return

    target_para = target_cell.paragraphs[0]

    # Если есть текст в source — берём его стиль
    if source_cell.paragraphs and source_cell.paragraphs[0].runs:
        source_run = source_cell.paragraphs[0].runs[0]

        if target_para.runs:
            target_run = target_para.runs[0]
        else:
            target_run = target_para.add_run()

        # Копируем свойства шрифта
        target_run.font.name = source_run.font.name
        target_run.font.size = source_run.font.size
        target_run.font.bold = source_run.font.bold
```

---

## 6. localStorage

### Ключ и структура

```typescript
// Ключ
const STORAGE_KEY = "filldocs_requisites";

// Структура
interface StoredRequisites {
  requisites: Requisites;
  extractedFrom: string;  // имя файла источника
  extractedAt: string;    // ISO timestamp
}

// Hook
function useRequisites() {
  const [data, setData] = useLocalStorage<StoredRequisites | null>(
    STORAGE_KEY,
    null
  );

  return {
    requisites: data?.requisites ?? null,
    isLoaded: data !== null,
    save: (req: Requisites, filename: string) => {
      setData({
        requisites: req,
        extractedFrom: filename,
        extractedAt: new Date().toISOString()
      });
    },
    clear: () => setData(null)
  };
}
```

---

## 7. Архитектура компонентов

```
App.tsx
├── RequisitesPanel (левая)
│   ├── DropZone
│   ├── Spinner (при загрузке)
│   ├── JsonPreview (результат)
│   └── StatusBadge ("✓ Сохранено")
│
└── FillPanel (правая)
    ├── DropZone (disabled если нет реквизитов)
    ├── Spinner (при заполнении)
    ├── FillReport (результат)
    └── DownloadButton
```

---

## 8. Поток данных

```
┌─────────────────────────────────────────────────────────────────┐
│                        БРАУЗЕР                                  │
│                                                                 │
│  ┌──────────────┐              ┌──────────────┐                 │
│  │ RequisitesPanel│            │  FillPanel   │                 │
│  │              │              │              │                 │
│  │  [Drop .docx]│              │ [Drop .docx] │                 │
│  │      │       │              │      │       │                 │
│  │      ▼       │              │      ▼       │                 │
│  │  POST /extract              │  POST /fill  │                 │
│  │      │       │              │      │       │                 │
│  │      ▼       │              │      ▼       │                 │
│  │  JsonPreview │◀─────────────│  FillReport  │                 │
│  │      │       │  requisites  │      │       │                 │
│  │      ▼       │  from state  │      ▼       │                 │
│  │ localStorage │              │  [Download]  │                 │
│  └──────────────┘              └──────────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
