# M3: Frontend - Левая панель (Реквизиты)

**Цель**: Панель загрузки документа и отображения извлечённых реквизитов

**Зависит от**: M1 (Extract API), M2 (Базовые компоненты)

---

## Задачи

- [ ] `RequisitesPanel.tsx` — контейнер левой панели
- [ ] Интеграция DropZone для загрузки файла
- [ ] Вызов `POST /api/extract-requisites`
- [ ] Отображение результата в JsonPreview
- [ ] Сохранение в localStorage
- [ ] Восстановление из localStorage при загрузке
- [ ] Индикатор "✓ Сохранено в браузере"
- [ ] Кнопка "Очистить"

---

## Компонент RequisitesPanel

```typescript
interface RequisitesPanelProps {
  onRequisitesChange: (req: Requisites | null) => void;
}

// Состояния
type PanelState =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "success"; data: Requisites; source: "file" | "storage" }
  | { status: "error"; message: string }
```

---

## UI Состояния

| Состояние | Отображение |
|-----------|-------------|
| `empty` | DropZone с текстом "Загрузите документ с реквизитами" |
| `loading` | DropZone + Spinner + "Распознавание..." |
| `success (file)` | JsonPreview + "✓ Сохранено в браузере" + "Очистить" |
| `success (storage)` | JsonPreview + "Загружено из памяти" + "Очистить" |
| `error` | Красное сообщение + "Попробовать снова" |

---

## Логика

```typescript
function RequisitesPanel({ onRequisitesChange }: Props) {
  const [stored, setStored, clearStored] = useLocalStorage<StoredRequisites>(
    "filldocs_requisites",
    null
  );
  const [state, setState] = useState<PanelState>({ status: "empty" });

  // При монтировании — загрузить из localStorage
  useEffect(() => {
    if (stored) {
      setState({ status: "success", data: stored.requisites, source: "storage" });
      onRequisitesChange(stored.requisites);
    }
  }, []);

  // Обработка файла
  const handleFile = async (file: File) => {
    setState({ status: "loading" });
    try {
      const result = await api.extractRequisites(file);
      setStored({
        requisites: result.requisites,
        extractedFrom: file.name,
        extractedAt: new Date().toISOString()
      });
      setState({ status: "success", data: result.requisites, source: "file" });
      onRequisitesChange(result.requisites);
    } catch (e) {
      setState({ status: "error", message: e.message });
      onRequisitesChange(null);
    }
  };

  // Очистка
  const handleClear = () => {
    clearStored();
    setState({ status: "empty" });
    onRequisitesChange(null);
  };
}
```

---

## API Client (дополнение)

```typescript
// frontend/src/api/client.ts

async extractRequisites(file: File): Promise<ExtractResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/extract-requisites`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Ошибка извлечения");
  }

  return res.json();
}
```

---

## Типы (дополнение)

```typescript
// frontend/src/types/index.ts

interface ExtractResponse {
  success: boolean;
  requisites: Requisites;
  raw_fields: Array<{
    label: string;
    value: string;
    matched_key: string | null;
  }>;
  warnings: string[];
}

interface StoredRequisites {
  requisites: Requisites;
  extractedFrom: string;
  extractedAt: string;
}
```

---

## Файлы

| Файл | Изменения |
|------|-----------|
| `frontend/src/components/RequisitesPanel.tsx` | Новый компонент |
| `frontend/src/api/client.ts` | Добавить `extractRequisites()` |
| `frontend/src/types/index.ts` | Добавить `ExtractResponse`, `StoredRequisites` |

---

## Критерии завершения

- [ ] Загрузка файла через DropZone работает
- [ ] Реквизиты извлекаются и отображаются
- [ ] Данные сохраняются в localStorage
- [ ] При перезагрузке страницы — данные восстанавливаются
- [ ] Кнопка "Очистить" удаляет данные
- [ ] Ошибки отображаются корректно
