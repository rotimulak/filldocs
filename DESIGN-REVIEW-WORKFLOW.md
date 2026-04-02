# Design Review Workflow

Полный процесс от идеи до реализации с мультироль-ревью.

## Workflow States

```
💡 Идея
    ↓
📋 Backlog (или создать сразу в Need Design Review)
    ↓
🔍 Need Design Review ← NEW! Auto design review
    ↓
    [Интерактивный выбор правок]
    ↓
📝 Ready (задача с acceptance criteria)
    ↓
🚀 In Progress (разработка с TDD)
    ↓
🧪 In Testing (тесты проходят)
    ↓
👀 In Review (code review)
    ↓
✅ Done (merged, deployed)
```

---

## Роли в Design Review

Каждая задача оценивается с 5 перспектив:

### 🏗️ Software Architect
- Архитектурные решения
- Технологический стек
- Производительность и масштабируемость
- Интеграция с существующей системой
- Безопасность

**Файл:** `.claude/roles/architect.md`

### 🧪 QA Engineer
- Стратегия тестирования
- Edge cases
- Acceptance criteria
- Quality risks
- Автоматизация тестов

**Файл:** `.claude/roles/qa-engineer.md`

### 🚀 DevOps Engineer
- Deployment стратегия
- Инфраструктура
- Мониторинг
- Масштабируемость
- Операционные риски

**Файл:** `.claude/roles/devops-engineer.md`

### 📊 Product Owner
- Бизнес-ценность
- Пользовательские потребности
- ROI и метрики
- Приоритеты
- Scope management

**Файл:** `.claude/roles/product-owner.md`

### 🎨 UX Designer
- Usability
- Accessibility
- User experience
- Visual design
- Interaction patterns

**Файл:** `.claude/roles/ux-designer.md`

---

## Полный цикл задачи

### 1. Создание задачи в Linear

```
Linear → New Issue:
Title: "Add batch document processing"
Description: "Allow users to upload multiple documents and fill them all with same requisites"
State: Need Design Review ← важно!
```

### 2. Запуск Design Review

В Claude Code:
```
/linear-start ROT-50
```

Claude автоматически:
```
📋 Loading ROT-50: "Add batch document processing"
📊 State: Need Design Review

🔍 Starting multi-role design review...

Reading role files:
✓ architect.md
✓ qa-engineer.md
✓ devops-engineer.md
✓ product-owner.md
✓ ux-designer.md

Conducting reviews from each perspective...
```

### 3. Получение результатов review

Claude показывает:

