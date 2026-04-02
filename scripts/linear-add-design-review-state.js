#!/usr/bin/env node
/**
 * Add "Need Design Review" state to Linear workflow
 */

const { LinearClient } = require('@linear/sdk');

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

async function addDesignReviewState() {
  const client = new LinearClient({ apiKey: LINEAR_API_KEY });

  try {
    const teams = await client.teams();
    const team = teams.nodes[0];

    console.log(`✓ Team: ${team.name}\n`);

    // Check if state already exists
    const states = await team.states();
    const existingState = states.nodes.find(s => s.name === 'Need Design Review');

    if (existingState) {
      console.log('⚠️  State "Need Design Review" already exists');
      console.log(`   ID: ${existingState.id}`);
      console.log(`   Type: ${existingState.type}\n`);
      return existingState;
    }

    // Create new state
    console.log('📝 Creating "Need Design Review" state...');

    const statePayload = await client.createWorkflowState({
      teamId: team.id,
      name: 'Need Design Review',
      description: 'Task needs multi-role design review before implementation',
      type: 'unstarted',  // Type: backlog, unstarted, started, completed, canceled
      color: '#9b59b6'    // Purple color
    });

    const state = await statePayload.workflowState;
    console.log(`✅ Created state: ${state.name}`);
    console.log(`   ID: ${state.id}`);
    console.log(`   Color: ${state.color}\n`);

    console.log('📊 Recommended workflow order:');
    console.log('  1. Backlog              (raw ideas)');
    console.log('  2. Need Design Review   (requires review) ← NEW');
    console.log('  3. Ready                (approved, ready to start)');
    console.log('  4. In Progress          (active development)');
    console.log('  5. In Testing           (tests running)');
    console.log('  6. In Review            (code review)');
    console.log('  7. Done                 (completed)\n');

    console.log('⚙️  Next steps:');
    console.log('  1. Go to Linear → Settings → Teams → Workflow');
    console.log('  2. Reorder states to match the flow above');
    console.log('  3. Use /linear-start on tasks in "Need Design Review"');
    console.log('  4. Auto design review will trigger!\n');

    return state;

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
  }
}

addDesignReviewState();
