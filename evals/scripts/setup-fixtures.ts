#!/usr/bin/env tsx
/**
 * Fixture Setup Script for Mittwald MCP Eval Suite
 *
 * Provisions real test resources and stores their IDs for eval testing.
 * Run this script to prepare a test environment before running evals.
 *
 * Usage:
 *   npx tsx evals/scripts/setup-fixtures.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

interface Fixtures {
  projectId: string;
  serverId?: string;
  orgId?: string;

  // App fixtures
  appInstallationId?: string;

  // Domain fixtures
  domainId?: string;
  dnszoneId?: string;
  virtualhostId?: string;

  // Database fixtures
  mysqlDatabaseId?: string;
  mysqlUserId?: string;
  redisDatabaseId?: string;

  // Mail fixtures
  mailAddressId?: string;
  deliveryboxId?: string;

  // Cronjob fixtures
  cronjobId?: string;
  cronjobExecutionId?: string;

  // User fixtures
  sshKeyId?: string;
  apiTokenId?: string;

  // Backup fixtures
  backupId?: string;
  backupScheduleId?: string;

  // Container fixtures
  stackId?: string;
  registryId?: string;

  // SSH/SFTP user fixtures
  sshUserId?: string;
  sftpUserId?: string;

  // Metadata
  generatedAt: string;
  generatedBy: string;
  notes: string[];
}

async function setupFixtures(): Promise<Fixtures> {
  console.log('🔧 Setting up test fixtures for Mittwald MCP evals...\n');

  const fixtures: Fixtures = {
    projectId: process.env.PROJECT_ID || '',
    generatedAt: new Date().toISOString(),
    generatedBy: 'evals/scripts/setup-fixtures.ts',
    notes: [],
  };

  // Get project ID from context or environment
  if (!fixtures.projectId) {
    console.log('❌ No PROJECT_ID found. Set it via: export PROJECT_ID=<your-project-id>');
    console.log('   Or run: mw context set --project-id=<PROJECT_ID>');
    process.exit(1);
  }

  console.log(`📦 Using project: ${fixtures.projectId}\n`);

  // Note: This script calls MCP tools to provision resources
  // For now, it provides a structure. Actual provisioning would require:
  // 1. Calling domain/list to get existing domains
  // 2. Creating test resources (or using existing ones)
  // 3. Storing their IDs

  fixtures.notes.push('Fixtures file generated. Populate with real resource IDs from your Mittwald project.');
  fixtures.notes.push('Run domain/list, app/list, etc. to get existing resource IDs.');
  fixtures.notes.push('Or create dedicated test resources and add their IDs here.');

  return fixtures;
}

async function main() {
  try {
    const fixtures = await setupFixtures();

    // Write fixtures to file
    const fixturesDir = resolve(process.cwd(), 'evals', 'fixtures');
    mkdirSync(fixturesDir, { recursive: true });

    const fixturesPath = resolve(fixturesDir, 'test-fixtures.json');
    writeFileSync(fixturesPath, JSON.stringify(fixtures, null, 2));

    console.log(`\n✅ Fixtures saved to: ${fixturesPath}`);
    console.log('\n📝 Next steps:');
    console.log('1. Review the fixtures file and add real resource IDs');
    console.log('2. Use these IDs in your eval prompts');
    console.log('3. Re-run the eval suite with proper test data\n');

  } catch (error) {
    console.error('❌ Error setting up fixtures:', error);
    process.exit(1);
  }
}

main();
