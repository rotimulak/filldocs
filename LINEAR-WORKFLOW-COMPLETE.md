# Complete Linear + GitHub + Claude Code Workflow

## Полный цикл разработки задачи

### 1. Структура статусов в Linear

Настройте следующие статусы (Settings → Teams → Your Team → Workflow):

```
📋 Backlog         (type: backlog)
📝 Ready           (type: unstarted)  - задача готова к работе, есть acceptance criteria
🚀 In Progress     (type: started)    - разработка началась
🧪 In Testing      (type: started)    - код написан, проходит тесты
👀 In Review       (type: started)    - код на code review
✅ Done            (type: completed)   - задача завершена и смержена
🚫 Canceled        (type: canceled)   - задача отменена
```

### 2. Template для задач (Issue Templates)

Каждая задача должна содержать:

```markdown
## Description
[Что нужно сделать]

## Acceptance Criteria
- [ ] Критерий 1
- [ ] Критерий 2
- [ ] Критерий 3

## Technical Notes
[Технические детали, если есть]

## Testing Strategy
- Unit tests: [что тестируем]
- Integration tests: [что тестируем]
- Manual testing: [что проверяем вручную]

## Definition of Done
- [ ] Code implemented
- [ ] Unit tests written and passing
- [ ] Integration tests passing (if applicable)
- [ ] Code reviewed (if applicable)
- [ ] Merged to main
- [ ] Deployed to staging/production
```

### 3. Автоматизация через Linear

#### 3.1 Linear → GitHub Integration

**Settings → Integrations → GitHub:**

1. **Connect repository**: `your-username/filldocs`

2. **Auto-attach settings:**
   - ✅ Attach commits with `ROT-XXX` in message
   - ✅ Attach branches with `ROT-XXX` in name
   - ✅ Attach PRs with `ROT-XXX` in title/description

3. **Auto-transition settings:**
   - When PR created → move to "In Review"
   - When PR merged → move to "Done"
   - When commit pushed → add comment to issue

#### 3.2 Linear Automation Rules

**Settings → Teams → Automations:**

**Rule 1: Auto-archive completed**
```
When: Issue moved to "Done"
Then: Archive issue after 7 days
```

**Rule 2: Set priority on critical bugs**
```
When: Issue created with label "bug" AND label "critical"
Then: Set priority to "Urgent"
```

**Rule 3: Require acceptance criteria**
```
When: Issue moved from "Backlog" to "Ready"
Then: Check if description contains "Acceptance Criteria"
```

### 4. Полный цикл разработки

#### Шаг 1: Подготовка задачи (Product Owner / You)

```
Linear: Backlog → Ready
```

**Действия:**
1. Создать issue в Linear
2. Заполнить description и acceptance criteria
3. Добавить labels (backend/frontend/bug/enhancement)
4. Установить priority
5. Переместить в "Ready"

#### Шаг 2: Начало работы

```
Linear: Ready → In Progress
```

**Автоматически происходит:**
- Watcher обнаруживает изменение (если запущен)
- Создается git ветка `rot-xxx-task-name`
- Показывается prompt для Claude Code

**Вы делаете:**
```bash
# Переключиться на новую ветку (если еще не сделано)
git checkout rot-15-add-error-handling

# Сообщить Claude Code
"I'm working on ROT-15: Add comprehensive error handling
[paste acceptance criteria]

Please help me:
1. Write acceptance tests
2. Write unit tests (TDD)
3. Implement the feature
4. Ensure all tests pass"
```

#### Шаг 3: TDD - Red Phase (Claude Code)

Claude Code создает:
1. **Acceptance tests** (pytest or Jest):
   ```python
   # tests/test_error_handling.py
   def test_file_too_large_returns_413():
       response = upload_file(size=11_000_000)  # > 10MB
       assert response.status_code == 413
       assert "file too large" in response.json()["error"]
   ```

2. **Unit tests**:
   ```python
   # tests/unit/test_file_validator.py
   def test_validate_file_size_rejects_large_files():
       validator = FileValidator(max_size=10_000_000)
       result = validator.validate_size(11_000_000)
       assert result.is_valid == False
       assert "too large" in result.error_message
   ```

**Запуск тестов (должны FAIL):**
```bash
pytest tests/  # Red - тесты падают
```

#### Шаг 4: Green Phase - Реализация

Claude Code реализует код:
```python
# app/validators/file_validator.py
class FileValidator:
    def validate_size(self, size):
        if size > self.max_size:
            return ValidationResult(
                is_valid=False,
                error_message="File too large"
            )
        return ValidationResult(is_valid=True)
```

**Запуск тестов:**
```bash
pytest tests/  # Green - тесты проходят ✅
```

