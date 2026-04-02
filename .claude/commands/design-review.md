 # Design Review Command

When a user requests a design review for a feature or task, run this multi-role review process:

## Process

1. **Understand the Proposal**
   - Read the feature/task description from the user
   - Identify key technical areas involved

2. **Conduct Multi-Role Review**

   Review the proposal from each role's perspective:

   **Read role files:**
   - `.claude/roles/architect.md` - Software Architect
   - `.claude/roles/qa-engineer.md` - QA Engineer
   - `.claude/roles/devops-engineer.md` - DevOps Engineer
   - `.claude/roles/product-owner.md` - Product Owner
   - `.claude/roles/ux-designer.md` - UX Designer

   **For each role:**
   - Adopt that role's perspective
   - Apply their review checklist
   - Provide feedback in their output format
   - Be critical but constructive

3. **Synthesize Feedback**

   Combine all role reviews into:
   - Consolidated concerns
   - Combined recommendations
   - Comprehensive acceptance criteria
   - Testing strategy
   - Implementation requirements

4. **Create Linear Issue**

   Generate a complete issue with:
   - Title and description
   - Acceptance criteria (from all roles)
   - Technical requirements
   - Testing strategy
   - Success metrics
   - Labels and priority

5. **Present to User**

   Show:
   - Individual role reviews
   - Synthesized recommendations
   - Proposed Linear issue
   - Ask for approval before creating

## Example Usage

User: "Design review for: Add batch document processing feature"

You should:
1. Read all role files
2. Review from each perspective
3. Synthesize into task specification
4. Create Linear issue (if approved)

## Output Format

```markdown
# Design Review: [Feature Name]

## 🏗️ Architect Review
[Architecture feedback]

## 🧪 QA Review
[QA feedback]

## 🚀 DevOps Review
[DevOps feedback]

## 📊 Product Review
[Product feedback]

## 🎨 UX Review
[UX feedback]

---

## 📋 Synthesized Task Specification

### Description
[Clear description]

### Acceptance Criteria
- [ ] [From all roles]

### Technical Requirements
- [Architecture requirements]
- [DevOps requirements]

### Testing Strategy
- [From QA review]

### Success Metrics
- [From Product review]

### Implementation Notes
- [Key considerations]

---

## 🎯 Proposed Linear Issue

**Title:** [Task title]
**Priority:** [1-4]
**Labels:** [backend/frontend/etc]

[Full issue body]

---

Create this issue in Linear? (yes/no)
```
