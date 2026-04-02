# Workflow Cheat Sheet

## 🚀 Quick Start

### Первоначальная настройка (один раз)
```bash
# 1. Setup git hooks
npm run setup:hooks

# 2. Setup Linear workflow
npm run linear:setup-workflow

# 3. Add "Need Design Review" state (уже сделано!)
# npm run linear:add-design-review

# 4. Configure GitHub integration in Linear
# Linear → Settings → Integrations → GitHub
```

---

## 📋 Ежедневная работа

### Создать новую фичу
```
1. Linear → New Issue
   Title: "Your feature"
   State: Need Design Review

2. Claude Code → /linear-start ROT-XX

3. Выберите рекомендации → Accept/Select/Modify

4. Claude автоматически разработает фичу
```

### Простой bug fix
```
1. Linear → New Issue
   State: Ready (skip design review)

2. Claude Code → /linear-start ROT-XX

3. Claude сразу начнет разработку
```

---

## 🔍 Design Review States

| State | Когда использовать |
|-------|-------------------|
| **Need Design Review** | Новые фичи, сложные изменения |
| **Ready** | Bug fixes, простые tasks |
| **In Progress** | Активная разработка |

---

## 💬 Claude Code Commands

```bash
# Начать работу над задачей
/linear-start ROT-XX

# Запустить design review вручную (любая задача)
/design-review

# Посмотреть доступные команды
/help
```

---

## 📊 Design Review Roles

| Роль | Что проверяет | Файл |
|------|---------------|------|
| 🏗️ Architect | Архитектура, tech stack | `.claude/roles/architect.md` |
| 🧪 QA | Тесты, edge cases | `.claude/roles/qa-engineer.md` |
| 🚀 DevOps | Deployment, мониторинг | `.claude/roles/devops-engineer.md` |
| 📊 Product | Бизнес-ценность, ROI | `.claude/roles/product-owner.md` |
| 🎨 UX | Usability, accessibility | `.claude/roles/ux-designer.md` |

---

## 🎯 Workflow Flow

```
Идея
  ↓
📋 Create issue → "Need Design Review"
  ↓
🔍 /linear-start ROT-XX
  ↓
  Multi-role review (автоматически)
  ↓
📝 Select recommendations (интерактивно)
  ↓
✅ Task → "Ready" (автоматически)
  ↓
🚀 Start implementation? yes
  ↓
  Claude разрабатывает (TDD)
  ↓
✅ Commit → Push → PR
  ↓
🎉 Merge → Done
```

---

## 🛠️ Useful Commands

```bash
# Linear
npm run linear:watch          # Monitor Linear for changes
npm run linear:check          # Check Linear status
npm run linear:setup-workflow # Re-setup workflow

# Testing
npm run test:all             # Run all tests
npm run test:backend         # Backend tests only
npm run test:frontend        # Frontend tests only

# Hooks
npm run setup:hooks          # Install git hooks
```

---

## 🐛 Troubleshooting

**Design review не запускается?**
- Проверьте что задача в состоянии "Need Design Review"
- Убедитесь что роли существуют в `.claude/roles/`

**Тесты падают локально?**
```bash
# Backend
cd backend && black . && ruff check . --fix && pytest

# Frontend
cd frontend && npm run lint -- --fix && npm test
```

**Linear не обновляется автоматически?**
- Проверьте GitHub integration в Linear
- Убедитесь что в commit есть `ROT-XXX`

---

## 📚 Полная документация

- [DESIGN-REVIEW-WORKFLOW.md](DESIGN-REVIEW-WORKFLOW.md) - полный гайд по design review
- [QUICKSTART-WORKFLOW.md](QUICKSTART-WORKFLOW.md) - быстрый старт
- [LINEAR-WORKFLOW-COMPLETE.md](LINEAR-WORKFLOW-COMPLETE.md) - все детали workflow
- [CLAUDE.md](CLAUDE.md) - про проект

---

## 💡 Tips

✅ **DO:**
- Используйте design review для новых фич
- Выбирайте только нужные рекомендации (MVP first!)
- Коммитьте часто
- Пишите тесты перед кодом

❌ **DON'T:**
- Не пропускайте design review для сложных фич
- Не принимайте все рекомендации слепо
- Не коммитьте без тестов
- Не делайте огромные PR
