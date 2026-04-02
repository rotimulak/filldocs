# Linear Start - Begin work on a Linear issue

When user runs `/linear-start ROT-XXX`, automatically detect issue state and act accordingly.

## Process Flow

### 1. Fetch Issue from Linear
- Get issue details (title, description, state, labels, priority)
- Identify current workflow state

### 2. State-Based Actions

#### State: "Backlog" or "Need Design Review"

**Automatically trigger multi-role design review:**

1. **Load all role definitions** from `.claude/roles/`:
   - architect.md
   - qa-engineer.md
   - devops-engineer.md
   - product-owner.md
   - ux-designer.md

2. **Conduct reviews** from each perspective:
   - Read the role's checklist
   - Analyze the feature from that role's perspective
   - Generate role-specific feedback
   - Identify concerns, suggestions, requirements

3. **Present individual reviews** to user:
   ```
   # Design Review: ROT-15 - Add error handling

   ## 🏗️ Architecture Review
   ✅ Approved: Uses existing error handling patterns
   ⚠️  Concern: File size check should be in middleware
   💡 Suggestion: Create reusable FileValidator class

   ## 🧪 QA Review
   ✅ Good: Clear error scenarios defined
   ⚠️  Concern: Missing edge case - corrupted files
   💡 Test Strategy:
   - Unit: FileValidator tests
   - Integration: Upload endpoint tests
   - Edge cases: 10MB+1byte, zero-byte file, etc.

   ## 🚀 DevOps Review
   ✅ Good: No infrastructure changes needed
   ⚠️  Concern: Should log file validation failures
   💡 Suggestion: Add metrics for validation failures

   ## 📊 Product Review
   ✅ Value: Prevents server overload, better UX
   ⚠️  Concern: 10MB limit might be too restrictive
   💡 Suggestion: Make limit configurable

   ## 🎨 UX Review
   ✅ Good: User-friendly error messages planned
   ⚠️  Concern: Should show progress bar for large files
   💡 Suggestion: Add client-side validation too

   ---

   ## 📋 Synthesized Recommendations

   ### Critical Issues (must address):
   1. Add corrupted file handling
   2. Implement logging for validation failures
   3. Add client-side file size check

   ### Suggested Improvements:
   1. Make file size limit configurable
   2. Create reusable FileValidator class
   3. Add upload progress indicator
   4. Add metrics tracking

   ### Enhanced Acceptance Criteria:
   - [ ] Handle file > 10MB → return 413 with clear message
   - [ ] Handle invalid formats (.exe, .zip, etc) → return 400
   - [ ] Handle corrupted .docx files → return 400
   - [ ] Handle zero-byte files → return 400
   - [ ] Client-side validation before upload
   - [ ] Server-side validation in middleware
   - [ ] Log all validation failures
   - [ ] Return user-friendly error messages
   - [ ] Show upload progress for files > 1MB

   ### Testing Strategy:
   **Unit Tests:**
   - FileValidator.validate_size()
   - FileValidator.validate_format()
   - FileValidator.validate_integrity()

   **Integration Tests:**
   - POST /upload with oversized file
   - POST /upload with invalid format
   - POST /upload with corrupted file

   **Edge Cases:**
   - Exactly 10MB file
   - 10MB + 1 byte
   - Zero bytes
   - File extension spoofing
   ```

4. **Interactive Review Selection:**

   ```
   ✅ Design review complete!

   What would you like to do?

   1. ✅ Accept all recommendations
      → Add all suggested AC to the task
      → Move to "Ready" and start implementation

   2. 🎯 Select specific recommendations
      → Choose which suggestions to include
      → Customize acceptance criteria

   3. ✏️  Modify and refine
      → Edit the synthesized specification
      → Add/remove requirements

   4. ❌ Reject and start with original spec
      → Keep original description only
      → Move to "Ready"

   Your choice (1-4):
   ```

