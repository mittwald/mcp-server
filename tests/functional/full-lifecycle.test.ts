/**
 * Comprehensive functional test for the complete app lifecycle
 * Tests all available app types: installation, validation, and deletion
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { TestProjectManager, TestAppInstallation } from '../utils/test-project-manager';
import { isDockerRunning, validateMCPResponse, parseToolContent } from '../utils/test-helpers';
import { createProgressReporter, sleep } from '../utils/async-operations';
import { logger } from '../../src/utils/logger';

// Extended timeout for comprehensive tests
const FULL_TEST_TIMEOUT = 30 * 60 * 1000; // 30 minutes

describe('Full App Lifecycle Test', { timeout: FULL_TEST_TIMEOUT }, () => {
  let client: MCPTestClient;
  let projectManager: TestProjectManager;
  let testProject: any;
  let installedApps: TestAppInstallation[] = [];

  // All available app types
  const ALL_APP_TYPES = [
    { type: 'wordpress', name: 'WordPress', timeout: 300000 },     // 5 min
    { type: 'nextcloud', name: 'Nextcloud', timeout: 400000 },     // 6.5 min
    { type: 'matomo', name: 'Matomo', timeout: 300000 },          // 5 min
    { type: 'joomla', name: 'Joomla!', timeout: 350000 },         // 6 min
    { type: 'shopware6', name: 'Shopware 6', timeout: 600000 },   // 10 min
    { type: 'shopware5', name: 'Shopware 5', timeout: 500000 },   // 8 min
    { type: 'typo3', name: 'TYPO3', timeout: 500000 },           // 8 min
    { type: 'contao', name: 'Contao', timeout: 400000 },          // 6.5 min
  ];

  beforeAll(async () => {
    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      throw new Error('Docker container is not running. Run: docker compose up -d');
    }

    client = new MCPTestClient();
    await client.initialize();
    projectManager = new TestProjectManager(client);
    
    logger.info('=== Starting Full App Lifecycle Test ===');
    logger.info(`Will test ${ALL_APP_TYPES.length} app types`);
  }, 120000); // 2 minute timeout for setup

  afterAll(async () => {
    logger.info('=== Test completed, keeping resources for manual inspection ===');
    logger.info('To clean up manually, run: npm run test:cleanup');
    await client.close();
  });

  it('should create a project for testing', async () => {
    logger.info('Step 1: Creating test project...');
    
    testProject = await projectManager.createTestProject(
      `Full Lifecycle Test - ${new Date().toISOString().split('T')[0]}`
    );
    
    expect(testProject.projectId).toBeTruthy();
    expect(testProject.shortId).toBeTruthy();
    
    logger.info(`✅ Project created: ${testProject.shortId} (${testProject.projectId})`);
    
    // Wait for project to fully stabilize
    logger.info('Waiting 60 seconds for project to fully stabilize...');
    await sleep(60000);
    
  }, 300000); // 5 minute timeout

  it('should install all available app types in parallel', async () => {
    logger.info(`Step 2: Installing ${ALL_APP_TYPES.length} apps in parallel...`);
    
    const appTypes = ALL_APP_TYPES.map(app => app.type);
    const appOptions = ALL_APP_TYPES.reduce((acc, app) => {
      acc[app.type] = {
        siteTitle: `Test ${app.name} Installation`,
        adminUser: `admin_${app.type}`,
        adminEmail: `admin@${app.type}.test`,
        adminPass: `${app.type}Pass123!`
      };
      return acc;
    }, {} as Record<string, any>);
    
    const startTime = Date.now();
    installedApps = await projectManager.installAppsInParallel(
      testProject.projectId,
      appTypes,
      appOptions
    );
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    logger.info(`\nInstallation completed in ${duration} seconds (${Math.round(duration / 60)} minutes)`);
    
    // Analyze results
    const successful = installedApps.filter(i => i.status === 'completed');
    const failed = installedApps.filter(i => i.status === 'failed');
    const installing = installedApps.filter(i => i.status === 'installing');
    
    logger.info('\n📊 Installation Results:');
    logger.info(`✅ Successful: ${successful.length}`);
    logger.info(`❌ Failed: ${failed.length}`);
    logger.info(`⏳ Still Installing: ${installing.length}`);
    
    // Log details for each app
    logger.info('\nDetailed Results:');
    for (const app of installedApps) {
      const emoji = app.status === 'completed' ? '✅' : 
                    app.status === 'failed' ? '❌' : '⏳';
      logger.info(`${emoji} ${app.appType}: ${app.status}${app.error ? ` - ${app.error}` : ''}`);
      if (app.installationId) {
        logger.info(`   Installation ID: ${app.installationId}`);
      }
    }
    
    // At least some apps should install successfully
    expect(successful.length).toBeGreaterThan(0);
    logger.info(`\n✅ Successfully installed ${successful.length} out of ${ALL_APP_TYPES.length} apps`);
    
  }, 1200000); // 20 minute timeout

  it('should validate all installed apps', async () => {
    logger.info('\nStep 3: Validating installed apps...');
    
    const successfulApps = installedApps.filter(i => i.status === 'completed');
    if (successfulApps.length === 0) {
      logger.warn('No apps installed successfully, skipping validation');
      return;
    }
    
    // List all apps in the project
    const listResponse = await client.callTool('mittwald_app_list', {
      projectId: testProject.projectId,
      output: 'json'
    });
    
    const listContent = parseToolContent(listResponse.result);
    expect(listContent.status).toBe('success');
    expect(Array.isArray(listContent.data)).toBe(true);
    
    const installedAppsList = listContent.data;
    logger.info(`\nFound ${installedAppsList.length} apps in project:`);
    
    // Validate each successful installation
    for (const app of successfulApps) {
      const foundApp = installedAppsList.find(
        (a: any) => a.id === app.installationId
      );
      
      if (foundApp) {
        logger.info(`✅ Validated: ${app.appType}`);
        logger.info(`   - ID: ${foundApp.id}`);
        logger.info(`   - App: ${foundApp.appId}`);
        logger.info(`   - Version: ${foundApp.appVersion?.current || 'unknown'}`);
        logger.info(`   - Path: ${foundApp.installationPath || 'unknown'}`);
        logger.info(`   - Description: ${foundApp.description}`);
      } else {
        logger.warn(`⚠️  Could not find ${app.appType} in project apps list`);
      }
    }
    
    // Verify count matches
    expect(installedAppsList.length).toBeGreaterThanOrEqual(successfulApps.length);
    
  }, 60000); // 1 minute timeout

  it('should uninstall all apps', async () => {
    logger.info('\nStep 4: Uninstalling all apps...');
    
    const successfulApps = installedApps.filter(
      i => i.status === 'completed' && i.installationId
    );
    
    if (successfulApps.length === 0) {
      logger.warn('No apps to uninstall');
      return;
    }
    
    logger.info(`Uninstalling ${successfulApps.length} apps...`);
    
    // Uninstall apps one by one (parallel uninstalls might cause conflicts)
    for (const app of successfulApps) {
      try {
        logger.info(`Uninstalling ${app.appType} (${app.installationId})...`);
        await projectManager.uninstallApp(app.installationId!);
        logger.info(`✅ ${app.appType} uninstalled`);
      } catch (error) {
        logger.error(`❌ Failed to uninstall ${app.appType}:`, error);
      }
    }
    
    // Wait for uninstalls to process
    logger.info('Waiting 30 seconds for uninstalls to complete...');
    await sleep(30000);
    
    // Verify apps are gone
    const verifyResponse = await client.callTool('mittwald_app_list', {
      projectId: testProject.projectId,
      output: 'json'
    });
    
    const verifyContent = parseToolContent(verifyResponse.result);
    if (verifyContent.status === 'success') {
      const remainingApps = verifyContent.data.length;
      logger.info(`\nRemaining apps in project: ${remainingApps}`);
      expect(remainingApps).toBe(0);
    }
    
  }, 300000); // 5 minute timeout

  it('should delete the test project', async () => {
    logger.info('\nStep 5: Deleting test project...');
    
    try {
      await projectManager.deleteProject(testProject.projectId);
      logger.info('✅ Project deleted successfully');
    } catch (error) {
      logger.error('❌ Failed to delete project:', error);
      throw error;
    }
    
    // Verify project is gone
    const listResponse = await client.callTool('mittwald_project_list', {
      output: 'json'
    });
    
    const listContent = parseToolContent(listResponse.result);
    if (listContent.status === 'success') {
      const foundProject = listContent.data.find(
        (p: any) => p.id === testProject.projectId
      );
      expect(foundProject).toBeUndefined();
      logger.info('✅ Project removal confirmed');
    }
    
  }, 120000); // 2 minute timeout
});

// Separate cleanup test for manual cleanup
describe('Manual Cleanup', () => {
  let client: MCPTestClient;
  let projectManager: TestProjectManager;

  beforeAll(async () => {
    client = new MCPTestClient();
    await client.initialize();
    projectManager = new TestProjectManager(client);
  });

  afterAll(async () => {
    await client.close();
  });

  it.skip('should clean up all test resources', async () => {
    logger.info('=== Manual Cleanup ===');
    
    // List all projects
    const response = await client.callTool('mittwald_project_list', {
      output: 'json'
    });
    
    const content = parseToolContent(response.result);
    const testProjects = content.data.filter((p: any) => 
      p.description?.includes('Test') || 
      p.description?.includes('Lifecycle')
    );
    
    logger.info(`Found ${testProjects.length} test projects to clean up`);
    
    for (const project of testProjects) {
      logger.info(`\nCleaning project: ${project.shortId} - ${project.description}`);
      
      // List and uninstall apps first
      try {
        const appsResponse = await client.callTool('mittwald_app_list', {
          projectId: project.id,
          output: 'json'
        });
        
        const appsContent = parseToolContent(appsResponse.result);
        if (appsContent.status === 'success' && appsContent.data.length > 0) {
          logger.info(`  Found ${appsContent.data.length} apps to uninstall`);
          
          for (const app of appsContent.data) {
            try {
              await projectManager.uninstallApp(app.id);
              logger.info(`  ✅ Uninstalled ${app.appId}`);
            } catch (error) {
              logger.warn(`  ⚠️  Failed to uninstall ${app.appId}`);
            }
          }
          
          await sleep(10000); // Wait for uninstalls
        }
      } catch (error) {
        logger.warn(`  Could not list apps: ${error}`);
      }
      
      // Delete project
      try {
        await projectManager.deleteProject(project.id);
        logger.info(`  ✅ Project deleted`);
      } catch (error) {
        logger.error(`  ❌ Failed to delete project: ${error}`);
      }
    }
    
    logger.info('\n=== Cleanup completed ===');
  });
});