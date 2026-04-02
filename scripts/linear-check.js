#!/usr/bin/env node
/**
 * Check what was created in Linear
 */

const { LinearClient } = require('@linear/sdk');

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

async function checkLinear() {
  const client = new LinearClient({ apiKey: LINEAR_API_KEY });

  try {
    const teams = await client.teams();
    const team = teams.nodes[0];

    // Check projects
    console.log('📁 Projects:');
    const projects = await team.projects();
    for (const project of projects.nodes) {
      console.log(`  - ${project.name} (${project.id})`);
    }

    // Check milestones
    console.log('\n🎯 Milestones:');
    const milestones = await client.projectMilestones();
    for (const milestone of milestones.nodes) {
      console.log(`  - ${milestone.name} (project: ${milestone.projectId})`);
    }

    // Check recent issues
    console.log('\n📋 Recent issues (last 10):');
    const issues = await team.issues({ first: 10, orderBy: 'createdAt' });
    for (const issue of issues.nodes) {
      const projectInfo = issue.project ? ` [Project: ${issue.project.name}]` : '';
      console.log(`  - ${issue.identifier}: ${issue.title}${projectInfo}`);
    }

    console.log('\n✓ Total issues in team:', issues.nodes.length);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkLinear();