5. **Handle User Choice:**

   **Choice 1: Accept All**
   ```
   ✅ Accepting all recommendations...

   Updating ROT-15 in Linear with:
   - Enhanced acceptance criteria (9 items)
   - Testing strategy
   - Technical requirements

   Moving to "Ready"...

   ✅ Task updated!

   Start implementation now? (yes/no)
   ```

   **Choice 2: Select Specific**
   ```
   Select which recommendations to include:

   Critical Issues:
   [x] 1. Add corrupted file handling
   [x] 2. Implement logging
   [ ] 3. Client-side validation (can do later)

   Improvements:
   [x] 4. Make file size limit configurable
   [ ] 5. Reusable FileValidator (can refactor later)
   [x] 6. Upload progress indicator
   [ ] 7. Metrics tracking (can add later)

   Select items (comma-separated numbers, e.g. "1,2,4,6"):
   ```

   After selection:
   ```
   ✅ Creating custom specification with items: 1,2,4,6

   Updated Acceptance Criteria:
   - [ ] Handle file > 10MB → return 413
   - [ ] Handle corrupted files → return 400
   - [ ] Log all validation failures
   - [ ] Make file size limit configurable
   - [ ] Show upload progress

   Update ROT-15 with this specification? (yes/no)
   ```

   **Choice 3: Modify**
   ```
   Current synthesized specification:

   [Shows full spec in editable format]

   Please modify the specification above.
   Paste your edited version when ready, or type "done" to proceed:
   ```

   After editing:
   ```
   ✅ Using your custom specification

   Update ROT-15 in Linear? (yes/no)
   ```

   **Choice 4: Reject**
   ```
   ⚠️  Proceeding with original specification only.

   This task will NOT have:
   - Design review insights
   - Enhanced acceptance criteria
   - Comprehensive testing strategy

   Are you sure? (yes/no)
   ```

6. **Update Linear Issue:**
   - Update description with chosen specification
   - Add labels suggested by roles
   - Set priority if recommended
   - Move to "Ready" state
   - Add comment: "Design review completed by Claude Code"

7. **Proceed to Implementation:**
   ```
   ✅ ROT-15 is now Ready!

   Task: Add comprehensive error handling
   Acceptance Criteria: 5 items
   Testing Strategy: Defined

   Create git branch and start implementation? (yes/no)
   ```

---

#### State: "Ready"

Task has acceptance criteria and is ready to start:

1. Create git branch: `rot-xxx-task-name`
2. Load acceptance criteria from issue
3. Create TodoWrite list with TDD steps:
   - Write acceptance tests
   - Write unit tests (Red)
   - Implement (Green)
   - Refactor
   - Run all tests
4. Start implementation process
5. Move to "In Progress" in Linear

---

#### State: "In Progress"

Task already being worked on:

1. Check if git branch exists
2. Checkout branch
3. Check current progress
4. Ask: "Continue from where you left off? (yes/no)"
5. Resume work

---

#### State: "Done"

Task completed:

```
ℹ️  ROT-15 is already completed.

Available actions:
1. View completed work
2. Start a different task
3. Create follow-up task

Your choice (1-3):
```

---

## Usage Examples

### Example 1: New task needs design review

```
User: /linear-start ROT-50

Claude:
📋 Loading ROT-50: "Add batch document processing"
📊 State: Need Design Review

🔍 Starting multi-role design review...

[Conducts full review]

✅ Design review complete!

What would you like to do?
1. Accept all recommendations
2. Select specific recommendations
3. Modify and refine
4. Reject and use original

Your choice: 2

Select which recommendations to include:
Critical Issues:
[x] 1. Add database for batch job tracking
[x] 2. Implement queue system
[ ] 3. Add WebSocket for progress updates

Improvements:
[x] 4. Make batch size configurable
[ ] 5. Add email notifications
[x] 6. Add retry logic

Select items: 1,2,4,6

✅ Creating specification with items: 1,2,4,6

Update ROT-50 in Linear? yes

✅ Updated! Task moved to "Ready"

Start implementation now? yes

🌿 Creating branch rot-50-add-batch-processing...
📝 Creating implementation plan...
🚀 Starting TDD process...
```

### Example 2: Task already ready

```
User: /linear-start ROT-15

Claude:
📋 Loading ROT-15: "Add error handling"
📊 State: Ready
✅ Task has acceptance criteria

🌿 Creating branch rot-15-add-error-handling...
✅ Branch created

📝 Acceptance Criteria:
- [ ] Handle file > 10MB
- [ ] Handle invalid formats
- [ ] Return user-friendly errors

📋 Creating implementation plan...

✅ Todo list:
1. Write acceptance tests
2. Write unit tests (FileValidator)
3. Implement FileValidator class
4. Add middleware integration
5. Run all tests
6. Create commit

🚀 Starting with acceptance tests...
```

---

## Implementation Notes

This command should:

1. **Always be interactive** - never make destructive changes without confirmation
2. **Save state** - allow resuming if interrupted
3. **Be idempotent** - safe to run multiple times
4. **Provide clear feedback** - user always knows what's happening
5. **Allow cancellation** - user can exit at any point

The design review process should:
- Read ALL role files from `.claude/roles/`
- Apply each role's checklist systematically
- Synthesize feedback intelligently
- Present clear, actionable recommendations
- Allow flexible acceptance of suggestions
