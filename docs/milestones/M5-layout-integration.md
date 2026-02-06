# M5: Frontend - Интеграция Layout

**Цель**: Собрать двухколоночный адаптивный интерфейс

**Зависит от**: M3 (RequisitesPanel), M4 (FillPanel)

---

## Задачи

- [ ] Рефакторинг `App.tsx` — две панели side-by-side
- [ ] Tailwind grid: `md:grid-cols-2`
- [ ] Mobile: вертикальный layout (реквизиты сверху)
- [ ] Состояние реквизитов в App (поднятие state)
- [ ] Удалить старые компоненты (RequisitesForm, TemplateSelect)

---

## Новый App.tsx

```typescript
function App() {
  const [requisites, setRequisites] = useState<Requisites | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            FillDocs
          </h1>
          <p className="text-sm text-gray-500">
            Автоматическое заполнение реквизитов
          </p>
        </div>
      </header>

      {/* Main content - two columns */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Левая панель */}
          <RequisitesPanel onRequisitesChange={setRequisites} />

          {/* Правая панель */}
          <FillPanel requisites={requisites} />
        </div>
      </main>
    </div>
  );
}
```

---

## Layout

### Desktop (≥768px)

```
┌─────────────────────────────────────────────────────────────┐
│  FillDocs                                                   │
│  Автоматическое заполнение реквизитов                       │
├─────────────────────────────┬───────────────────────────────┤
│                             │                               │
│   RequisitesPanel           │   FillPanel                   │
│   (50% ширины)              │   (50% ширины)                │
│                             │                               │
│                             │                               │
│                             │                               │
└─────────────────────────────┴───────────────────────────────┘
```

### Mobile (<768px)

```
┌─────────────────────────────┐
│  FillDocs                   │
├─────────────────────────────┤
│                             │
│   RequisitesPanel           │
│   (100% ширины)             │
│                             │
├─────────────────────────────┤
│                             │
│   FillPanel                 │
│   (100% ширины)             │
│                             │
└─────────────────────────────┘
```

---

## Tailwind классы

```css
/* Контейнер двух панелей */
.panels-container {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

/* Панель */
.panel {
  @apply bg-white rounded-lg shadow p-6;
}

/* Заголовок панели */
.panel-title {
  @apply text-lg font-semibold text-gray-900 mb-4;
}
```

---

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `frontend/src/App.tsx` | Полный рефакторинг |
| `frontend/src/components/RequisitesForm.tsx` | Удалить |
| `frontend/src/components/TemplateSelect.tsx` | Удалить |

---

## Удаляемый код

Удалить старые компоненты (заменены на RequisitesPanel и FillPanel):
- `RequisitesForm.tsx`
- `TemplateSelect.tsx`

Удалить неиспользуемые импорты и типы.

---

## Критерии завершения

- [ ] Две панели отображаются side-by-side на desktop
- [ ] На mobile — вертикально (реквизиты сверху)
- [ ] State реквизитов передаётся между панелями
- [ ] Старые компоненты удалены
- [ ] Нет console errors/warnings
- [ ] Работает полный flow: загрузка реквизитов → заполнение → скачивание
