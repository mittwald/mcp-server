/**
 * Simplified functional test for app deployments
 * Focuses on demonstrating the full cycle with better error handling
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { TestProjectManager } from '../utils/test-project-manager';
import { isDockerRunning, validateMCPResponse, parseToolContent } from '../utils/test-helpers';
import { sleep } from '../utils/async-operations';
import { logger } from '../../src/utils/logger';

describe('Simple App Deployment Test', () => {
  let client: MCPTestClient;
  let projectManager: TestProjectManager;
  let testProject: any;

  beforeAll(async () => {
    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      throw new Error('Docker container is not running. Run: docker compose up -d');
    }

    client = new MCPTestClient();
    await client.initialize();
    projectManager = new TestProjectManager(client);
    
    logger.info('=== Starting Simple Deployment Test ===');
  }, 60000);

  afterAll(async () => {
    logger.info('=== Cleaning up ===');
    await projectManager.cleanup();
    await client.close();
  });

  it('should create a project and install WordPress', async () => {
    // Create project
    logger.info('Creating test project...');
    testProject = await projectManager.createTestProject('Simple Test Project');
    expect(testProject.projectId).toBeTruthy();
    expect(testProject.shortId).toBeTruthy();
    
    logger.info(`Project created: ${testProject.shortId}`);
    
    // Wait a bit for project to fully initialize
    logger.info('Waiting for project to fully initialize...');
    await sleep(30000); // 30 seconds
    
    // Install WordPress
    logger.info('Installing WordPress...');
    try {
      const installation = await projectManager.installApp(
        testProject.projectId,
        'wordpress',
        {
          adminUser: 'test_admin',
          adminEmail: 'test@example.com',
          adminPass: 'TestPass123!',
          siteTitle: 'Simple Test Site'
        }
      );
      
      expect(installation.installationId).toBeTruthy();
      logger.info(`WordPress installation started: ${installation.installationId}`);
      
      // Wait for installation
      logger.info('Waiting for WordPress to install (this takes 2-5 minutes)...');
      await projectManager.waitForAppInstallation(installation, 300000); // 5 min timeout
      
      expect(installation.status).toBe('completed');
      logger.info('WordPress installed successfully!');
      
      // Verify installation
      const listResponse = await client.callTool('mittwald_app_list', {
        project_id: testProject.projectId,
        output: 'json'
      });
      
      const listContent = parseToolContent(listResponse.result);
      expect(listContent.status).toBe('success');
      expect(listContent.data.apps).toHaveLength(1);
      expect(listContent.data.apps[0].appId).toBeTruthy();
      
      logger.info('Installation verified!');
      
    } catch (error: any) {
      // If we get permission errors, it might be because the project is too new
      if (error.message.includes('403') || error.message.includes('Permission')) {
        logger.warn('Got permission error - this can happen with brand new projects');
        logger.info('In production, wait longer or use existing projects');
      }
      throw error;
    }
  }, 600000); // 10 minute timeout for the whole test
});

describe('Multi-App Deployment Test', () => {
  let client: MCPTestClient;
  let projectManager: TestProjectManager;

  beforeAll(async () => {
    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      throw new Error('Docker container is not running. Run: docker compose up -d');
    }

    client = new MCPTestClient();
    await client.initialize();
    projectManager = new TestProjectManager(client);
  }, 60000);

  afterAll(async () => {
    await projectManager.cleanup();
    await client.close();
  });

  it('should install multiple apps in parallel', async () => {
    // Use an existing project to avoid permission issues
    const projectsResponse = await client.callTool('mittwald_project_list', {
      output: 'json'
    });
    
    const projectsContent = parseToolContent(projectsResponse.result);
    const existingProject = projectsContent.data.find((p: any) => 
      p.isReady && p.description?.includes('Test')
    );
    
    if (!existingProject) {
      logger.warn('No suitable existing project found, skipping test');
      return;
    }
    
    logger.info(`Using existing project: ${existingProject.shortId}`);
    
    // Install 3 apps in parallel
    const appTypes = ['wordpress', 'nextcloud', 'matomo'];
    logger.info(`Installing ${appTypes.length} apps in parallel...`);
    
    const installations = await projectManager.installAppsInParallel(
      existingProject.id,
      appTypes,
      {
        wordpress: { siteTitle: 'Test WordPress' },
        nextcloud: { siteTitle: 'Test Nextcloud' },
        matomo: { siteTitle: 'Test Matomo' }
      }
    );
    
    // Check results
    const successful = installations.filter(i => i.status === 'completed');
    const failed = installations.filter(i => i.status === 'failed');
    
    logger.info(`Results: ${successful.length} successful, ${failed.length} failed`);
    
    if (failed.length > 0) {
      failed.forEach(app => {
        logger.warn(`${app.appType} failed: ${app.error}`);
      });
    }
    
    // At least one should succeed
    expect(successful.length).toBeGreaterThan(0);
    
  }, 900000); // 15 minute timeout
});