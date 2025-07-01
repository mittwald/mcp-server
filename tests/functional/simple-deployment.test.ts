/**
 * Phase-aware functional test for app deployments
 * Supports running in separate phases: setup, test, teardown
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PhaseTestBase, getTestPhaseConfig, TestProject } from '../utils/phase-test-base';
import { MCPTestClient } from '../utils/mcp-test-client';
import { TestProjectManager } from '../utils/test-project-manager';
import { isDockerRunning, parseToolContent } from '../utils/test-helpers';
import { sleep } from '../utils/async-operations';
import { logger } from '../../src/utils/logger';

class SimpleDeploymentTest extends PhaseTestBase {
  constructor() {
    super(getTestPhaseConfig('simple-deployment'));
  }

  /**
   * Phase 1: Create test projects
   */
  protected async createTestProjects(): Promise<TestProject[]> {
    const projects: TestProject[] = [];
    
    // Create one project for simple test
    const project = await this.projectManager.createTestProject('Simple Deployment');
    projects.push(project);
    
    // Wait for project to fully initialize
    logger.info('Waiting for project to fully initialize...');
    await sleep(30000); // 30 seconds
    
    return projects;
  }

  /**
   * Phase 2: Run the actual tests
   */
  protected async runTests(projects: TestProject[]): Promise<void> {
    if (projects.length === 0) {
      throw new Error('No projects available for testing');
    }
    
    const testProject = projects[0];
    
    // Run the simple deployment test
    await this.testSimpleWordPressDeployment(testProject);
    
    // Run multi-app test if we have an existing suitable project
    await this.testMultiAppDeployment();
  }

  /**
   * Test simple WordPress deployment
   */
  private async testSimpleWordPressDeployment(testProject: TestProject): Promise<void> {
    logger.info('=== Testing Simple WordPress Deployment ===');
    logger.info(`Using project: ${testProject.shortId}`);
    
    try {
      // Install WordPress with version
      const installation = await this.projectManager.installApp(
        testProject.projectId,
        'wordpress',
        {
          version: 'latest', // Required version field
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
      await this.projectManager.waitForAppInstallation(installation, 300000); // 5 min timeout
      
      expect(installation.status).toBe('completed');
      logger.info('WordPress installed successfully!');
      
      // Verify installation
      const listResponse = await this.client.callTool('mittwald_app_list', {
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
  }

  /**
   * Test multi-app deployment using existing project
   */
  private async testMultiAppDeployment(): Promise<void> {
    logger.info('=== Testing Multi-App Deployment ===');
    
    // Use an existing project to avoid permission issues
    const projectsResponse = await this.client.callTool('mittwald_project_list', {
      output: 'json'
    });
    
    const projectsContent = parseToolContent(projectsResponse.result);
    const existingProject = projectsContent.data.find((p: any) => 
      p.isReady && p.description?.includes('Test') && !p.description?.includes('[TEST]')
    );
    
    if (!existingProject) {
      logger.warn('No suitable existing project found, skipping multi-app test');
      return;
    }
    
    logger.info(`Using existing project: ${existingProject.shortId}`);
    
    // Install 3 apps in parallel
    const appTypes = ['wordpress', 'nextcloud', 'matomo'];
    logger.info(`Installing ${appTypes.length} apps in parallel...`);
    
    const installations = await this.projectManager.installAppsInParallel(
      existingProject.id,
      appTypes,
      {
        wordpress: { version: 'latest', siteTitle: 'Test WordPress' },
        nextcloud: { version: 'latest', siteTitle: 'Test Nextcloud' },
        matomo: { version: 'latest', siteTitle: 'Test Matomo' }
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
  }
}

// Traditional test structure for backward compatibility
describe('Simple App Deployment Test (Phase-Aware)', () => {
  const test = new SimpleDeploymentTest();
  
  beforeAll(async () => {
    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      throw new Error('Docker container is not running. Run: docker compose up -d');
    }
  }, 60000);
  
  it('should run the configured test phase', async () => {
    await test.run();
  }, 900000); // 15 minute timeout
});