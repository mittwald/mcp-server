import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { TestProjectManager } from '../utils/test-project-manager';
import { logger } from '../../src/utils/logger';
import { parseToolContent } from '../utils/test-helpers';
import { validateTestEnvironment, TEST_CONFIG } from '../config/test-env';

/**
 * Test suite for custom app creation (Node.js, PHP, Python, etc.)
 * Note: These may require special permissions or project types
 */
describe('App Create Handlers', () => {
  let client: MCPTestClient;
  let projectManager: TestProjectManager;
  let testProjectId: string;
  let testProjectUuid: string;
  
  // Define custom apps to test
  const CUSTOM_APPS = [
    {
      type: 'node',
      name: 'Node.js',
      tool: 'mittwald_app_create_node',
      params: {
        entrypoint: 'npm start',
        siteTitle: 'Test Node.js App'
      }
    },
    {
      type: 'php',
      name: 'PHP',
      tool: 'mittwald_app_create_php',
      params: {
        documentRoot: 'public',
        siteTitle: 'Test PHP App'
      }
    },
    {
      type: 'python',
      name: 'Python',
      tool: 'mittwald_app_create_python',
      params: {
        entrypoint: 'python app.py',
        siteTitle: 'Test Python App'
      }
    },
    {
      type: 'php_worker',
      name: 'PHP Worker',
      tool: 'mittwald_app_create_php_worker',
      params: {
        entrypoint: 'php worker.php',
        siteTitle: 'Test PHP Worker'
      }
    },
    {
      type: 'static',
      name: 'Static Files',
      tool: 'mittwald_app_create_static',
      params: {
        documentRoot: 'dist',
        siteTitle: 'Test Static Site'
      }
    }
  ];

  beforeAll(async () => {
    validateTestEnvironment();
    
    logger.info('=== Starting App Create Test Suite ===');
    
    client = new MCPTestClient();
    await client.initialize();
    projectManager = new TestProjectManager(client);
    
    // Create a test project
    logger.info('Creating test project for custom apps...');
    const projectName = `test-custom-apps-${Date.now()}`;
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
  }, TEST_CONFIG.projectCreationTimeout);

  afterAll(async () => {
    if (TEST_CONFIG.skipCleanup) {
      logger.info('=== Skipping cleanup (SKIP_TEST_CLEANUP=true) ===');
      logger.info(`Test project left intact: ${testProjectId} (${testProjectUuid})`);
      await client.close();
      return;
    }
    
    logger.info('=== Cleaning up test project ===');
    
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

  describe('Custom App Creation', () => {
    for (const app of CUSTOM_APPS) {
      it(`should create ${app.name} app`, async () => {
        logger.info(`\n=== Creating ${app.name} App ===`);
        
        const params = {
          projectId: testProjectUuid,
          ...app.params
        };
        
        const response = await client.callTool(app.tool, params);
        
        // Handle potential validation errors
        if (response.error) {
          logger.error(`Validation error for ${app.name}:`, response.error);
          
          // Skip test if we get permission errors
          if (response.error.message?.includes('403')) {
            logger.warn(`Skipping ${app.name} - insufficient permissions (403)`);
            return;
          }
          
          throw new Error(`${app.name} validation failed: ${response.error.message}`);
        }
        
        const content = parseToolContent(response.result);
        
        // Check if we got a 403 error (permission denied)
        if (content.status === 'error' && content.message?.includes('403')) {
          logger.warn(`${app.name} creation failed with 403 - may require special permissions`);
          // Mark as skipped rather than failed
          return;
        }
        
        // Otherwise expect success
        expect(content.status).toBe('success');
        expect(content.data).toBeTruthy();
        expect(content.data.appInstallationId).toBeTruthy();
        
        logger.info(`✅ ${app.name} app created: ${content.data.appInstallationId}`);
      }, 30000); // 30 second timeout per app
    }
  });

  describe('Verify Custom Apps', () => {
    it('should list created custom apps', async () => {
      // Wait a bit for apps to register
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const listResponse = await client.callTool('mittwald_app_list', {
        projectId: testProjectUuid
      });
      
      const listContent = parseToolContent(listResponse.result);
      expect(listContent.status).toBe('success');
      
      if (Array.isArray(listContent.data) && listContent.data.length > 0) {
        logger.info(`\nFound ${listContent.data.length} apps in project:`);
        
        for (const app of listContent.data) {
          logger.info(`  - ${app.Name} (${app.ID}): ${app.Status}`);
        }
      } else {
        logger.info('No custom apps were successfully created (may be due to permissions)');
      }
    });
  });
});