```markdown
# Design Review: ROT-50 - Add batch document processing

## 🏗️ Architecture Review

### ✅ Approved
- Fits with microservices architecture
- Can reuse existing DocumentProcessor

### ⚠️ Concerns
- Need queue system for async processing
- Database required for batch job tracking
- Potential memory issues with large batches

### 💡 Suggestions
- Use Redis for job queue
- Limit batch size to 50 documents
- Implement background worker pattern

### 📋 Requirements
- Add PostgreSQL for job persistence
- Add Redis for queue
- Create BatchJob model

---

## 🧪 QA Review

### ✅ Quality Strengths
- Clear user value
- Well-defined happy path

### ⚠️ Testing Concerns
- Complex edge cases with partial failures
- Need transaction rollback strategy

### 🧪 Test Strategy

**Unit Tests:**
- BatchProcessor.create_batch()
- BatchProcessor.process_item()
- BatchProcessor.handle_failure()

**Integration Tests:**
- Full batch upload flow
- Partial failure scenarios
- Concurrent batch processing

**Edge Cases:**
- Empty batch
- Duplicate documents
- Mixed valid/invalid files
- Worker crashes mid-batch

### 📋 AC Improvements
- Add: "Handle partial batch failures gracefully"
- Add: "Retry failed items up to 3 times"
- Add: "Notify user when batch completes"

---

## 🚀 DevOps Review

### ✅ Ops-Friendly
- Background processing won't block API

### ⚠️ Concerns
- Need worker scaling strategy
- Monitoring for stuck jobs
- Cleanup for old job records

### 🔧 Infrastructure
- Add Redis container
- Add background worker service
- Configure job retention policy

### 📊 Monitoring
**Metrics:**
- batch_jobs_created
- batch_items_processed
- batch_processing_time
- batch_failures

**Alerts:**
- Jobs stuck > 1 hour
- Redis queue depth > 1000
- Worker not processing

---

## 📊 Product Review

### ✅ Business Value
- Major UX improvement
- Saves users time
- Competitive advantage

### 🎯 User Benefits
- Process 10+ documents in one click
- No need to repeat requisites input
- Track batch progress

### ⚠️ Concerns
- Complex feature, higher support load
- Need clear error messaging

### 📊 Success Metrics
- % users using batch vs single
- Average batch size
- Time saved per user
- User satisfaction score

---

## 🎨 UX Review

### ✅ UX Strengths
- Solves real user pain point

### ⚠️ Usability Concerns
- Need clear batch upload UI
- Progress indication crucial
- Error recovery UX important

### 🎨 Design Recommendations

**UI Components:**
- Drag-drop multi-file upload
- Progress bar with file names
- Success/failure summary table

**User Flow:**
1. Select "Batch Mode"
2. Upload multiple files
3. Confirm requisites
4. See progress in real-time
5. Download all or individual files

**Error Handling:**
- Show which files failed with reasons
- Allow retry of failed files
- Allow download of successful ones

---

## 📋 Synthesized Recommendations

### 🔴 Critical (must address):
1. Add database for batch job tracking
2. Implement queue system (Redis)
3. Add background worker
4. Handle partial failures gracefully
5. Implement retry logic

### 🟡 Important (should address):
6. Add real-time progress updates
7. Implement batch size limit (50)
8. Add monitoring and alerts
9. Create clear error messages
10. Add user notifications

### 🟢 Nice to have (consider):
11. Email notification when complete
12. Schedule batch for later
13. Save batch as template
14. Export batch results as CSV

---

## 📝 Enhanced Acceptance Criteria

- [ ] **Upload**: Accept multiple .docx files (max 50)
- [ ] **Validation**: Validate all files before processing
- [ ] **Queue**: Add batch job to Redis queue
- [ ] **Processing**: Process files in background worker
- [ ] **Progress**: Show real-time progress to user
- [ ] **Partial Failures**: Handle some files failing
- [ ] **Retry**: Retry failed files up to 3 times
- [ ] **Notification**: Notify user when batch completes
- [ ] **Download**: Allow downloading all successful files
- [ ] **Errors**: Clear error messages for each failure
- [ ] **Monitoring**: Track batch job metrics

## 🧪 Testing Strategy

**Unit Tests:**
- BatchJobService.create()
- BatchWorker.process_batch()
- BatchItemProcessor.process()
- RetryLogic.should_retry()

**Integration Tests:**
- POST /api/batch with 10 files → success
- POST /api/batch with mixed valid/invalid → partial success
- GET /api/batch/{id}/progress → returns progress
- POST /api/batch with > 50 files → rejects

**Edge Cases:**
- Empty batch
- All files invalid
- Worker crashes mid-process
- Redis connection lost
- User uploads duplicate files
```

### 4. Интерактивный выбор

Claude спрашивает:

```
✅ Design review complete!

What would you like to do?

1. ✅ Accept all recommendations (11 AC items)
   → Full implementation with all features

2. 🎯 Select specific recommendations
   → Choose MVP features

3. ✏️  Modify and refine
   → Edit the specification

4. ❌ Reject and use original
   → Minimal implementation

Your choice (1-4):
```

**Вы выбираете:** `2` (MVP)

```
Select which recommendations to include:

Critical Issues (must address):
[x] 1. Add database for batch job tracking
[x] 2. Implement queue system (Redis)
[x] 3. Add background worker
[x] 4. Handle partial failures
[x] 5. Implement retry logic

Important (should address):
[ ] 6. Real-time progress updates (later)
[x] 7. Batch size limit (50)
[ ] 8. Monitoring and alerts (later)
[x] 9. Clear error messages
[ ] 10. User notifications (later)

Nice to have:
[ ] 11. Email notification (future)
[ ] 12. Schedule batch (future)
[ ] 13. Save as template (future)
[ ] 14. Export CSV (future)

Select items (e.g. "1,2,3,4,5,7,9"): 1,2,3,4,5,7,9
```

**Вы вводите:** `1,2,3,4,5,7,9`

