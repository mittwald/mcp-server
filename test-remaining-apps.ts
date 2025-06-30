import { MCPTestClient } from './tests/utils/mcp-test-client';
import { logger } from './src/utils/logger';

async function testRemainingApps() {
  const projectId = 'p-u0ykyd';
  const projectUuid = '5de2fba9-59cb-4704-917a-eda115176f8f';
  
  const appsToTest = [
    { type: 'joomla', name: 'Joomla', defaultVersion: '5.3.1' },
    { type: 'shopware5', name: 'Shopware 5', defaultVersion: '5.7.19' },
    { type: 'shopware6', name: 'Shopware 6', defaultVersion: '6.6.10.5' }
  ];
  
  logger.info('Testing remaining app installations...\n');
  
  const client = new MCPTestClient();
  await client.initialize();
  
  try {
    // Use the default versions we found
    const versions: Record<string, string> = {};
    for (const app of appsToTest) {
      versions[app.type] = app.defaultVersion;
      logger.info(`${app.name} version: ${versions[app.type]}`);
    }
    
    logger.info('\nStarting installations...\n');
    
    // Test each app type
    for (const app of appsToTest) {
      logger.info(`\n=== Testing ${app.name} Installation ===`);
      
      const toolName = `mittwald_app_install_${app.type}`;
      const version = versions[app.type];
      
      // Prepare parameters - use snake_case as the test sends them
      const params: any = {
        project_id: projectUuid,
        version: version,
        admin_user: 'admin',
        admin_email: 'admin@example.com',
        admin_pass: 'TestPass123!',
        site_title: `Test ${app.name} Site`
      };
      
      // Shopware has special parameters
      if (app.type === 'shopware5') {
        params.shop_email = 'shop@example.com';
        params.shop_lang = 'en';
        params.shop_currency = 'EUR';
      }
      
      if (app.type === 'shopware6') {
        params.shopware_title = `Test ${app.name} Shop`;
        params.install_mode = 'test'; // test mode for faster installation
      }
      
      logger.info(`Installing ${app.name} version ${version}...`);
      logger.info('Parameters:', JSON.stringify(params, null, 2));
      
      const response = await client.callTool(toolName, params);
      const result = JSON.parse(response.result.content[0].text);
      
      if (result.status === 'success') {
        logger.info(`✅ ${app.name} installation started successfully!`);
        logger.info(`Installation ID: ${result.data?.appInstallationId}`);
      } else {
        logger.error(`❌ ${app.name} installation failed:`, result.message);
      }
      
      // Wait a bit between installations
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Check final app list
    logger.info('\n=== Final App List ===');
    const listResponse = await client.callTool('mittwald_app_list', {
      projectId: projectUuid
    });
    
    const listData = JSON.parse(listResponse.result.content[0].text);
    if (listData.status === 'success') {
      logger.info(`Total apps: ${listData.data.length}`);
      listData.data.forEach((app: any) => {
        logger.info(`- ${app.Name} (${app.Status})`);
      });
    }
    
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await client.close();
  }
}

testRemainingApps();