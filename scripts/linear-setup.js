#!/usr/bin/env node
/**
 * Linear API integration script
 * Creates initial project structure and issues for FillDocs
 */

const { LinearClient } = require('@linear/sdk');

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

async function setupLinearProject() {
  const client = new LinearClient({ apiKey: LINEAR_API_KEY });

  try {
    // Get workspace info
    const viewer = await client.viewer;
    console.log(`✓ Connected to Linear as: ${viewer.name}`);

    // Get teams
    const teams = await client.teams();
    const team = teams.nodes[0];
    console.log(`✓ Using team: ${team.name} (${team.key})`);

    // Create labels
    const labels = [
      { name: 'backend', color: '#4285f4' },
      { name: 'frontend', color: '#ea4335' },
      { name: 'bug', color: '#fbbc04' },
      { name: 'enhancement', color: '#34a853' },
      { name: 'documentation', color: '#9e9e9e' }
    ];

    console.log('\n📝 Creating labels...');
    for (const label of labels) {
      try {
        await client.createIssueLabel({
          teamId: team.id,
          name: label.name,
          color: label.color
        });
        console.log(`  ✓ Created label: ${label.name}`);
      } catch (err) {
        console.log(`  ⚠ Label ${label.name} might already exist`);
      }
    }

    // Create initial issues
    const issues = [
      {
        title: 'Setup Docker deployment configuration',
        description: 'Configure docker-compose for production deployment with nginx reverse proxy',
        labelNames: ['backend', 'enhancement']
      },
      {
        title: 'Add error handling for file upload',
        description: 'Handle cases: file too large, invalid format, corrupted files',
        labelNames: ['backend', 'bug']
      },
      {
        title: 'Implement requisites validation',
        description: 'Add frontend validation for company requisites (INN, KPP format)',
        labelNames: ['frontend', 'enhancement']
      },
      {
        title: 'Add template preview functionality',
        description: 'Allow users to preview templates before filling',
        labelNames: ['frontend', 'enhancement']
      },
      {
        title: 'Write API documentation',
        description: 'Document all API endpoints with examples and response schemas',
        labelNames: ['documentation']
      }
    ];

    console.log('\n📋 Creating initial issues...');
    for (const issue of issues) {
      const createdIssue = await client.createIssue({
        teamId: team.id,
        title: issue.title,
        description: issue.description
      });
      console.log(`  ✓ Created: ${createdIssue.issue.identifier} - ${issue.title}`);
    }

    console.log('\n✅ Linear project setup complete!');
    console.log(`\nView your project at: https://linear.app/${team.key}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupLinearProject();