```
✅ Creating MVP specification with selected items

Updated Acceptance Criteria (7 items):
- [ ] Upload multiple files (max 50)
- [ ] Add to Redis queue
- [ ] Process in background worker
- [ ] Handle partial failures
- [ ] Retry failed items (3x)
- [ ] Enforce batch size limit
- [ ] Show clear error messages

Testing Strategy:
- Unit tests for BatchService, Worker, Retry logic
- Integration tests for upload, processing, failures
- Edge cases: empty batch, all invalid, worker crash

Technical Requirements:
- PostgreSQL: BatchJob model
- Redis: Job queue
- Background worker service

Update ROT-50 in Linear with this specification? (yes/no)
```

**Вы:** `yes`

### 5. Обновление Linear

```
✅ Updating ROT-50 in Linear...

Added:
- Enhanced description with technical requirements
- 7 acceptance criteria items
- Testing strategy
- Labels: backend, enhancement
- Priority: 2 (High)

Moving to "Ready"...

✅ Task updated!
🔗 https://linear.app/ROT/issue/ROT-50

Start implementation now? (yes/no)
```

**Вы:** `yes`

### 6. Автоматическая разработка

```
🌿 Creating branch rot-50-add-batch-processing...
✓ Branch created: rot-50-add-batch-processing
✓ Checked out

📝 Creating implementation plan...

✓ Todo list created:
  1. Design BatchJob database model
  2. Write unit tests for BatchJob
  3. Implement BatchJob model
  4. Design BatchService
  5. Write unit tests for BatchService
  6. Implement BatchService
  7. Setup Redis queue
  8. Write worker tests
  9. Implement background worker
  10. Add retry logic
  11. Write integration tests
  12. Run all tests
  13. Create commit

🚀 Starting TDD process...

Step 1/13: Design BatchJob database model

Let me create the model design...

[Claude разрабатывает всю фичу step by step]
```

---

## Модификация ролей

Вы можете редактировать роли под свой проект:

### Добавить новую роль:

1. Создайте `.claude/roles/security-engineer.md`
2. Опишите responsibilities и review checklist
3. Claude автоматически включит её в review

### Изменить существующую роль:

Отредактируйте любой файл в `.claude/roles/`:

```markdown
# Role: Software Architect

## Responsibilities
- [добавьте свои пункты]

## Review Checklist
- [ ] [ваши критерии]
```

Claude будет использовать обновленный checklist!

---

## Advanced: Автоматизация через Watcher

### 1. Запустите watcher
```bash
npm run linear:watch
```

### 2. В Linear переместите задачу в "Need Design Review"

### 3. Watcher покажет:
```
⏰ 14:30:25 - Detected task moved to "Need Design Review"

═══════════════════════════════════════════════════════════
🔍 DESIGN REVIEW NEEDED: ROT-50
═══════════════════════════════════════════════════════════

📋 Title: Add batch document processing

🚀 Run in Claude Code:
   /linear-start ROT-50

   This will automatically conduct multi-role design review!
═══════════════════════════════════════════════════════════
```

### 4. Вы копируете команду в Claude Code

### 5. Полный цикл design review → реализация

---

## Преимущества этого workflow

✅ **Качество:**
- Каждая фича оценивается с 5 перспектив
- Выявляются риски на ранней стадии
- Comprehensive acceptance criteria

✅ **Скорость:**
- Автоматический review (минуты, не часы)
- Выбор только нужных рекомендаций
- Прямой переход к реализации

✅ **Гибкость:**
- MVP vs full implementation
- Customizable roles
- Interactive approval

✅ **Документация:**
- Все решения задокументированы
- История review в Linear
- Clear requirements для разработки

---

## FAQ

**Q: Обязательно проходить design review для каждой задачи?**
A: Нет. Только для новых фич или сложных изменений. Bug fixes можно делать напрямую в "Ready".

**Q: Можно пропустить некоторые роли?**
A: Да. Отредактируйте `.claude/commands/design-review.md` и уберите ненужные роли из списка.

**Q: Сколько времени занимает review?**
A: С Claude Code: 2-5 минут. Вручную команда из 5 человек: несколько часов/дней.

**Q: Можно запустить review повторно?**
A: Да. Переместите задачу обратно в "Need Design Review" и запустите `/linear-start ROT-XX` снова.

**Q: Что если не согласен с рекомендациями?**
A: Выберите опцию 3 "Modify and refine" или 4 "Reject". Вы полностью контролируете финальную спецификацию.

---

## Дальнейшие улучшения

- [ ] Сохранение истории review в базе
- [ ] Автоматическое определение ролей по типу задачи
- [ ] Integration с Slack для уведомлений
- [ ] AI-powered priority recommendations
- [ ] Template библиотека для частых паттернов
