# Linear + Claude Code Workflow

## Автоматический мониторинг задач

### Запуск Watcher

```bash
npm run linear:watch
```

Watcher будет:
- ✅ Проверять Linear каждые 30 секунд
- ✅ Обнаруживать задачи, перемещенные в "In Progress"
- ✅ Автоматически создавать git ветки
- ✅ Показывать детали задачи и prompt для Claude Code

### Workflow

1. **Откройте Linear** → выберите задачу → переместите в "In Progress"

2. **Watcher автоматически обнаружит** и покажет:
   ```
   🚀 NEW TASK STARTED: ROT-15
   ================================================================================

   📋 Title: Add comprehensive error handling for file uploads
   🔗 URL: https://linear.app/...

   📝 Description:
   Handle edge cases:
   - File too large (> 10MB)
   - Invalid file format (not .doc/.docx)
   ...

   🌿 Git Branch:
     ✓ Created branch: rot-15-add-comprehensive-error-handling

   💬 Claude Code Prompt:
   ────────────────────────────────────────────────────────────────────────────────
   I'm working on ROT-15: Add comprehensive error handling for file uploads

   Handle edge cases:
   - File too large (> 10MB)
   - Invalid file format (not .doc/.docx)
   ...
   ────────────────────────────────────────────────────────────────────────────────

   💡 Copy the prompt above and paste it into Claude Code to start working!
   ```

3. **Скопируйте prompt** и вставьте в Claude Code

4. **Claude Code начнет работу** над задачей:
   - Проанализирует код
   - Создаст план
   - Реализует решение
   - Создаст тесты

5. **После завершения:**
   - Claude Code создаст коммит
   - Можете создать PR через Claude Code или вручную
   - Переместите задачу в "Done" в Linear

## Полезные команды

```bash
# Запустить watcher
npm run linear:watch

# Проверить текущее состояние Linear
npm run linear:check

# Пересоздать проект (осторожно!)
npm run linear:setup
```

## Как это работает

1. **Linear Watcher** мониторит ваш Linear workspace
2. Когда задача переходит в "In Progress", watcher:
   - Сохраняет состояние в `.linear-watcher-state.json`
   - Создает git ветку с названием `{issue-id}-{sanitized-title}`
   - Выводит полную информацию о задаче
3. Вы копируете сгенерированный prompt и работаете с Claude Code
4. При завершении задачи watcher обнаруживает изменение статуса

## Настройки

Изменить в [scripts/linear-watcher.js](scripts/linear-watcher.js):

```javascript
const CHECK_INTERVAL = 30000; // Интервал проверки (мс)
```

## Остановка Watcher

Нажмите `Ctrl+C` в терминале где запущен watcher.

## Альтернативный подход: Slash команда

Если не хотите держать watcher запущенным, используйте slash команду:

```
/linear-start ROT-15
```

(Команду нужно создать отдельно)
