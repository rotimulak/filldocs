#!/usr/bin/env node
/**
 * Delete old empty "filldocs" project
 */

const { LinearClient } = require('@linear/sdk');

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

async function deleteOldProject() {
  const client = new LinearClient({ apiKey: LINEAR_API_KEY });

  try {
    const teams = await client.teams();
    const team = teams.nodes[0];

    // Get all projects
    const projects = await team.projects();

    console.log('📁 Current projects:');
    for (const project of projects.nodes) {
      console.log(`  - ${project.name} (${project.id})`);
    }

    // Find the old "filldocs" project
    const oldProject = projects.nodes.find(p => p.name === 'filldocs');

    if (!oldProject) {
      console.log('\n⚠ Old "filldocs" project not found. Nothing to delete.');
      return;
    }

    console.log(`\n🗑️ Deleting project: ${oldProject.name}`);
    await client.deleteProject(oldProject.id);

    console.log('✅ Project deleted successfully!');
    console.log('\n📁 Remaining projects:');

    const remainingProjects = await team.projects();
    for (const project of remainingProjects.nodes) {
      console.log(`  - ${project.name}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
  }
}

deleteOldProject();
