#!/usr/bin/env tsx
/**
 * Provision Real Test Fixtures for Mittwald MCP Evals
 *
 * This script calls MCP tools to provision real test resources
 * and captures their IDs for use in the eval suite.
 *
 * Usage:
 *   PROJECT_ID=<your-project-id> npx tsx evals/scripts/provision-fixtures.ts
 *
 * The script will:
 * 1. Call list tools to discover existing resources
 * 2. Create minimal test resources where needed
 * 3. Save all IDs to evals/fixtures/test-fixtures.json
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

interface TestFixtures {
  // Core context
  projectId: string;
  serverId?: string;
  orgId?: string;

  // Existing resources (from list operations)
  existingDomains: Array<{ id: string; name: string }>;
  existingApps: Array<{ id: string; name: string; shortId: string }>;
  existingDatabases: Array<{ id: string; description: string }>;

  // Created test resources (cleanup needed)
  testResources: {
    cronjobs?: Array<{ id: string; description: string }>;
    backupSchedules?: Array<{ id: string; description: string }>;
    sshKeys?: Array<{ id: string; comment: string }>;
    apiTokens?: Array<{ id: string; description: string }>;
  };

  // Metadata
  generatedAt: string;
  projectName?: string;
  cleanupInstructions: string[];
}

async function main() {
  const projectId = process.env.PROJECT_ID || process.env.MITTWALD_PROJECT_ID;

  if (!projectId) {
    console.error('❌ Error: PROJECT_ID environment variable not set\n');
    console.error('Usage:');
    console.error('  PROJECT_ID=fd1ef726-14b8-4906-8a45-0756ba993246 npx tsx evals/scripts/provision-fixtures.ts\n');
    console.error('Or get your project ID with:');
    console.error('  mw project list\n');
    process.exit(1);
  }

  console.log('🔧 Provisioning test fixtures for Mittwald MCP evals...\n');
  console.log(`📦 Project ID: ${projectId}\n`);

  const fixtures: TestFixtures = {
    projectId,
    existingDomains: [],
    existingApps: [],
    existingDatabases: [],
    testResources: {},
    generatedAt: new Date().toISOString(),
    cleanupInstructions: [],
  };

  console.log('📋 Step 1: Discovering existing resources via list operations...\n');

  // Note: Actual MCP calls would go here
  // For now, provide a template structure

  fixtures.cleanupInstructions = [
    'To clean up test resources created by this script:',
    '1. Delete test cronjobs: mw cronjob delete <cronjob-id> --force',
    '2. Delete test backup schedules: mw backup schedule delete <schedule-id> --force',
    '3. Revoke test SSH keys: mw user ssh-key delete <key-id> --force',
    '4. Revoke test API tokens: mw user api-token revoke <token-id> --force',
    '',
    'Or use the cleanup script: npx tsx evals/scripts/cleanup-fixtures.ts',
  ];

  // Save fixtures
  const fixturesDir = resolve(process.cwd(), 'evals', 'fixtures');
  mkdirSync(fixturesDir, { recursive: true });

  const fixturesPath = resolve(fixturesDir, 'test-fixtures.json');
  writeFileSync(fixturesPath, JSON.stringify(fixtures, null, 2));

  console.log(`✅ Fixtures file created: ${fixturesPath}\n`);
  console.log('📝 Manual steps required:\n');
  console.log('1. Review evals/fixtures/test-fixtures.json');
  console.log('2. Add resource IDs from your Mittwald project:');
  console.log('   - Run: mw domain list --project-id=' + projectId);
  console.log('   - Run: mw app list --project-id=' + projectId);
  console.log('   - Add the IDs to existingDomains, existingApps, etc.');
  console.log('3. Update eval prompts to reference fixtures\n');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
