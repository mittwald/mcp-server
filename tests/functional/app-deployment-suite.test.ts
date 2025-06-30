/**
 * Comprehensive functional test suite for app deployments
 * Tests the full lifecycle: project creation, app installations, validation, and cleanup
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { TestProjectManager } from '../utils/test-project-manager';
import { isDockerRunning, validateMCPResponse, parseToolContent } from '../utils/test-helpers';
import { createProgressReporter, sleep } from '../utils/async-operations';
import { logger } from '../../src/utils/logger';

// Extended timeout for functional tests (20 minutes)
const FUNCTIONAL_TEST_TIMEOUT = 20 * 60 * 1000;

describe('App Deployment Functional Test Suite', { timeout: FUNCTIONAL_TEST_TIMEOUT }, () => {
  let client: MCPTestClient;
  let projectManager: TestProjectManager;
  let testProjectId: string;
  let testProjectShortId: string;

  beforeAll(async () => {
    // Ensure Docker is running
    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      throw new Error('Docker container is not running. Run: docker compose up -d');
    }

    // Initialize MCP client
    client = new MCPTestClient();
    const initResponse = await client.initialize();
    validateMCPResponse(initResponse);
    
    // Create project manager
    projectManager = new TestProjectManager(client);
    
    logger.info('=== Starting App Deployment Functional Test Suite ===');
  });

  afterAll(async () => {
    logger.info('=== Cleaning up test resources ===');
    
    // Clean up all created resources
    await projectManager.cleanup();
    
    // Close client connection
    await client.close();
    
    logger.info('=== Test suite completed ===');
  });

  describe('Project Creation', () => {
    it('should create a test project', async () => {
      const testDescription = `Functional Test Project ${new Date().toISOString()}`;
      
      const project = await projectManager.createTestProject(testDescription);
      
      expect(project).toBeDefined();
      expect(project.projectId).toBeTruthy();
      expect(project.shortId).toBeTruthy();
      expect(project.serverId).toBeTruthy();
      
      testProjectId = project.projectId;
      testProjectShortId = project.shortId;
      
      logger.info(`Created test project: ${testProjectShortId} (${testProjectId})`);
    });

    it('should verify project is ready', async () => {
      const response = await client.callTool('mittwald_project_get', {
        projectId: testProjectShortId,
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data.id).toBe(testProjectId);
      expect(content.data.isReady).toBe(true);
    });
  });

  describe('App Installations', () => {
    // Define which apps to test
    const appsToTest = [
      { type: 'wordpress', name: 'WordPress', timeout: 300000 }, // 5 min
      { type: 'nextcloud', name: 'Nextcloud', timeout: 400000 }, // 6.5 min
      { type: 'matomo', name: 'Matomo', timeout: 300000 },      // 5 min
      { type: 'joomla', name: 'Joomla!', timeout: 350000 },     // 6 min
      // Shopware and TYPO3 take longer
      { type: 'shopware6', name: 'Shopware 6', timeout: 600000 }, // 10 min
      { type: 'typo3', name: 'TYPO3', timeout: 500000 },          // 8 min
    ];

    it('should install multiple apps in parallel', async () => {
      logger.info(`Installing ${appsToTest.length} apps in parallel`);
      
      const appTypes = appsToTest.map(app => app.type);
      const appOptions = appsToTest.reduce((acc, app) => {
        acc[app.type] = {
          siteTitle: `Test ${app.name} Installation`,
          adminUser: `admin_${app.type}`,
          adminEmail: `admin@${app.type}.test`
        };
        return acc;
      }, {} as Record<string, any>);
      
      const installations = await projectManager.installAppsInParallel(
        testProjectId,
        appTypes,
        appOptions
      );
      
      expect(installations).toHaveLength(appsToTest.length);
      
      // Check installation results
      const successful = installations.filter(i => i.status === 'completed');
      const failed = installations.filter(i => i.status === 'failed');
      
      logger.info(`Installation results: ${successful.length} successful, ${failed.length} failed`);
      
      if (failed.length > 0) {
        failed.forEach(app => {
          logger.error(`${app.appType} failed: ${app.error}`);
        });
      }
      
      // At least some apps should install successfully
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should verify installed apps details', async () => {
      const summary = projectManager.getSummary();
      const successfulApps = summary.apps.filter(app => app.status === 'completed');
      
      // Get all apps in one call
      const listResponse = await client.callTool('mittwald_app_list', {
        project_id: testProjectId,
        output: 'json'
      });
      
      const listContent = parseToolContent(listResponse.result);
      expect(listContent.status).toBe('success');
      
      for (const app of successfulApps) {
        logger.info(`Verifying ${app.appType} installation`);
        
        const appData = listContent.data.apps.find(
          (a: any) => a.id === app.installationId
        );
        
        expect(appData).toBeDefined();
        expect(appData.id).toBe(app.installationId);
        expect(appData.installationPath).toBeTruthy();
        
        // Log app details
        logger.info(`${app.appType} details:`, {
          id: appData.id,
          path: appData.installationPath,
          version: appData.appVersion?.current,
          description: appData.description
        });
      }
    });

    it('should list all apps in the project', async () => {
      const response = await client.callTool('mittwald_app_list', {
        project_id: testProjectId,
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data.apps).toBeDefined();
      expect(Array.isArray(content.data.apps)).toBe(true);
      
      const summary = projectManager.getSummary();
      const successfulApps = summary.apps.filter(app => app.status === 'completed');
      
      // Should have at least as many apps as we successfully installed
      expect(content.data.apps.length).toBeGreaterThanOrEqual(successfulApps.length);
      
      logger.info(`Project has ${content.data.apps.length} apps installed`);
    });
  });

  describe('App Operations', () => {
    it('should get filesystem usage for each app', async () => {
      const summary = projectManager.getSummary();
      const successfulApps = summary.apps.filter(app => app.status === 'completed');
      
      // Get all apps for filesystem info
      const listResp = await client.callTool('mittwald_app_list', {
        project_id: testProjectId,
        output: 'json'
      });
      
      const listCont = parseToolContent(listResp.result);
      if (listCont.status !== 'success') return;
      
      for (const app of successfulApps) {
        const appData = listCont.data.apps.find(
          (a: any) => a.id === app.installationId
        );
        
        if (appData?.installationPath) {
          // Try to get filesystem usage
          const usageResponse = await client.callTool('mittwald_project_filesystem_usage', {
            projectId: testProjectId,
            directory: content.data.installationPath,
            humanReadableSizes: true,
            maxDepth: 2
          });
          
          const usageContent = parseToolContent(usageResponse.result);
          if (usageContent.status === 'success') {
            logger.info(`${app.appType} filesystem usage:`, {
              totalSize: usageContent.data.usage?.totalSize,
              path: appData.installationPath
            });
          }
        }
      }
    });
  });

  describe('Cleanup Verification', () => {
    it('should track all created resources', async () => {
      const summary = projectManager.getSummary();
      
      expect(summary.projects.length).toBeGreaterThan(0);
      expect(summary.apps.length).toBeGreaterThan(0);
      
      logger.info('Test resources summary:', {
        projects: summary.projects.length,
        apps: summary.apps.length,
        successfulApps: summary.apps.filter(a => a.status === 'completed').length,
        failedApps: summary.apps.filter(a => a.status === 'failed').length
      });
    });
  });
});

/**
 * Separate test for cleanup to ensure it always runs
 */
describe('Resource Cleanup Test', { timeout: 300000 }, () => {
  let client: MCPTestClient;
  let projectManager: TestProjectManager;

  beforeEach(async () => {
    client = new MCPTestClient();
    await client.initialize();
    projectManager = new TestProjectManager(client);
  });

  afterAll(async () => {
    await client.close();
  });

  it('should handle cleanup of test resources gracefully', async () => {
    // This test demonstrates the cleanup process
    // In real scenarios, cleanup happens in afterAll hook
    
    // Create a small test project
    const project = await projectManager.createTestProject('Cleanup Test Project');
    
    // Install a quick app (WordPress)
    const installation = await projectManager.installApp(project.projectId, 'wordpress', {
      siteTitle: 'Cleanup Test'
    });
    
    // Wait briefly for installation to start
    await sleep(10000);
    
    // Clean up
    await projectManager.cleanup();
    
    // Verify cleanup
    const summary = projectManager.getSummary();
    expect(summary.projects).toHaveLength(0);
    expect(summary.apps).toHaveLength(0);
  });
});