import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { TestProjectManager } from '../utils/test-project-manager';
import { logger } from '../../src/utils/logger';
import { fetchAppVersions } from '../utils/version-helper';
import { parseToolContent } from '../utils/test-helpers';

describe('Debug App Creation', () => {
  let client: MCPTestClient;
  let projectManager: TestProjectManager;
  const existingProjectId = 'p-u0ykyd';
  let existingProjectUuid = ''; // We'll fetch this from the API
  
  const APP_TYPES_TO_TEST = [
    { type: 'wordpress', name: 'WordPress' },
    { type: 'nextcloud', name: 'Nextcloud' },
    { type: 'matomo', name: 'Matomo' },
    { type: 'typo3', name: 'TYPO3' },
    { type: 'contao', name: 'Contao' }
  ];

  beforeAll(async () => {
    logger.info('=== Starting Debug App Creation Test ===');
    logger.info(`Using existing project: ${existingProjectId}`);
    
    client = new MCPTestClient();
    await client.initialize();
    projectManager = new TestProjectManager(client);
  });

  afterAll(async () => {
    logger.info('=== Test completed ===');
    logger.info('Project p-u0ykyd left intact as requested');
    await client.close();
  });

  it('should verify the existing project', async () => {
    logger.info(`Verifying project ${existingProjectId} exists...`);
    
    const listResponse = await client.callTool('mittwald_project_list', {});
    logger.info('Raw list response:', JSON.stringify(listResponse, null, 2));
    
    const listContent = parseToolContent(listResponse.result);
    logger.info('Parsed list content:', JSON.stringify(listContent, null, 2));
    
    expect(listContent.status).toBe('success');
    
    // Parse TSV data
    const projectData = listContent.data;
    if (typeof projectData === 'string') {
      // Parse TSV format
      const lines = projectData.trim().split('\n');
      const headers = lines[0].split('\t');
      logger.info('Headers:', headers);
      
      if (lines.length > 1) {
        const projectLine = lines[1].split('\t');
        logger.info('Project data:', projectLine);
        
        if (projectLine[1] === existingProjectId) {
          const targetProject = {
            id: projectLine[0],
            shortId: projectLine[1],
            description: projectLine[2],
            created: projectLine[3],
            serverId: projectLine[4],
            isReady: true // Assume ready since it exists
          };
          
          logger.info(`✅ Found project: ${targetProject.shortId} (${targetProject.id})`);
          logger.info(`   Description: ${targetProject.description}`);
          logger.info(`   Status: ${targetProject.isReady ? 'Ready' : 'Not Ready'}`);
          
          // Store the UUID for later use
          existingProjectUuid = targetProject.id;
          (projectManager as any).existingProjectUuid = targetProject.id;
          return;
        }
      }
    }
    
    throw new Error(`Project ${existingProjectId} not found in response`);
  });

  it('should fetch valid versions for all app types', async () => {
    logger.info('Fetching available versions for all app types...');
    
    const appTypes = APP_TYPES_TO_TEST.map(app => app.type);
    const appVersions = await fetchAppVersions(client, appTypes);
    
    logger.info('Available versions:');
    for (const [appType, version] of Object.entries(appVersions)) {
      if (version) {
        logger.info(`  ✅ ${appType}: ${version}`);
      } else {
        logger.warn(`  ❌ ${appType}: No version available`);
      }
    }
    
    // Store versions for later use
    (projectManager as any).appVersions = appVersions;
  });

  // Test each app type individually
  for (const app of APP_TYPES_TO_TEST) {
    it(`should attempt to install ${app.name}`, async () => {
      const projectUuid = existingProjectUuid || (projectManager as any).existingProjectUuid;
      const version = (projectManager as any).appVersions[app.type];
      
      if (!version) {
        logger.warn(`Skipping ${app.name} - no version available`);
        return;
      }
      
      logger.info(`\n=== Testing ${app.name} Installation ===`);
      logger.info(`Project UUID: ${projectUuid}`);
      logger.info(`Version: ${version}`);
      
      try {
        // Call the specific installer directly with detailed logging
        const toolName = `mittwald_app_install_${app.type}`;
        logger.info(`Calling tool: ${toolName}`);
        
        // Use snake_case for ALL parameters when calling tools directly
        const params = {
          project_id: projectUuid,
          version: version,
          admin_user: 'admin',        // Changed to snake_case
          admin_email: 'admin@example.com',  // Changed to snake_case
          admin_pass: 'TestPass123!',        // Changed to snake_case
          site_title: `Test ${app.name} Site`  // Changed to snake_case
        };
        
        logger.info('Installation parameters:', JSON.stringify(params, null, 2));
        
        const response = await client.callTool(toolName, params);
        logger.info('Raw response:', JSON.stringify(response, null, 2));
        
        // Handle MCP response format
        let content;
        if (response.error) {
          // Direct error response
          content = response;
        } else if (response.result?.content?.[0]) {
          // Standard MCP tool response
          const firstContent = response.result.content[0];
          if (typeof firstContent.text === 'string') {
            try {
              content = JSON.parse(firstContent.text);
            } catch (e) {
              content = { status: 'error', message: firstContent.text };
            }
          } else {
            content = firstContent;
          }
        } else {
          content = { status: 'error', message: 'Unknown response format' };
        }
        
        logger.info('Parsed content:', JSON.stringify(content, null, 2));
        
        if (content.status === 'success') {
          logger.info(`✅ ${app.name} installation started successfully`);
          logger.info(`Installation ID: ${content.data?.id || content.data?.installationId}`);
          
          // Don't wait for completion, just verify it started
          logger.info(`Note: Installation will continue in background`);
        } else {
          logger.error(`❌ ${app.name} installation failed`);
          logger.error(`Error: ${content.message}`);
          if (content.error) {
            logger.error('Error details:', JSON.stringify(content.error, null, 2));
          }
          
          // Let's also try the raw API response
          logger.info('\nAttempting raw mittwald_app_install call for debugging...');
          const genericParams = {
            projectId: projectUuid,
            app_type: app.type,
            version: version,
            adminUser: 'admin',
            adminEmail: 'admin@example.com',
            adminPass: 'TestPass123!',
            siteTitle: `Test ${app.name} Site`
          };
          const genericResponse = await client.callTool('mittwald_app_install', genericParams);
          logger.info('Generic installer response:', genericResponse);
        }
      } catch (error) {
        logger.error(`Exception during ${app.name} installation:`, error);
        
        // Try to get more details
        if (error instanceof Error) {
          logger.error('Error message:', error.message);
          logger.error('Error stack:', error.stack);
        }
      }
      
      // Add a small delay between app installations
      logger.info('Waiting 5 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    });
  }

  it('should list all app installations in the project', async () => {
    const projectUuid = existingProjectUuid || (projectManager as any).existingProjectUuid;
    
    logger.info('\n=== Checking App Installations ===');
    
    try {
      const response = await client.callTool('mittwald_app_list', {
        projectId: projectUuid  // Changed from project_id to projectId
      });
      
      logger.info('App list raw response:', JSON.stringify(response, null, 2));
      
      const content = parseToolContent(response.result);
      logger.info('App list parsed content:', JSON.stringify(content, null, 2));
      
      if (content.status === 'success') {
        if (typeof content.data === 'string' && content.data.includes('\t')) {
          // Parse TSV format
          const lines = content.data.trim().split('\n');
          logger.info(`Found ${lines.length - 1} app installations (TSV format)`);
          
          if (lines.length > 1) {
            const headers = lines[0].split('\t');
            logger.info('Headers:', headers);
            
            for (let i = 1; i < lines.length; i++) {
              const appData = lines[i].split('\t');
              logger.info(`App ${i}: ${appData.join(' | ')}`);
            }
          }
        } else if (Array.isArray(content.data)) {
          logger.info(`Found ${content.data.length} app installations:`);
          content.data.forEach((app: any) => {
            logger.info(`  - ${app.app} v${app.version}`);
            logger.info(`    ID: ${app.id}`);
            logger.info(`    Status: ${app.installationStatus || 'unknown'}`);
            logger.info(`    Domains: ${app.domains?.join(', ') || 'none'}`);
          });
        } else {
          logger.info('Unknown data format:', content.data);
        }
      } else {
        logger.info('Error listing apps:', content.message);
      }
    } catch (error) {
      logger.error('Error listing apps:', error);
    }
  });
});