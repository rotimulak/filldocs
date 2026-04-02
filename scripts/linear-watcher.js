#!/usr/bin/env node
/**
 * Linear Watcher - monitors issues and triggers actions
 * When issue moves to "In Progress", shows details and creates git branch
 */

const { LinearClient } = require('@linear/sdk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const CHECK_INTERVAL = 30000; // 30 seconds
const STATE_FILE = path.join(__dirname, '.linear-watcher-state.json');

let previousState = loadState();

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (err) {
    console.log('⚠ Could not load previous state, starting fresh');
  }
  return { inProgress: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function createGitBranch(issueId, title) {
  try {
    // Sanitize branch name
    const branchName = `${issueId.toLowerCase()}-${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)}`;

    // Check if branch exists
    try {
      execSync(`git rev-parse --verify ${branchName}`, { stdio: 'ignore' });
      console.log(`  ℹ Branch already exists: ${branchName}`);
      return branchName;
    } catch {
      // Branch doesn't exist, create it
      execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      console.log(`  ✓ Created branch: ${branchName}`);
      return branchName;
    }
  } catch (err) {
    console.error(`  ❌ Failed to create branch: ${err.message}`);
    return null;
  }
}

function displayIssueDetails(issue) {
  console.log('\n' + '='.repeat(80));
  console.log(`🚀 NEW TASK STARTED: ${issue.identifier}`);
  console.log('='.repeat(80));
  console.log(`\n📋 Title: ${issue.title}`);
  console.log(`\n🔗 URL: ${issue.url}`);

  if (issue.priority) {
    const priorityNames = { 0: 'None', 1: 'Urgent', 2: 'High', 3: 'Medium', 4: 'Low' };
    console.log(`\n⚡ Priority: ${priorityNames[issue.priority] || issue.priority}`);
  }

  if (issue.description) {
    console.log(`\n📝 Description:`);
    console.log(issue.description);
  }

  if (issue.labels && issue.labels.nodes.length > 0) {
    const labelNames = issue.labels.nodes.map(l => l.name).join(', ');
    console.log(`\n🏷️  Labels: ${labelNames}`);
  }

  if (issue.project) {
    console.log(`\n📁 Project: ${issue.project.name}`);
  }

  console.log('\n' + '='.repeat(80));
}

async function checkLinear() {
  const client = new LinearClient({ apiKey: LINEAR_API_KEY });

  try {
    const teams = await client.teams();
    const team = teams.nodes[0];

    // Get workflow states
    const states = await team.states();
    const inProgressStates = states.nodes.filter(s => s.type === 'started');
    const inProgressStateIds = inProgressStates.map(s => s.id);

    // Get all issues in "In Progress" state
    const issues = await team.issues({
      filter: {
        state: { id: { in: inProgressStateIds } }
      },
      first: 50
    });

    const currentInProgress = issues.nodes.map(i => i.identifier);

    // Find newly started issues
    const newlyStarted = currentInProgress.filter(
      id => !previousState.inProgress.includes(id)
    );

    // Process newly started issues
    for (const issueId of newlyStarted) {
      const issue = issues.nodes.find(i => i.identifier === issueId);

      console.log(`\n⏰ ${new Date().toLocaleTimeString()} - Detected new task in progress`);
      displayIssueDetails(issue);

      // Create git branch
      console.log('\n🌿 Git Branch:');
      const branchName = createGitBranch(issue.identifier, issue.title);

      // Generate prompt for Claude
      console.log('\n💬 Claude Code Integration:');
      console.log('─'.repeat(80));
      console.log(`\n🚀 AUTOMATED: Run this command in Claude Code:\n`);
      console.log(`   /linear-start ${issue.identifier}\n`);
      console.log(`   This will automatically:`);
      console.log(`   ✓ Load issue details`);
      console.log(`   ✓ Create git branch`);
      console.log(`   ✓ Plan the work (TDD)`);
      console.log(`   ✓ Start implementation`);
      console.log('─'.repeat(80));
      console.log('\n📋 OR manual prompt:');
      console.log(`I'm working on ${issue.identifier}: ${issue.title}`);
      if (issue.description) {
        console.log(`\n${issue.description}`);
      }
      console.log('\n💡 Automated workflow is recommended!\n');
    }

    // Find completed issues (moved out of In Progress)
    const completed = previousState.inProgress.filter(
      id => !currentInProgress.includes(id)
    );

    if (completed.length > 0) {
      console.log(`\n✅ ${new Date().toLocaleTimeString()} - Tasks completed or moved: ${completed.join(', ')}`);
    }

    // Update state
    previousState = { inProgress: currentInProgress };
    saveState(previousState);

  } catch (error) {
    console.error('❌ Error checking Linear:', error.message);
  }
}

async function startWatcher() {
  console.log('👀 Linear Watcher started');
  console.log(`📊 Checking every ${CHECK_INTERVAL / 1000} seconds`);
  console.log(`🔗 Project: FillDocs v1.0`);
  console.log('─'.repeat(80));
  console.log('ℹ️  When you start a task in Linear (move to "In Progress"),');
  console.log('   the watcher will detect it and show details here.\n');

  // Initial check
  await checkLinear();

  // Periodic checks
  setInterval(checkLinear, CHECK_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Watcher stopped');
  process.exit(0);
});

startWatcher();
