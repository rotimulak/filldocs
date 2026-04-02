#!/usr/bin/env node
/**
 * Setup Linear workflow: issue templates, automation rules
 */

const { LinearClient } = require('@linear/sdk');

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

const ISSUE_TEMPLATE = `## Description
[What needs to be done]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes
[Technical details, architecture decisions, etc.]

## Testing Strategy
**Unit tests:**
- [ ] Test case 1
- [ ] Test case 2

**Integration tests:**
- [ ] Integration scenario 1

**Manual testing:**
- [ ] Manual check 1

## Definition of Done
- [ ] Code implemented and reviewed
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] PR merged to main
- [ ] Deployed to staging`;

async function setupWorkflow() {
  const client = new LinearClient({ apiKey: LINEAR_API_KEY });

  try {
    const teams = await client.teams();
    const team = teams.nodes[0];

    console.log(`✓ Team: ${team.name}\n`);

    // Create issue template
    console.log('📝 Creating issue template...');
    try {
      const templatePayload = await client.createTemplate({
        type: 'issue',
        teamId: team.id,
        name: 'Standard Task Template',
        templateData: {
          description: ISSUE_TEMPLATE
        }
      });
      console.log('✓ Template created\n');
    } catch (err) {
      console.log('⚠ Template might already exist\n');
    }

    // Get workflow states
    const states = await team.states();
    console.log('📊 Current workflow states:');
    for (const state of states.nodes) {
      const typeEmoji = {
        'backlog': '📋',
        'unstarted': '📝',
        'started': '🚀',
        'completed': '✅',
        'canceled': '🚫'
      };
      console.log(`  ${typeEmoji[state.type] || '•'} ${state.name} (${state.type})`);
    }

    // Find or create key states
    const backlogState = states.nodes.find(s => s.type === 'backlog');
    const readyState = states.nodes.find(s => s.name === 'Ready' || s.name === 'Todo');
    const inProgressState = states.nodes.find(s => s.type === 'started' && s.name.includes('Progress'));
    const inTestingState = states.nodes.find(s => s.name === 'In Testing');
    const inReviewState = states.nodes.find(s => s.name === 'In Review');
    const doneState = states.nodes.find(s => s.type === 'completed');

    // Create missing states
    console.log('\n🔧 Setting up workflow states...');

    if (!inTestingState) {
      await client.createWorkflowState({
        teamId: team.id,
        name: 'In Testing',
        type: 'started',
        color: '#f2c94c'
      });
      console.log('✓ Created state: In Testing');
    }

    if (!inReviewState) {
      await client.createWorkflowState({
        teamId: team.id,
        name: 'In Review',
        type: 'started',
        color: '#bb87fc'
      });
      console.log('✓ Created state: In Review');
    }

    console.log('\n✅ Workflow setup complete!\n');

    console.log('📋 Recommended workflow:');
    console.log('  1. Backlog → issues without acceptance criteria');
    console.log('  2. Ready → issues ready to start (with AC)');
    console.log('  3. In Progress → active development');
    console.log('  4. In Testing → code complete, tests running');
    console.log('  5. In Review → code review in progress');
    console.log('  6. Done → merged and deployed\n');

    console.log('⚙️  Next steps:');
    console.log('  1. Go to Linear → Settings → Teams → Workflow');
    console.log('  2. Reorder states to match the flow above');
    console.log('  3. Go to Settings → Integrations → GitHub');
    console.log('  4. Connect your repository');
    console.log('  5. Configure auto-transitions:');
    console.log('     - PR created → In Review');
    console.log('     - PR merged → Done\n');

    console.log('📖 Full workflow documentation:');
    console.log('  See LINEAR-WORKFLOW-COMPLETE.md\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
  }
}

setupWorkflow();
