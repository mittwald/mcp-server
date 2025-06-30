import { MCPTestClient } from './tests/utils/mcp-test-client';
import { logger } from './src/utils/logger';

async function checkVersions() {
  const appsToCheck = ['Joomla!', 'Shopware 5', 'Shopware 6'];
  
  const client = new MCPTestClient();
  await client.initialize();
  
  try {
    for (const app of appsToCheck) {
      logger.info(`\n=== Checking ${app} versions ===`);
      
      const response = await client.callTool('mittwald_app_versions', {
        app: app
      });
      
      const data = JSON.parse(response.result.content[0].text);
      logger.info('Response:', JSON.stringify(data, null, 2));
      
      if (data.status === 'success' && Array.isArray(data.data)) {
        logger.info(`Found ${data.data.length} versions`);
        if (data.data.length > 0) {
          logger.info('First 5 versions:');
          data.data.slice(0, 5).forEach((v: any) => {
            logger.info(`  - ${v.externalVersion} (${v.recommended ? 'RECOMMENDED' : ''})`);
          });
        }
      }
    }
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkVersions();