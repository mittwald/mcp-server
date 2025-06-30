/**
 * Partial lifecycle test with fewer apps for faster testing
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { TestProjectManager, TestAppInstallation } from '../utils/test-project-manager';
import { isDockerRunning, validateMCPResponse, parseToolContent } from '../utils/test-helpers';
import { createProgressReporter, sleep } from '../utils/async-operations';
import { fetchAppVersions } from '../utils/version-helper';
import { logger } from '../../src/utils/logger';

describe('Partial App Lifecycle Test', () => {
  let client: MCPTestClient;
  let projectManager: TestProjectManager;
  let testProject: any;
  let installedApps: TestAppInstallation[] = [];

  // Test with just 3 apps for faster results
  const TEST_APPS = [
    { type: 'wordpress', name: 'WordPress', timeout: 300000 },
    { type: 'nextcloud', name: 'Nextcloud', timeout: 400000 },
    { type: 'contao', name: 'Contao', timeout: 400000 },
  ];

  beforeAll(async () => {
    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      throw new Error('Docker container is not running. Run: docker compose up -d');
    }

    client = new MCPTestClient();
    await client.initialize();
    projectManager = new TestProjectManager(client);
    
    logger.info('=== Starting Partial App Lifecycle Test ===');
    logger.info(`Will test ${TEST_APPS.length} app types`);
  });

  afterAll(async () => {
    logger.info('=== Cleaning up test resources ===');
    await projectManager.cleanup();
    await client.close();
  });

  it('should create a project and install apps', async () => {
    // Create project
    logger.info('Step 1: Creating test project...');
    testProject = await projectManager.createTestProject(
      `Partial Test - ${new Date().toISOString().split('T')[0]}`
    );
    expect(testProject.projectId).toBeTruthy();
    logger.info(`✅ Project created: ${testProject.shortId}`);
    
    // Wait for project
    logger.info('Waiting 30 seconds for project to stabilize...');
    await sleep(30000);
    
    // Fetch versions for test apps
    const appTypes = TEST_APPS.map(app => app.type);
    const appVersions = await fetchAppVersions(client, appTypes);
    
    // Install apps
    logger.info(`\nStep 2: Installing ${TEST_APPS.length} apps...`);
    const appTypesWithVersions = TEST_APPS.filter(app => appVersions[app.type]);
    const appTypes = appTypesWithVersions.map(app => app.type);
    const appOptions = appTypesWithVersions.reduce((acc, app) => {
      acc[app.type] = {
        version: appVersions[app.type],
        siteTitle: `Test ${app.name}`,
        adminUser: `admin_${app.type}`,
        adminEmail: `admin@${app.type}.test`,
        adminPass: `${app.type}Pass123!`
      };
      return acc;
    }, {} as Record<string, any>);
    
    installedApps = await projectManager.installAppsInParallel(
      testProject.projectId,
      appTypes,
      appOptions
    );
    
    // Check results
    const successful = installedApps.filter(i => i.status === 'completed');
    const failed = installedApps.filter(i => i.status === 'failed');
    
    logger.info('📊 Installation Results:');
    logger.info(`✅ Successful: ${successful.length}`);
    logger.info(`❌ Failed: ${failed.length}`);
    
    for (const app of installedApps) {
      const emoji = app.status === 'completed' ? '✅' : '❌';
      logger.info(`${emoji} ${app.appType}: ${app.status}${app.error ? ` - ${app.error}` : ''}`);
    }
    
    expect(successful.length).toBeGreaterThan(0);
    
    // Validate installations
    logger.info('Step 3: Validating installations...');
    const listResponse = await client.callTool('mittwald_app_list', {
      projectId: testProject.projectId,
      output: 'json'
    });
    
    const listContent = parseToolContent(listResponse.result);
    expect(listContent.status).toBe('success');
    
    const installedCount = listContent.data.length;
    logger.info(`Found ${installedCount} apps installed in project`);
    expect(installedCount).toBeGreaterThanOrEqual(successful.length);
    
  }, 900000); // 15 minute timeout
});