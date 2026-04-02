#!/usr/bin/env node
/**
 * Fix issues - attach them to the correct project
 */

const { LinearClient } = require('@linear/sdk');

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

async function fixIssues() {
  const client = new LinearClient({ apiKey: LINEAR_API_KEY });

  try {
    const teams = await client.teams();
    const team = teams.nodes[0];

    // Find the correct project
    const projects = await team.projects();
    const fillDocsProject = projects.nodes.find(p => p.name === 'FillDocs v1.0');

    if (!fillDocsProject) {
      console.error('❌ Project "FillDocs v1.0" not found');
      return;
    }

    console.log(`✓ Found project: ${fillDocsProject.name}`);
    console.log(`  ID: ${fillDocsProject.id}\n`);

    // Get all issues starting with ROT-15 (first issue from our script)
    const issues = await team.issues({
      first: 50,
      orderBy: 'createdAt'
    });

    // Filter issues that need to be attached (ROT-15 to ROT-42)
    const issuesToFix = issues.nodes.filter(issue => {
      const num = parseInt(issue.identifier.split('-')[1]);
      return num >= 15 && num <= 42 && !issue.project;
    });

    console.log(`📋 Found ${issuesToFix.length} issues to attach to project\n`);

    // Attach each issue to the project
    for (const issue of issuesToFix) {
      await client.updateIssue(issue.id, {
        projectId: fillDocsProject.id
      });
      console.log(`  ✓ ${issue.identifier}: ${issue.title}`);
    }

    console.log(`\n✅ All issues attached to project!`);
    console.log(`🔗 View project: https://linear.app/${team.key}/project/${fillDocsProject.slugId}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
  }
}

fixIssues();
