# Getting Started with FillDocs Development Workflow

## 🎉 Что уже настроено

✅ **Linear проект полностью настроен:**
- Project: "FillDocs v1.0"
- Milestone: "v1.0 Release"
- 28 задач с приоритетами
- Workflow states (включая "Need Design Review")
- Issue template

✅ **Design Review система:**
- 5 ролей для мультироль-ревью
- Автоматический процесс через `/linear-start`
- Интерактивный выбор рекомендаций

✅ **CI/CD pipeline:**
- GitHub Actions workflow
- Pre-commit hooks
- Automated testing

✅ **Интеграция Claude Code + Linear:**
- Watcher для мониторинга
- Slash команды для автоматизации
- TDD workflow

---

## 🚀 Что нужно сделать сейчас (5 минут)

### 1. Настройте GitHub Integration в Linear

```
1. Откройте Linear → Settings → Integrations → GitHub
2. Click "Connect GitHub"
3. Выберите ваш репозиторий
4. Настройте auto-transitions:
   - When PR is created → move to "In Review"
   - When PR is merged → move to "Done"
5. Save
```

### 2. Добавьте GitHub Secret

```
1. GitHub → Settings → Secrets and variables → Actions
2. New repository secret:
   Name: LINEAR_API_KEY
   Value: YOUR_LINEAR_API_KEY
3. Save
```

### 3. Установите git hooks (опционально)

```bash
npm run setup:hooks
```

---

## 📖 Как начать работу

### Вариант 1: С design review (для новых фич)

```
1. Linear → Create issue
   Title: "Add batch processing feature"
   Description: "Brief description"
   State: Need Design Review ← важно!

2. Claude Code:
   /linear-start ROT-XX

3. Пройдите design review:
   - Посмотрите рекомендации от 5 ролей
   - Выберите что включить (1-4)
   - Подтвердите обновление задачи

4. Claude автоматически:
   - Создаст git ветку
   - Напишет тесты
   - Реализует фичу
   - Запустит тесты
   - Создаст commit

5. Проверьте результат:
   npm run test:all

6. Push + PR:
   git push origin <branch>
   gh pr create

7. Merge → Linear автоматически → Done
```

### Вариант 2: Без design review (для bug fixes)

```
1. Linear → Create issue
   State: Ready ← пропустить review

2. Claude Code:
   /linear-start ROT-XX

3. Claude сразу начнет разработку
```

---

## 📚 Документация

### Быстрый старт:
- **[WORKFLOW-CHEATSHEET.md](WORKFLOW-CHEATSHEET.md)** ← начните здесь!

### Детальные гайды:
- [DESIGN-REVIEW-WORKFLOW.md](DESIGN-REVIEW-WORKFLOW.md) - про design review
- [QUICKSTART-WORKFLOW.md](QUICKSTART-WORKFLOW.md) - ежедневная работа
- [LINEAR-WORKFLOW-COMPLETE.md](LINEAR-WORKFLOW-COMPLETE.md) - полный workflow

### Про проект:
- [CLAUDE.md](CLAUDE.md) - про FillDocs
- [docs/architecture.md](docs/architecture.md) - архитектура

---

## 🔧 Доступные команды

### Linear интеграция
```bash
npm run linear:watch              # Monitor Linear (watcher)
npm run linear:check              # Проверить статус
npm run linear:setup-workflow     # Пересоздать workflow
npm run linear:add-design-review  # Добавить design review state
```

### Тестирование
```bash
npm run test:all        # Все тесты
npm run test:backend    # Backend
npm run test:frontend   # Frontend
```

### Разработка
```bash
npm run setup:hooks     # Установить git hooks

# Backend
cd backend
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev
```

---

## 🎯 Рекомендуемый Workflow

### Для новых фич:
```
Need Design Review → /linear-start → Select recommendations →
Ready → Implementation (TDD) → In Progress → In Testing →
In Review → PR → Merge → Done
```

### Для bug fixes:
```
Ready → /linear-start → Implementation → In Progress →
In Testing → In Review → PR → Merge → Done
```

---

## 💡 Pro Tips

1. **Запустите watcher в отдельном терминале:**
   ```bash
   npm run linear:watch
   ```
   Он будет показывать когда задачи меняют статус

2. **Используйте design review для:**
   - Новых фич
   - Сложных изменений
   - Когда нужен feedback с разных перспектив

3. **Пропускайте design review для:**
   - Bug fixes
   - Простых изменений
   - Рефакторинга

4. **Выбирайте рекомендации осознанно:**
   - "Accept all" → full implementation
   - "Select specific" → MVP first (recommended!)
   - "Modify" → custom approach

5. **Коммитьте часто:**
   - Pre-commit hooks проверят quality
   - Если что-то failed → исправите сразу

---

## 🐛 Troubleshooting

**Claude Code не видит Linear?**
- Проверьте что MCP сервер подключен (см. скриншот который вы показывали)
- Перезапустите Cursor

**Design review не работает?**
- Убедитесь что задача в состоянии "Need Design Review"
- Проверьте что файлы существуют в `.claude/roles/`

**Тесты падают?**
```bash
# Исправьте форматирование
cd backend && black . && ruff check . --fix
cd frontend && npm run lint -- --fix

# Запустите снова
npm run test:all
```

**Git hooks блокируют commit?**
- Исправьте ошибки которые показывает hook
- Или временно пропустите: `git commit --no-verify` (не рекомендуется!)

---

## 🎓 Пример полного цикла

```bash
# 1. Создайте задачу в Linear
# Title: "Add file validation"
# State: Need Design Review

# 2. В Claude Code
/linear-start ROT-55

# Claude проводит design review → вы выбираете рекомендации → Claude реализует

# 3. Проверьте результат
npm run test:all  # ✅ All passing

# 4. Commit уже создан Claude Code, push
git push origin rot-55-add-file-validation

# 5. Создайте PR
gh pr create --title "ROT-55: Add file validation" \
  --body "Fixes ROT-55

  ## Changes
  - File size validation
  - Format validation
  - Error messages

  ## Testing
  - ✅ Unit tests
  - ✅ Integration tests"

# 6. CI пройдет → Review (если нужно) → Merge
gh pr merge --squash

# 7. Linear автоматически → Done ✅
```

**Время:** 15-30 минут с Claude Code (vs несколько часов вручную)

---

## 🚦 Следующие шаги

1. ✅ Прочитайте [WORKFLOW-CHEATSHEET.md](WORKFLOW-CHEATSHEET.md)
2. ✅ Настройте GitHub integration (2 мин)
3. ✅ Попробуйте `/linear-start` на тестовой задаче
4. ✅ Начните работу над реальными задачами!

---

## 💬 Вопросы?

Проверьте документацию:
- [DESIGN-REVIEW-WORKFLOW.md](DESIGN-REVIEW-WORKFLOW.md)
- [LINEAR-WORKFLOW-COMPLETE.md](LINEAR-WORKFLOW-COMPLETE.md)
- [WORKFLOW-CHEATSHEET.md](WORKFLOW-CHEATSHEET.md)

Или спросите Claude Code в чате!

---

**Готово! Система полностью настроена и готова к использованию! 🎉**
