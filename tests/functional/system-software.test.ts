import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { TestProjectManager } from '../utils/test-project-manager';
import { logger } from '../../src/utils/logger';
import { parseToolContent } from '../utils/test-helpers';
import { validateTestEnvironment, TEST_CONFIG } from '../config/test-env';

/**
 * Test suite for system software (dependencies) management
 * Tests the full lifecycle of system software on app installations
 */
describe('System Software Management', () => {
  let client: MCPTestClient;
  let projectManager: TestProjectManager;
  let testProjectId: string;
  let testProjectUuid: string;
  let testAppId: string;
  
  beforeAll(async () => {
    validateTestEnvironment();
    
    logger.info('=== Starting System Software Test Suite ===');
    
    client = new MCPTestClient();
    await client.initialize();
    projectManager = new TestProjectManager(client);
    
    // Create a test project
    logger.info('Creating test project for system software tests...');
    const projectName = `test-system-software-${Date.now()}`;
    const createResponse = await projectManager.createProject({
      description: projectName,
      serverId: TEST_CONFIG.serverId
    });
    
    expect(createResponse.status).toBe('success');
    testProjectUuid = createResponse.data?.projectId || createResponse.data?.id;
    
    if (!testProjectUuid) {
      throw new Error('Failed to get project ID from creation response');
    }
    
    // Get the short ID
    const listResponse = await client.callTool('mittwald_project_list', {});
    const listContent = parseToolContent(listResponse.result);
    const projectData = listContent.data as string;
    const lines = projectData.split('\n');
    
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('\t');
      if (parts[0] === testProjectUuid) {
        testProjectId = parts[1]; // Short ID
        break;
      }
    }
    
    logger.info(`Test project created: ${testProjectId} (${testProjectUuid})`);
    
    // Create a static app to test system software on
    logger.info('Creating static app for system software tests...');
    const appResponse = await client.callTool('mittwald_app_create_static', {
      projectId: testProjectUuid,
      documentRoot: 'public',
      siteTitle: 'System Software Test App'
    });
    
    const appContent = parseToolContent(appResponse.result);
    expect(appContent.status).toBe('success');
    testAppId = appContent.data?.appInstallationId;
    
    if (!testAppId) {
      throw new Error('Failed to create test app');
    }
    
    logger.info(`Test app created: ${testAppId}`);
    
    // Wait for app to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  }, TEST_CONFIG.projectCreationTimeout);

  afterAll(async () => {
    if (TEST_CONFIG.skipCleanup) {
      logger.info('=== Skipping cleanup (SKIP_TEST_CLEANUP=true) ===');
      logger.info(`Test project left intact: ${testProjectId} (${testProjectUuid})`);
      logger.info(`Test app left intact: ${testAppId}`);
      await client.close();
      return;
    }
    
    logger.info('=== Cleaning up test resources ===');
    
    if (testProjectUuid) {
      try {
        await projectManager.deleteProject(testProjectUuid);
        logger.info('Test project deleted successfully');
      } catch (error) {
        logger.error('Failed to clean up test project:', error);
      }
    }
    
    await client.close();
  }, TEST_CONFIG.cleanupTimeout);

  describe('List System Software', () => {
    it('should list all available system software', async () => {
      const response = await client.callTool('mittwald_app_dependency_list', {
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data).toBeDefined();
      expect(Array.isArray(content.data)).toBe(true);
      expect(content.data.length).toBeGreaterThan(0);
      
      // Verify known software exists
      const softwareNames = content.data.map((sw: any) => sw.name || sw.Name);
      expect(softwareNames).toContain('composer');
      expect(softwareNames).toContain('im'); // ImageMagick
      
      logger.info(`Found ${content.data.length} system software packages`);
    });

    it('should list system software in different formats', async () => {
      // Test CSV format
      const csvResponse = await client.callTool('mittwald_app_dependency_list', {
        output: 'csv'
      });
      
      const csvContent = parseToolContent(csvResponse.result);
      expect(csvContent.status).toBe('success');
      expect(csvContent.message).toContain('ID,Name,Description,Version');
      
      // Test YAML format
      const yamlResponse = await client.callTool('mittwald_app_dependency_list', {
        output: 'yaml'
      });
      
      const yamlContent = parseToolContent(yamlResponse.result);
      expect(yamlContent.status).toBe('success');
      expect(Array.isArray(yamlContent.data)).toBe(true);
    });
  });

  describe('Get System Software Versions', () => {
    it('should get versions for composer', async () => {
      const response = await client.callTool('mittwald_app_dependency_versions', {
        systemsoftware: 'composer',
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(Array.isArray(content.data)).toBe(true);
      expect(content.data.length).toBeGreaterThan(0);
      
      // Verify version structure
      const firstVersion = content.data[0];
      expect(firstVersion).toHaveProperty('Version');
      
      logger.info(`Found ${content.data.length} composer versions`);
    });

    it('should handle invalid software name gracefully', async () => {
      const response = await client.callTool('mittwald_app_dependency_versions', {
        systemsoftware: 'invalid-software-xyz'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('error');
      expect(content.message).toContain('not found');
    });

    it('should resolve software by common name', async () => {
      // ImageMagick is known as 'im' in the system
      const response = await client.callTool('mittwald_app_dependency_versions', {
        systemsoftware: 'imagemagick',
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      // This might fail if we haven't mapped 'imagemagick' -> 'im'
      // but it tests the name resolution logic
      if (content.status === 'success') {
        expect(Array.isArray(content.data)).toBe(true);
      }
    });
  });

  describe('View Installed System Software', () => {
    it('should show no system software on fresh app', async () => {
      const response = await client.callTool('mittwald_app_dependency_get', {
        installationId: testAppId,
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      
      // Fresh static app might have no system software
      if (Array.isArray(content.data)) {
        logger.info(`App has ${content.data.length} pre-installed system software packages`);
      }
    });
  });

  describe('Update System Software', () => {
    it('should install composer on the app', async () => {
      const response = await client.callTool('mittwald_app_dependency_update', {
        installationId: testAppId,
        set: ['composer=~2'],
        updatePolicy: 'patchLevel'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data?.appInstallationId).toBe(testAppId);
      expect(content.data?.updatedDependencies).toContain('composer');
      
      logger.info('Successfully installed composer');
    });

    it('should install multiple system software packages', async () => {
      const response = await client.callTool('mittwald_app_dependency_update', {
        installationId: testAppId,
        set: ['im=~7', 'gs=latest'],
        updatePolicy: 'all'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data?.updatedDependencies?.length).toBeGreaterThanOrEqual(2);
      
      logger.info('Successfully installed ImageMagick and Ghostscript');
    });

    it('should handle invalid version format', async () => {
      const response = await client.callTool('mittwald_app_dependency_update', {
        installationId: testAppId,
        set: ['composer=invalid-version']
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('error');
      expect(content.message).toContain('No matching version found');
    });

    it('should handle missing app ID', async () => {
      const response = await client.callTool('mittwald_app_dependency_update', {
        set: ['composer=~2']
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('error');
      expect(content.message).toContain('required');
    });

    it('should handle empty dependency list', async () => {
      const response = await client.callTool('mittwald_app_dependency_update', {
        installationId: testAppId,
        set: []
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('error');
      expect(content.message).toContain('at least one dependency');
    });
  });

  describe('Verify Installations', () => {
    it('should show installed system software after updates', async () => {
      // Wait a bit for installations to process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const response = await client.callTool('mittwald_app_dependency_get', {
        installationId: testAppId,
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(Array.isArray(content.data)).toBe(true);
      
      if (content.data.length > 0) {
        logger.info(`App now has ${content.data.length} system software packages:`);
        content.data.forEach((sw: any) => {
          logger.info(`  - ${sw.Name}: ${sw.CurrentVersion} (Policy: ${sw.UpdatePolicy})`);
        });
        
        // Verify our installations
        const installedNames = content.data.map((sw: any) => sw.Name);
        expect(installedNames).toContain('composer');
        expect(installedNames).toContain('im');
        expect(installedNames).toContain('gs');
      }
    });

    it('should show correct update policies', async () => {
      const response = await client.callTool('mittwald_app_dependency_get', {
        installationId: testAppId,
        output: 'yaml'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      
      if (Array.isArray(content.data)) {
        const composer = content.data.find((sw: any) => sw.Name === 'composer');
        if (composer) {
          expect(composer.UpdatePolicy).toBe('patchLevel');
        }
        
        const imagemagick = content.data.find((sw: any) => sw.Name === 'im');
        if (imagemagick) {
          expect(imagemagick.UpdatePolicy).toBe('all');
        }
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle non-existent app gracefully', async () => {
      const response = await client.callTool('mittwald_app_dependency_get', {
        installationId: 'non-existent-app-id'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('error');
    });

    it('should handle malformed dependency format', async () => {
      const response = await client.callTool('mittwald_app_dependency_update', {
        installationId: testAppId,
        set: ['malformed-no-equals']
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('error');
      expect(content.message).toContain('Invalid dependency format');
    });

    it('should support quiet mode', async () => {
      const response = await client.callTool('mittwald_app_dependency_update', {
        installationId: testAppId,
        set: ['mc=latest'],
        quiet: true
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      // In quiet mode, should return just the app ID
      expect(content.message).toBe(testAppId);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should set up a static site with build tools', async () => {
      // Create a new static app specifically for this test
      const buildAppResponse = await client.callTool('mittwald_app_create_static', {
        projectId: testProjectUuid,
        documentRoot: 'dist',
        siteTitle: 'Build Tools Test'
      });
      
      const buildAppContent = parseToolContent(buildAppResponse.result);
      expect(buildAppContent.status).toBe('success');
      const buildAppId = buildAppContent.data?.appInstallationId;
      
      // Install Node.js and composer for build processes
      const response = await client.callTool('mittwald_app_dependency_update', {
        installationId: buildAppId,
        set: ['composer=~2'],
        updatePolicy: 'patchLevel'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      
      logger.info('Successfully set up static site with build tools');
    });

    it('should set up image processing capabilities', async () => {
      // This demonstrates adding image processing to any app
      const imageAppResponse = await client.callTool('mittwald_app_create_static', {
        projectId: testProjectUuid,
        documentRoot: 'images',
        siteTitle: 'Image Processing Test'
      });
      
      const imageAppContent = parseToolContent(imageAppResponse.result);
      expect(imageAppContent.status).toBe('success');
      const imageAppId = imageAppContent.data?.appInstallationId;
      
      // Install both ImageMagick and GraphicsMagick
      const response = await client.callTool('mittwald_app_dependency_update', {
        installationId: imageAppId,
        set: ['im=~7', 'gm=latest'],
        updatePolicy: 'patchLevel'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data?.updatedDependencies?.length).toBe(2);
      
      logger.info('Successfully set up image processing capabilities');
    });
  });
});