#!/usr/bin/env node
/**
 * Design Review Workflow - Multi-role review process
 *
 * Usage:
 *   node scripts/design-review-workflow.js "Feature description"
 *   npm run design:review "Feature description"
 */

const { LinearClient } = require('@linear/sdk');
const fs = require('fs');
const path = require('path');

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

const ROLES = [
  { name: 'Software Architect', file: '.claude/roles/architect.md' },
  { name: 'QA Engineer', file: '.claude/roles/qa-engineer.md' },
  { name: 'DevOps Engineer', file: '.claude/roles/devops-engineer.md' },
  { name: 'Product Owner', file: '.claude/roles/product-owner.md' },
  { name: 'UX Designer', file: '.claude/roles/ux-designer.md' }
];

async function conductDesignReview(featureDescription) {
  console.log('🔍 Design Review Process');
  console.log('='.repeat(80));
  console.log(`\n📝 Feature: ${featureDescription}\n`);
  console.log('Starting multi-role review...\n');

  // Read role definitions
  const roleReviews = [];

  for (const role of ROLES) {
    console.log(`👤 ${role.name} Review:`);
    console.log('─'.repeat(80));

    try {
      const roleContent = fs.readFileSync(path.join(__dirname, '..', role.file), 'utf8');

      console.log(`\n📋 Review Checklist for ${role.name}:`);
      console.log(`(Based on: ${role.file})`);
      console.log('\nℹ️  In a full implementation, Claude Code would analyze the feature');
      console.log('   from this role\'s perspective and provide detailed feedback.\n');
      console.log('   For now, this script shows the structure.\n');

      roleReviews.push({
        role: role.name,
        file: role.file,
        content: roleContent
      });

    } catch (err) {
      console.log(`⚠️  Could not read ${role.file}: ${err.message}\n`);
    }
  }

  console.log('='.repeat(80));
  console.log('\n✅ Multi-role review structure ready!\n');

  console.log('📖 To conduct an actual review:');
  console.log('   1. Use Claude Code slash command: /design-review');
  console.log('   2. Provide the feature description');
  console.log('   3. Claude will read all role files and provide feedback');
  console.log('   4. Synthesized task will be created in Linear\n');

  return roleReviews;
}

async function createIssueFromReview(taskSpec) {
  const client = new LinearClient({ apiKey: LINEAR_API_KEY });

  try {
    const teams = await client.teams();
    const team = teams.nodes[0];

    const projects = await team.projects();
    const project = projects.nodes.find(p => p.name === 'FillDocs v1.0');

    console.log('📋 Creating Linear issue...');

    const issuePayload = await client.createIssue({
      teamId: team.id,
      projectId: project?.id,
      title: taskSpec.title,
      description: taskSpec.description,
      priority: taskSpec.priority || 2
    });

    const issue = await issuePayload.issue;
    console.log(`✅ Created: ${issue.identifier} - ${issue.title}`);
    console.log(`🔗 ${issue.url}\n`);

    return issue;
  } catch (err) {
    console.error('❌ Error creating issue:', err.message);
  }
}

// Main
const featureDescription = process.argv[2] || 'Example feature';

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                        DESIGN REVIEW WORKFLOW                              ║
║                                                                            ║
║  Multi-role review process for feature proposals                          ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

conductDesignReview(featureDescription);

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         HOW TO USE THIS WORKFLOW                           ║
╚════════════════════════════════════════════════════════════════════════════╝

1. **In Claude Code, use the slash command:**

   /design-review

2. **Provide your feature description:**

   "Add batch document processing: allow users to upload multiple documents
    and fill them all with the same requisites in one operation"

3. **Claude Code will:**

   ✓ Read all role files (.claude/roles/)
   ✓ Review from each perspective
   ✓ Synthesize feedback
   ✓ Create comprehensive task specification
   ✓ Create Linear issue with full acceptance criteria

4. **Roles involved:**

   🏗️  Software Architect   - Architecture & design
   🧪 QA Engineer          - Testing & quality
   🚀 DevOps Engineer      - Deployment & ops
   📊 Product Owner        - Business value
   🎨 UX Designer          - User experience

5. **Output:**

   - Individual role reviews
   - Consolidated concerns
   - Complete acceptance criteria
   - Testing strategy
   - Linear issue ready to start

═══════════════════════════════════════════════════════════════════════════════

📚 Role Definitions:
${ROLES.map(r => `   - ${r.file}`).join('\n')}

🔧 Slash Command:
   - .claude/commands/design-review.md

═══════════════════════════════════════════════════════════════════════════════
`);
