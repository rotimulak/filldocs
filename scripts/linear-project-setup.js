#!/usr/bin/env node
/**
 * Complete Linear project setup for FillDocs v1.0
 * Creates project, milestones, and comprehensive issue list
 */

const { LinearClient } = require('@linear/sdk');

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

async function setupCompleteProject() {
  const client = new LinearClient({ apiKey: LINEAR_API_KEY });

  try {
    // Get team
    const teams = await client.teams();
    const team = teams.nodes[0];
    console.log(`✓ Team: ${team.name} (${team.key})\n`);

    // Get workflow states
    const states = await team.states();
    const backlogState = states.nodes.find(s => s.type === 'backlog');
    const todoState = states.nodes.find(s => s.type === 'unstarted');

    // Create project
    console.log('📁 Creating project...');
    const projectPayload = await client.createProject({
      teamIds: [team.id],
      name: 'FillDocs v1.0',
      description: 'Web application for automatic company requisites filling in Word documents. localStorage-based system without database.',
      state: 'planned'
    });
    const project = await projectPayload.project;
    console.log(`✓ Project created: ${project.name}\n`);

    // Create milestone
    console.log('🎯 Creating milestone...');
    const milestonePayload = await client.createProjectMilestone({
      projectId: project.id,
      name: 'v1.0 Release',
      description: 'First production release with core functionality'
    });
    console.log(`✓ Milestone created: v1.0 Release\n`);

    // Get labels
    const labels = await team.labels();
    const labelMap = {};
    labels.nodes.forEach(l => labelMap[l.name] = l.id);

    // Comprehensive issue list
    const issues = [
      // Backend - Core Functionality
      {
        title: 'Add comprehensive error handling for file uploads',
        description: `Handle edge cases:
- File too large (> 10MB)
- Invalid file format (not .doc/.docx)
- Corrupted files
- Missing required fields
- Network errors during upload

Return proper HTTP status codes and user-friendly error messages.`,
        labels: ['backend', 'bug'],
        priority: 1
      },
      {
        title: 'Implement file size validation',
        description: 'Add validation for max file size (10MB) on both frontend and backend. Return clear error message if exceeded.',
        labels: ['backend', 'enhancement'],
        priority: 2
      },
      {
        title: 'Add request timeout handling',
        description: 'Implement timeouts for long-running operations (conversion, filling). Prevent hanging requests.',
        labels: ['backend', 'enhancement'],
        priority: 2
      },
      {
        title: 'Improve DOCX parsing robustness',
        description: 'Handle edge cases in docx_filler.py:\n- Tables with merged cells\n- Nested tables\n- Tables without clear label/value structure\n- Non-standard table layouts',
        labels: ['backend', 'enhancement'],
        priority: 2
      },
      {
        title: 'Add logging and monitoring',
        description: 'Implement structured logging for:\n- File processing operations\n- Errors and exceptions\n- Performance metrics\n- User actions',
        labels: ['backend', 'enhancement'],
        priority: 3
      },

      // Frontend - Core Features
      {
        title: 'Add requisites validation on frontend',
        description: `Validate company requisites before saving:
- INN: 10 or 12 digits
- KPP: 9 digits
- OGRN: 13 or 15 digits
- Bank account: 20 digits
- BIC: 9 digits

Show inline validation errors.`,
        labels: ['frontend', 'enhancement'],
        priority: 1
      },
      {
        title: 'Implement template preview functionality',
        description: 'Allow users to preview available templates before filling. Show template structure and required fields.',
        labels: ['frontend', 'enhancement'],
        priority: 2
      },
      {
        title: 'Add file upload progress indicator',
        description: 'Show upload progress bar for large files. Display processing status.',
        labels: ['frontend', 'enhancement'],
        priority: 2
      },
      {
        title: 'Improve error messages UI',
        description: 'Display user-friendly error messages with suggestions for fixing. Use toast notifications or modal dialogs.',
        labels: ['frontend', 'enhancement'],
        priority: 2
      },
      {
        title: 'Add localStorage management UI',
        description: 'Allow users to:\n- View saved requisites\n- Edit requisites\n- Delete requisites\n- Export/import requisites as JSON',
        labels: ['frontend', 'enhancement'],
        priority: 3
      },
      {
        title: 'Implement responsive design improvements',
        description: 'Ensure two-panel layout works well on tablets and mobile devices. Add mobile-friendly UI.',
        labels: ['frontend', 'enhancement'],
        priority: 3
      },

      // Infrastructure & DevOps
      {
        title: 'Setup production Docker deployment',
        description: `Configure docker-compose.yml for production:
- Multi-stage builds for optimization
- Nginx reverse proxy
- Environment variables
- Health checks
- Volume management for uploads`,
        labels: ['enhancement'],
        priority: 1
      },
      {
        title: 'Add CI/CD pipeline',
        description: 'Setup GitHub Actions for:\n- Automated tests\n- Linting\n- Building Docker images\n- Deployment to production',
        labels: ['enhancement'],
        priority: 2
      },
      {
        title: 'Configure nginx with HTTPS',
        description: 'Setup nginx with SSL certificates (Let\'s Encrypt). Configure proper redirects and security headers.',
        labels: ['enhancement'],
        priority: 2
      },
      {
        title: 'Add environment-based configuration',
        description: 'Separate configs for dev/staging/production. Use .env files properly.',
        labels: ['enhancement'],
        priority: 3
      },

      // Testing
      {
        title: 'Write backend unit tests',
        description: 'Add pytest tests for:\n- docx_filler.py (table parsing, label matching)\n- converter.py (doc to docx conversion)\n- API endpoints',
        labels: ['backend', 'enhancement'],
        priority: 2
      },
      {
        title: 'Write frontend unit tests',
        description: 'Add tests for:\n- React components\n- API client\n- localStorage operations\n- Validation logic',
        labels: ['frontend', 'enhancement'],
        priority: 2
      },
      {
        title: 'Add E2E tests',
        description: 'Setup Playwright/Cypress for end-to-end testing:\n- Upload document → extract requisites → fill template → download',
        labels: ['enhancement'],
        priority: 3
      },

      // Documentation
      {
        title: 'Write API documentation',
        description: 'Document all API endpoints with:\n- Request/response schemas\n- Example requests\n- Error codes\n- Usage examples\n\nUse OpenAPI/Swagger.',
        labels: ['documentation'],
        priority: 2
      },
      {
        title: 'Create user documentation',
        description: 'Write user guide:\n- How to use the application\n- Supported file formats\n- Requisites format requirements\n- Troubleshooting common issues',
        labels: ['documentation'],
        priority: 3
      },
      {
        title: 'Add deployment documentation',
        description: 'Document deployment process:\n- Server requirements\n- Installation steps\n- Configuration options\n- Backup and maintenance',
        labels: ['documentation'],
        priority: 3
      },

      // Security & Performance
      {
        title: 'Add CORS configuration',
        description: 'Configure CORS properly for production. Whitelist only allowed origins.',
        labels: ['backend', 'enhancement'],
        priority: 2
      },
      {
        title: 'Implement rate limiting',
        description: 'Add rate limiting to API endpoints to prevent abuse. Use Redis or in-memory store.',
        labels: ['backend', 'enhancement'],
        priority: 3
      },
      {
        title: 'Add file cleanup scheduled task',
        description: 'Ensure uploaded files are deleted after processing. Add scheduled cleanup for orphaned files.',
        labels: ['backend', 'enhancement'],
        priority: 2
      },
      {
        title: 'Optimize frontend bundle size',
        description: 'Analyze and reduce bundle size:\n- Code splitting\n- Lazy loading\n- Remove unused dependencies\n- Optimize images',
        labels: ['frontend', 'enhancement'],
        priority: 3
      },

      // Nice to Have Features
      {
        title: 'Add support for multiple requisites sets',
        description: 'Allow users to save multiple companies\' requisites and switch between them.',
        labels: ['frontend', 'enhancement'],
        priority: 4
      },
      {
        title: 'Add template customization',
        description: 'Allow users to upload custom templates with their own label mappings.',
        labels: ['backend', 'frontend', 'enhancement'],
        priority: 4
      },
      {
        title: 'Add batch processing',
        description: 'Allow users to fill multiple documents at once with same requisites.',
        labels: ['backend', 'frontend', 'enhancement'],
        priority: 4
      }
    ];

    // Create issues
    console.log('📋 Creating issues...\n');
    let created = 0;

    for (const issue of issues) {
      const labelIds = issue.labels
        .map(name => labelMap[name])
        .filter(id => id);

      const issuePayload = await client.createIssue({
        teamId: team.id,
        projectId: project.id,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        labelIds: labelIds,
        stateId: backlogState?.id || todoState?.id
      });

      const createdIssue = await issuePayload.issue;
      console.log(`  ✓ [P${issue.priority}] ${createdIssue.identifier} - ${issue.title}`);
      created++;
    }

    console.log(`\n✅ Setup complete!`);
    console.log(`   📁 Project: FillDocs v1.0`);
    console.log(`   🎯 Milestone: v1.0 Release`);
    console.log(`   📋 Issues created: ${created}`);
    console.log(`\n🔗 View project: https://linear.app/${team.key}/project/filldocs-v10`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

setupCompleteProject();