#### Шаг 5: Refactor Phase

Claude Code рефакторит код, добавляет:
- Улучшенную читаемость
- Комментарии (где нужно)
- Type hints
- Error handling

**Запуск тестов снова:**
```bash
pytest tests/  # Still green ✅
```

#### Шаг 6: Локальная проверка (Pre-commit)

```bash
# Линтинг и форматирование
npm run lint          # для frontend
black backend/        # для Python
mypy backend/         # type checking

# Все тесты локально
pytest tests/                    # backend
npm test -- --coverage          # frontend
```

#### Шаг 7: Commit + Push

```bash
git add .
git commit -m "ROT-15: Add comprehensive error handling for file uploads

- Add file size validation (max 10MB)
- Add file format validation (.doc/.docx only)
- Add proper error responses with HTTP codes
- Add unit tests and integration tests

Tests: ✅ All passing
Coverage: 95%"

git push origin rot-15-add-error-handling
```

**Linear автоматически:**
- Прикрепит commit к issue ROT-15
- Добавит комментарий с деталями commit

#### Шаг 8: Создание Pull Request

```bash
gh pr create --title "ROT-15: Add comprehensive error handling" \
  --body "Fixes ROT-15

## Changes
- File size validation
- Format validation
- Error responses

## Testing
- ✅ Unit tests passing
- ✅ Integration tests passing
- ✅ Manual testing done

## Acceptance Criteria
- [x] Handle file > 10MB
- [x] Handle invalid formats
- [x] Return proper error messages"
```

**Linear автоматически:**
```
Linear: In Progress → In Review
```

#### Шаг 9: CI/CD (GitHub Actions)

GitHub Actions запускает:
1. ✅ Linting
2. ✅ Type checking
3. ✅ Unit tests
4. ✅ Integration tests
5. ✅ Build test
6. ✅ Security scan

**Если хотя бы один fail → PR блокируется**

#### Шаг 10: Code Review (опционально)

Если работаете в команде:
- Reviewer проверяет код
- Оставляет комментарии
- Approves или Request Changes

**Linear:**
- PR approved → можно мержить
- PR changes requested → остается в "In Review"

#### Шаг 11: Merge to Main

```bash
gh pr merge --squash --delete-branch
```

**Автоматически происходит:**
1. **Linear:** `In Review → Done`
2. **GitHub Actions:** запускает deploy на staging
3. **Linear:** добавляет комментарий "Deployed to staging"

#### Шаг 12: Deployment

GitHub Actions:
- ✅ Деплоит на staging
- ✅ Запускает smoke tests
- ✅ (Опционально) Деплоит на production

**Linear:**
- Добавляет label "deployed-staging"
- (Опционально) Архивирует через 7 дней

## 5. Мониторинг прогресса

### В Linear:

**Project View:**
- Kanban board с колонками по статусам
- Прогресс: "15/28 completed (53%)"
- Milestone: "v1.0 Release"

**Metrics:**
- Cycle time: сколько времени задача в In Progress
- Lead time: от Ready до Done
- Throughput: сколько задач завершено за неделю

### В GitHub:

**Actions tab:**
- История всех CI/CD runs
- Статус тестов
- Покрытие кода (code coverage)

## 6. Best Practices

### ✅ DO:

1. **Всегда пишите тесты перед кодом** (TDD)
2. **Acceptance criteria обязательны** перед началом
3. **Небольшие PR** (< 400 lines changed)
4. **Descriptive commit messages** с ROT-XXX
5. **Запускайте тесты локально** перед push
6. **Review acceptance criteria** перед тем как пометить Done

### ❌ DON'T:

1. **Не мержите без тестов**
2. **Не пропускайте code review** (если в команде)
3. **Не меняйте main напрямую** (всегда через PR)
4. **Не закрывайте issue вручную** (пусть автоматика)
5. **Не создавайте огромные PR** (split на smaller tasks)

## 7. Troubleshooting

### Тесты падают в CI но работают локально?

```bash
# Проверить окружение
env | grep CI

# Запустить тесты в Docker (как в CI)
docker-compose run test pytest
```

### Linear не обновляется автоматически?

1. Проверить GitHub integration: Settings → Integrations → GitHub
2. Проверить что в commit есть `ROT-XXX`
3. Проверить webhook logs в Linear

### Watcher не видит изменения?

```bash
# Проверить что watcher запущен
ps aux | grep linear-watcher

# Перезапустить
npm run linear:watch
```

## 8. Дальнейшие улучшения

- [ ] Автоматический changelog из Linear issues
- [ ] Slack notifications при deploy
- [ ] Автоматический rollback если тесты failed на prod
- [ ] A/B testing для новых фич
- [ ] Feature flags integration
