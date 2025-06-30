import { MCPTestClient } from './tests/utils/mcp-test-client';
import { logger } from './src/utils/logger';

async function testShopware() {
  const projectId = 'p-u0ykyd';
  const projectUuid = '5de2fba9-59cb-4704-917a-eda115176f8f';
  
  logger.info('Testing Shopware installations...\n');
  
  const client = new MCPTestClient();
  await client.initialize();
  
  try {
    // Test Shopware 5
    logger.info('=== Testing Shopware 5 ===');
    const shopware5Response = await client.callTool('mittwald_app_install_shopware5', {
      project_id: projectUuid,
      version: '5.7.19',
      admin_user: 'admin',
      admin_email: 'admin@example.com',
      admin_pass: 'TestPass123!',
      site_title: 'Test Shopware 5 Shop',
      shop_email: 'shop@example.com',
      shop_lang: 'en',
      shop_currency: 'EUR'
    });
    
    logger.info('Shopware 5 response:', JSON.stringify(shopware5Response, null, 2));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test Shopware 6
    logger.info('\n=== Testing Shopware 6 ===');
    const shopware6Response = await client.callTool('mittwald_app_install_shopware6', {
      project_id: projectUuid,
      version: '6.6.10.5',
      admin_user: 'admin',
      admin_email: 'admin@example.com',
      admin_pass: 'TestPass123!',
      site_title: 'Test Shopware 6 Shop',
      shopware_title: 'My Shopware 6 Store',
      install_mode: 'test'
    });
    
    logger.info('Shopware 6 response:', JSON.stringify(shopware6Response, null, 2));
    
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await client.close();
  }
}

testShopware();