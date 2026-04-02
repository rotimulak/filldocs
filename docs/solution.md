# Solution: Алгоритмы и потоки данных (v2)

## Обзор подхода

Двухэтапный процесс с LLM в центре:
1. **Extract** — docx → текст → LLM → XML → JSON реквизитов
2. **Fill** — шаблон → поиск таблицы → LLM → инструкции → применение к docx

---

## 1. Алгоритм Extract (извлечение)

### Входные данные
- Документ .doc/.docx с реквизитами компании

### Поток

```
extract(document) → dict[str, str]

1. ЗАГРУЗКА И КОНВЕРТАЦИЯ
   if .doc → convert to .docx (pywin32/LibreOffice)
   docx_path = saved temp file

2. КОНВЕРТАЦИЯ В ТЕКСТ
   text = docx_to_text(docx_path)
   // Параграфы → plain text
   // Таблицы → Markdown pipe-separated формат
   // Порядок элементов сохраняется

3. ОТПРАВКА В LLM
   prompt = extract_prompt_template.format(document_text=text)
   response = await llm.messages.create(prompt)
   // LLM возвращает XML:
   // <requisites>
   //   <field name="ИНН">1234567890</field>
   //   <field name="Наименование">ООО Рога</field>
   // </requisites>

4. ПАРСИНГ ОТВЕТА
   xml_block = extract_xml_block(response)  // находит <requisites>...</requisites>
   result = parse_xml(xml_block)             // → {"ИНН": "1234567890", ...}

5. ВОЗВРАТ
   return result  // dict с русскими ключами
```

### Обработка ошибок

| Ситуация | HTTP | Сообщение |
|----------|------|-----------|
| Невалидный формат файла | 400 | "Недопустимый формат файла" |
| Файл слишком большой | 400 | "Файл слишком большой" |
| LLM вернул невалидный XML | 502 | "Ошибка разбора ответа LLM" |
| LLM таймаут | 502 | "Таймаут LLM API" |
| LLM API ошибка | 502 | "Ошибка LLM API" |
| LLM не нашёл реквизитов | 200 | success=false, пустой результат |

---

## 2. Алгоритм Fill (заполнение)

### Входные данные
- Шаблон .doc/.docx с таблицей для заполнения
- JSON с реквизитами из localStorage

### Поток

```
fill(template, requisites) → filled document

1. ЗАГРУЗКА И КОНВЕРТАЦИЯ
   if .doc → convert to .docx
   requisites_data = json.loads(requisites_string)

2. ПОИСК ТАБЛИЦЫ
   table_info = find_requisites_table(docx_path)
   // Эвристика: ищет таблицу с наибольшим числом совпадений
   // ключевых слов (ИНН, наименование, адрес...) из LABEL_MAPPING
   // Требует: ≥2 колонки, ≥2 совпадения

   if not table_info:
       tables = docx_tables_to_text(docx_path)  // fallback: первая таблица

   if not table_info:
       raise HTTP 400 "Таблица не найдена"

3. КОНВЕРТАЦИЯ РЕКВИЗИТОВ В XML
   xml = requisites_to_xml(requisites_data)
   // <requisites>
   //   <field name="ИНН">1234567890</field>
   //   ...
   // </requisites>

4. ГЕНЕРАЦИЯ ИНСТРУКЦИЙ ЧЕРЕЗ LLM
   prompt = fill_prompt_template.format(
       table_text=table_info["text"],      // Markdown-таблица
       requisites_xml=xml
   )
   response = await llm.messages.create(prompt)
   // LLM возвращает JSON:
   // [{"row": 1, "col": 2, "value": "1234567890"}, ...]

5. ПРИМЕНЕНИЕ ИНСТРУКЦИЙ
   doc = Document(docx_path)
   table = doc.tables[table_info["index"]]
   for instruction in instructions:
       row, col, value = instruction
       if row < len(table.rows) and col < len(cells):
           table.rows[row].cells[col].text = value
       else:
           log warning "out of bounds"
   doc.save(output_path)

6. ВОЗВРАТ
   return {filled_fields, total_instructions, download_url}
```

---

## 3. Конвертация docx → текст

### Модуль: `backend/app/services/docx_text.py`

Три функции:

#### `docx_to_text(path) → str`
- Итерирует элементы body документа в порядке появления
- Параграфы → plain text
- Таблицы → Markdown pipe-separated формат
- Разделитель: двойной перенос строки

#### `docx_tables_to_text(path) → list[dict]`
- Список всех таблиц с метаданными:
  - `index` — порядковый номер таблицы
  - `rows`, `cols` — размеры
  - `text` — Markdown-представление
  - `cells` — матрица текстов ячеек (для обратного маппинга)

#### `find_requisites_table(path) → dict | None`
- Скоринг каждой таблицы по совпадениям с LABEL_MAPPING / COMPOSITE_FIELDS
- Фильтр: ≥2 колонки
- Порог: ≥2 совпадения
- Возвращает таблицу с максимальным score

### Формат Markdown-таблицы

```
| № п/п | Наименование сведений | Данные участника |
| --- | --- | --- |
| 1 | Фирменное наименование | ООО Рога и Копыта |
| 2 | ИНН | 1234567890 |
```

---

## 4. LLM-промпты

### Промпт извлечения (`backend/app/prompts/extract.txt`)
- Роль: "специалист по извлечению реквизитов"
- Входные данные: полный текст документа
- Выходной формат: XML `<requisites><field name="...">...</field></requisites>`
- Правила: оригинальные русские названия, числовые поля только цифры, составные поля разделять

### Промпт заполнения (`backend/app/prompts/fill.txt`)
- Роль: "специалист по заполнению документов"
- Входные данные: Markdown-таблица + XML реквизитов
- Выходной формат: JSON массив `[{row, col, value}]`
- Правила: нумерация с 0, не перезаписывать метки, точные значения из реквизитов

---

## 5. localStorage

### Структура

```typescript
type Requisites = Record<string, string>;
// Динамический набор — ключи на русском от LLM

interface StoredRequisites {
  requisites: Requisites;
  extractedFrom: string;   // имя файла-источника
  extractedAt: string;     // ISO timestamp
}

const STORAGE_KEY = "filldocs_requisites";
```

---

## 6. Компоненты UI

```
App.tsx (3 колонки: lg:grid-cols-[1fr_1fr_280px])
├── RequisitesPanel (левая)
│   ├── DropZone (.doc/.docx)
│   ├── JsonPreview (динамические поля)
│   └── StatusBadge ("✓ Сохранено")
│
├── FillPanel (центральная)
│   ├── DropZone (disabled без реквизитов)
│   ├── FillReport ("Заполнено N из M")
│   └── DownloadButton
│
└── HeuristicsPanel (правая, информационная)
```
