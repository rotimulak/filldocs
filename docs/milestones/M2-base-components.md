# M2: Frontend - Базовые компоненты

**Цель**: Создать переиспользуемые UI компоненты

**Используется в**: M3, M4

---

## Задачи

- [ ] `DropZone.tsx` — Drag & Drop зона с preview файла
- [ ] `Spinner.tsx` — Индикатор загрузки
- [ ] `JsonPreview.tsx` — Форматированный вывод JSON
- [ ] `useLocalStorage.ts` — Hook для работы с localStorage

---

## Компоненты

### DropZone.tsx

```typescript
interface DropZoneProps {
  onFile: (file: File) => void;
  accept?: string;           // ".doc,.docx"
  disabled?: boolean;
  loading?: boolean;
  label?: string;            // "Перетащите файл сюда"
  sublabel?: string;         // "или нажмите для выбора"
}
```

Функционал:
- Drag & Drop события (dragover, dragleave, drop)
- Клик для выбора файла (скрытый input)
- Визуальное состояние: idle / hover / disabled / loading
- Валидация типа файла
- Preview имени файла после выбора

### Spinner.tsx

```typescript
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;             // "Загрузка..."
}
```

Функционал:
- Анимированный спиннер (Tailwind animate-spin)
- Опциональный текст под спиннером

### JsonPreview.tsx

```typescript
interface JsonPreviewProps {
  data: Record<string, unknown>;
  title?: string;
  collapsible?: boolean;
}
```

Функционал:
- Форматированный вывод JSON с отступами
- Подсветка ключей/значений (разные цвета)
- Кнопка "Копировать"
- Опционально: сворачивание/разворачивание

### useLocalStorage.ts

```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void]
```

Функционал:
- Чтение при инициализации
- Запись с сериализацией JSON
- Метод clear для удаления
- Обработка ошибок парсинга

---

## Файлы

| Файл | Описание |
|------|----------|
| `frontend/src/components/DropZone.tsx` | Drag & Drop компонент |
| `frontend/src/components/Spinner.tsx` | Индикатор загрузки |
| `frontend/src/components/JsonPreview.tsx` | JSON viewer |
| `frontend/src/hooks/useLocalStorage.ts` | localStorage hook |

---

## Стили (Tailwind)

```css
/* DropZone состояния */
.dropzone-idle     { @apply border-2 border-dashed border-gray-300 }
.dropzone-hover    { @apply border-2 border-dashed border-blue-500 bg-blue-50 }
.dropzone-disabled { @apply border-2 border-dashed border-gray-200 bg-gray-100 opacity-50 }

/* Spinner */
.spinner { @apply animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full }
```

---

## Критерии завершения

- [ ] DropZone работает с drag & drop и кликом
- [ ] Spinner отображается с анимацией
- [ ] JsonPreview красиво форматирует JSON
- [ ] useLocalStorage сохраняет/загружает данные
- [ ] Все компоненты типизированы (TypeScript)
