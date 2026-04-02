# Quick Start: Linear + Claude Code Workflow

## 🚀 Одноразовая настройка (5 минут)

### 1. Установите git hooks
```bash
npm run setup:hooks
```

### 2. Настройте Linear workflow
```bash
npm run linear:setup-workflow
```

### 3. Подключите GitHub в Linear
1. Откройте Linear → Settings → Integrations → GitHub
2. Connect repository: `your-username/filldocs`
3. Настройте auto-transitions:
   - **PR created** → move to "In Review"
   - **PR merged** → move to "Done"

### 4. Добавьте GitHub Secret
1. GitHub repo → Settings → Secrets → Actions
2. Создайте `LINEAR_API_KEY` = `YOUR_LINEAR_API_KEY`

✅ **Готово! Настройка завершена.**

---

## 💼 Ежедневная работа

### Начать задачу

1. **В Linear:** переместите задачу в "In Progress"

2. **Создайте ветку:**
   ```bash
   git checkout -b rot-15-add-error-handling
   ```

3. **Скажите Claude Code:**
   ```
   I'm working on ROT-15: Add comprehensive error handling

   [вставьте acceptance criteria из Linear]

   Please help me:
   1. Write acceptance tests
   2. Write unit tests (TDD approach)
   3. Implement the feature
   4. Run all tests
   ```

4. **Claude Code сделает:**
   - ✅ Напишет acceptance tests
   - ✅ Напишет unit tests (Red phase)
   - ✅ Реализует код (Green phase)
   - ✅ Запустит тесты
   - ✅ Рефакторинг

5. **Проверьте результат:**
   ```bash
   # Все тесты должны пройти
   npm run test:all
   ```

6. **Закоммитьте:**
   ```bash
   git add .
   git commit -m "ROT-15: Add comprehensive error handling

   - File size validation
   - Format validation
   - Error responses

   Tests: ✅ All passing"
   ```

   **Автоматически запустятся:**
   - ✅ Linting
   - ✅ Type checking
   - ✅ Tests

   Если что-то failed → коммит отменится.

7. **Push + PR:**
   ```bash
   git push origin rot-15-add-error-handling

   gh pr create --title "ROT-15: Add comprehensive error handling" \
     --body "Fixes ROT-15

   ## Changes
   - Added file validation
   - Added error handling

   ## Testing
   - ✅ Unit tests passing
   - ✅ Integration tests passing"
   ```

   **Linear автоматически:** `In Progress → In Review`

8. **CI/CD запустится:**
   - ✅ Backend tests
   - ✅ Frontend tests
   - ✅ Build test
   - ✅ Comment в Linear issue

9. **Merge PR:**
   ```bash
   gh pr merge --squash --delete-branch
   ```

   **Linear автоматически:** `In Review → Done`

---

## 📊 Workflow States

```
📋 Backlog        → задачи без acceptance criteria
    ↓
📝 Ready          → готова к работе (с AC)
    ↓
🚀 In Progress    → разработка (Claude Code работает)
    ↓
🧪 In Testing     → тесты проходят
    ↓
👀 In Review      → PR создан, ждет проверки
    ↓
✅ Done           → PR merged, deployed
```

---

## 🎯 Best Practices

### ✅ DO:
- Всегда начинайте с acceptance criteria
- Пишите тесты перед кодом (TDD)
- Делайте маленькие PR (< 400 lines)
- Используйте ROT-XXX в commit messages
- Запускайте тесты локально перед push

### ❌ DON'T:
- Не коммитьте без тестов
- Не пропускайте pre-commit hooks (`--no-verify`)
- Не создавайте огромные PR
- Не закрывайте issues вручную (автоматика сделает)

---

## 🔧 Useful Commands

```bash
# Проверить все тесты
npm run test:all

# Запустить Linear watcher (опционально)
npm run linear:watch

# Проверить статус Linear
npm run linear:check

# Проверить git hooks
git config core.hooksPath
```

---

## 🐛 Troubleshooting

### Pre-commit hook блокирует коммит?
```bash
# Исправьте проблемы
black backend/                    # форматирование
ruff check backend/ --fix         # линтинг
pytest tests/                     # тесты

# Попробуйте снова
git commit
```

### CI failed но локально работает?
```bash
# Запустите как в CI
docker-compose run backend pytest tests/
docker-compose run frontend npm test
```

### Linear не обновляется?
1. Проверьте GitHub integration в Linear
2. Убедитесь что в commit/PR есть `ROT-XXX`
3. Проверьте webhook logs в Linear

---

## 📚 Полная документация

- [LINEAR-WORKFLOW-COMPLETE.md](LINEAR-WORKFLOW-COMPLETE.md) - полный workflow
- [CLAUDE.md](CLAUDE.md) - про проект
- [docs/architecture.md](docs/architecture.md) - архитектура

---

## 🎓 Пример полного цикла

```bash
# 1. Начать задачу
git checkout -b rot-20-add-validation

# 2. Работа с Claude Code
# "Help me implement ROT-20: Add requisites validation..."

# 3. Тесты проходят локально
npm run test:all  # ✅

# 4. Коммит (автоматически запустятся hooks)
git commit -m "ROT-20: Add requisites validation"  # ✅

# 5. Push + PR
git push origin rot-20-add-validation
gh pr create --title "ROT-20: Add requisites validation"

# 6. CI проходит автоматически
# GitHub Actions → ✅ All tests passing

# 7. Merge
gh pr merge --squash

# 8. Linear автоматически → Done ✅
```

**Время на задачу:** 15-30 минут (с Claude Code)

---

**Вопросы?** Проверьте [LINEAR-WORKFLOW-COMPLETE.md](LINEAR-WORKFLOW-COMPLETE.md)
