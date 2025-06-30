import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { TestProjectManager } from '../utils/test-project-manager';
import { logger } from '../../src/utils/logger';
import { parseToolContent } from '../utils/test-helpers';
import { validateTestEnvironment, TEST_CONFIG } from '../config/test-env';

/**
 * Comprehensive test suite for all Mittwald app installations
 * This test:
 * 1. Creates a new project for testing
 * 2. Tests all available app installations
 * 3. Verifies installations started successfully
 * 4. Cleans up the project after tests
 */
describe('App Installations', () => {
  let client: MCPTestClient;
  let projectManager: TestProjectManager;
  let testProjectId: string;
  let testProjectUuid: string;
  
  // Define all apps to test with their expected versions
  const APPS_TO_TEST = [
    { 
      type: 'wordpress', 
      name: 'WordPress',
      expectedFields: ['appInstallationId', 'status', 'host', 'adminUser']
    },
    { 
      type: 'nextcloud', 
      name: 'Nextcloud',
      expectedFields: ['appInstallationId', 'status', 'host', 'adminUser']
    },
    { 
      type: 'matomo', 
      name: 'Matomo',
      expectedFields: ['appInstallationId', 'status', 'host', 'adminUser']
    },
    { 
      type: 'typo3', 
      name: 'TYPO3',
      expectedFields: ['appInstallationId', 'status', 'host', 'adminUser', 'installMode']
    },
    { 
      type: 'contao', 
      name: 'Contao',
      expectedFields: ['appInstallationId', 'status', 'host', 'adminUser', 'adminEmail']
    },
    { 
      type: 'joomla', 
      name: 'Joomla',
      expectedFields: ['appInstallationId', 'status', 'host', 'adminUser']
    },
    { 
      type: 'shopware5', 
      name: 'Shopware 5',
      expectedFields: ['appInstallationId', 'status', 'host', 'adminUser', 'shopLang', 'shopCurrency'],
      requiredParams: {
        shop_lang: 'de-DE',
        shop_currency: 'EUR'
      }
    },
    { 
      type: 'shopware6', 
      name: 'Shopware 6',
      expectedFields: ['appInstallationId', 'status', 'host', 'adminUser', 'shopLang', 'shopCurrency'],
      requiredParams: {
        shop_lang: 'de-DE',
        shop_currency: 'EUR'
      }
    }
  ];

  beforeAll(async () => {
    // Validate environment before running tests
    validateTestEnvironment();
    
    logger.info('=== Starting App Installation Test Suite ===');
    
    client = new MCPTestClient();
    await client.initialize();
    projectManager = new TestProjectManager(client);
    
    // Create a test project
    logger.info('Creating test project...');
    const projectName = `test-apps-${Date.now()}`;
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
        // List all app installations
        const listResponse = await client.callTool('mittwald_app_list', {
          projectId: testProjectUuid
        });
        const listContent = parseToolContent(listResponse.result);
        
        if (listContent.status === 'success' && Array.isArray(listContent.data)) {
          logger.info(`Found ${listContent.data.length} apps to uninstall`);
          
          // Uninstall each app
          for (const app of listContent.data) {
            try {
              await client.callTool('mittwald_app_uninstall', {
                appInstallationId: app.ID,
                force: true
              });
              logger.info(`Uninstalled app: ${app.ID}`);
            } catch (error) {
              logger.warn(`Failed to uninstall app ${app.ID}:`, error);
            }
          }
        }
        
        // Delete the project
        await projectManager.deleteProject(testProjectUuid);
        logger.info('Test project deleted successfully');
      } catch (error) {
        logger.error('Failed to clean up test project:', error);
      }
    }
    
    await client.close();
  }, TEST_CONFIG.cleanupTimeout);

  describe('App Version Discovery', () => {
    it('should fetch versions for all app types', async () => {
      logger.info('Fetching available versions for all apps...');
      
      const versionsResponse = await client.callTool('mittwald_app_versions', {
        output: 'json'
      });
      
      const versionsContent = parseToolContent(versionsResponse.result);
      expect(versionsContent.status).toBe('success');
      expect(versionsContent.data).toHaveProperty('apps');
      
      const availableApps = versionsContent.data.apps;
      logger.info(`Found ${availableApps.length} available apps`);
      
      // Verify we have versions for all our test apps
      for (const testApp of APPS_TO_TEST) {
        const appData = availableApps.find((app: any) => 
          app.name.toLowerCase() === testApp.name.toLowerCase() ||
          app.name.toLowerCase().replace(/[^a-z0-9]/g, '') === testApp.type
        );
        
        expect(appData, `App ${testApp.name} not found in available apps`).toBeTruthy();
        expect(appData.versions.length, `No versions found for ${testApp.name}`).toBeGreaterThan(0);
        
        // Store the recommended or latest version for each app
        const version = appData.versions.find((v: any) => v.recommended)?.externalVersion || 
                       appData.versions[0].externalVersion;
        (testApp as any).version = version;
        logger.info(`  ${testApp.name}: version ${version}`);
      }
    });
  });

  describe('Individual App Installations', () => {
    for (const app of APPS_TO_TEST) {
      it(`should install ${app.name}`, async () => {
        const version = (app as any).version;
        
        if (!version) {
          logger.warn(`Skipping ${app.name} - no version available`);
          return;
        }
        
        logger.info(`\n=== Installing ${app.name} v${version} ===`);
        
        const toolName = `mittwald_app_install_${app.type}`;
        const params: any = {
          project_id: testProjectUuid,
          version: version,
          admin_user: 'admin',
          admin_email: TEST_CONFIG.defaultAdminEmail,
          admin_pass: TEST_CONFIG.defaultAdminPassword,
          site_title: `Test ${app.name} Installation`
        };
        
        // Add any required params specific to this app
        if (app.requiredParams) {
          Object.assign(params, app.requiredParams);
        }
        
        const response = await client.callTool(toolName, params);
        const content = parseToolContent(response.result);
        
        // Verify successful response
        expect(content.status).toBe('success');
        expect(content.data).toBeTruthy();
        
        // Verify expected fields in response
        for (const field of app.expectedFields) {
          expect(content.data).toHaveProperty(field);
        }
        
        // Verify installation started
        expect(content.data.status).toBe('installing');
        expect(content.data.appInstallationId).toBeTruthy();
        
        logger.info(`✅ ${app.name} installation started: ${content.data.appInstallationId}`);
      }, 30000); // 30 second timeout per app
    }
  });

  describe('Batch Installation Verification', () => {
    it('should verify all apps are installing', async () => {
      // Wait a bit for installations to register
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const listResponse = await client.callTool('mittwald_app_list', {
        projectId: testProjectUuid
      });
      
      const listContent = parseToolContent(listResponse.result);
      expect(listContent.status).toBe('success');
      expect(Array.isArray(listContent.data)).toBeTruthy();
      
      const installedApps = listContent.data;
      logger.info(`\nFound ${installedApps.length} app installations:`);
      
      for (const app of installedApps) {
        logger.info(`  - ${app.Name} (${app.ID}): ${app.Status}`);
        expect(['installing', 'installed']).toContain(app.Status);
      }
      
      // Verify we have installations for all tested apps
      const installedAppNames = installedApps.map((app: any) => app.Name.toLowerCase());
      for (const testApp of APPS_TO_TEST) {
        const found = installedAppNames.some(name => 
          name.includes(testApp.type) || 
          name.includes(testApp.name.toLowerCase())
        );
        expect(found, `${testApp.name} installation not found`).toBeTruthy();
      }
    });
  });
});