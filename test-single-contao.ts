import { MCPTestClient } from './tests/utils/mcp-test-client';
import { logger } from './src/utils/logger';

async function testContaoInstall() {
  const projectId = 'p-u0ykyd';
  const projectUuid = '5de2fba9-59cb-4704-917a-eda115176f8f';
  
  logger.info('Testing single Contao installation...');
  
  const client = new MCPTestClient();
  await client.initialize();
  
  try {
    // First get the latest Contao version
    const versionsResponse = await client.callTool('mittwald_app_versions', {
      app: 'contao'
    });
    
    const versionsData = JSON.parse(versionsResponse.result.content[0].text);
    const latestVersion = versionsData.data?.[0]?.externalVersion || '5.5.11';
    
    logger.info(`Installing Contao version ${latestVersion}...`);
    
    // Install Contao with snake_case parameters
    const response = await client.callTool('mittwald_app_install_contao', {
      project_id: projectUuid,
      version: latestVersion,
      admin_user: 'admin',
      admin_email: 'admin@example.com',
      admin_pass: 'TestPass123!',
      site_title: 'Test Contao Site'
    });
    
    logger.info('Response:', JSON.stringify(response, null, 2));
    
    const result = JSON.parse(response.result.content[0].text);
    
    if (result.status === 'success') {
      logger.info('✅ Contao installation started successfully!');
      logger.info(`Installation ID: ${result.data?.appInstallationId}`);
    } else {
      logger.error('❌ Contao installation failed:', result.message);
    }
    
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await client.close();
  }
}

testContaoInstall();