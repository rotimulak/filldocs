# M4: Frontend - Правая панель (Заполнение)

**Цель**: Панель заполнения шаблона и скачивания результата

**Зависит от**: M2 (Базовые компоненты), M3 (Реквизиты в state)

---

## Задачи

- [ ] `FillPanel.tsx` — контейнер правой панели
- [ ] `FillReport.tsx` — отчёт о заполнении
- [ ] DropZone для загрузки шаблона
- [ ] Блокировка если нет реквизитов
- [ ] Вызов `POST /api/fill`
- [ ] Отображение отчёта (все поля + ошибки)
- [ ] Кнопка скачивания

---

## Компонент FillPanel

```typescript
interface FillPanelProps {
  requisites: Requisites | null;
}

type PanelState =
  | { status: "disabled" }           // нет реквизитов
  | { status: "ready" }              // готов к загрузке
  | { status: "loading" }            // заполнение
  | { status: "success"; report: FillReportData; downloadUrl: string }
  | { status: "error"; message: string }
```

---

## Компонент FillReport

```typescript
interface FillReportData {
  filled: Array<{
    label: string;
    key: string;
    value: string;
    count: number;      // сколько раз вставлено
  }>;
  skipped: Array<{
    label: string;
    key: string;
    reason: string;     // "уже использовано" | "нет значения"
  }>;
  errors: Array<{
    label: string;
    message: string;    // "ячейка уже заполнена"
  }>;
  summary: {
    total_fields: number;
    filled_count: number;
    skipped_count: number;
    error_count: number;
  };
}
```

### Отображение FillReport

```
┌─────────────────────────────────────────────────┐
│  Результат заполнения                           │
│  ─────────────────────────────────────────────  │
│                                                 │
│  ✓ Заполнено: 8 полей                           │
│  ─ Пропущено: 2 поля                            │
│  ✗ Ошибки: 1                                    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ ✓ Наименование          ООО "Рога..."   │    │
│  │ ✓ ИНН                   1234567890      │    │
│  │ ✓ КПП                   123456789       │    │
│  │ ─ ОГРН                  (нет значения)  │    │
│  │ ✓ Адрес                 г. Москва...    │    │
│  │ ✗ Телефон               ячейка занята   │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [ Скачать документ ]                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## UI Состояния

| Состояние | Отображение |
|-----------|-------------|
| `disabled` | DropZone серая + "Сначала загрузите реквизиты" |
| `ready` | DropZone активная + "Загрузите шаблон для заполнения" |
| `loading` | DropZone + Spinner + "Заполнение документа..." |
| `success` | FillReport + кнопка "Скачать" |
| `error` | Красное сообщение + "Попробовать снова" |

---

## Логика

```typescript
function FillPanel({ requisites }: Props) {
  const [state, setState] = useState<PanelState>(
    requisites ? { status: "ready" } : { status: "disabled" }
  );

  // Обновление при изменении реквизитов
  useEffect(() => {
    if (!requisites) {
      setState({ status: "disabled" });
    } else if (state.status === "disabled") {
      setState({ status: "ready" });
    }
  }, [requisites]);

  // Обработка файла
  const handleFile = async (file: File) => {
    if (!requisites) return;

    setState({ status: "loading" });
    try {
      const result = await api.fillDocument(file, requisites);
      setState({
        status: "success",
        report: result.report,
        downloadUrl: result.download_url
      });
    } catch (e) {
      setState({ status: "error", message: e.message });
    }
  };

  // Скачивание
  const handleDownload = () => {
    if (state.status === "success") {
      api.downloadFile(state.downloadUrl);
    }
  };
}
```

---

## API (обновление)

```typescript
// Обновить тип ответа /api/fill
interface FillResponse {
  success: boolean;
  download_url: string;
  report: FillReportData;
}

// Обновить метод
async fillDocument(file: File, requisites: Requisites): Promise<FillResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("requisites", JSON.stringify(requisites));

  const res = await fetch(`${API_BASE}/fill`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Ошибка заполнения");
  }

  return res.json();
}
```

---

## Файлы

| Файл | Изменения |
|------|-----------|
| `frontend/src/components/FillPanel.tsx` | Новый компонент |
| `frontend/src/components/FillReport.tsx` | Новый компонент |
| `frontend/src/api/client.ts` | Обновить `fillDocument()` |
| `frontend/src/types/index.ts` | Добавить `FillReportData` |
| `backend/app/api/routes.py` | Обновить ответ `/api/fill` |

---

## Критерии завершения

- [ ] Панель заблокирована без реквизитов
- [ ] Загрузка шаблона работает
- [ ] Отчёт показывает все поля (заполненные, пропущенные, ошибки)
- [ ] Кнопка скачивания работает
- [ ] После скачивания можно загрузить новый шаблон
