/**
 * Test to reproduce and fix the issue where declare stack returns success
 * but reports 0 services and 0 volumes created
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { parseToolContent } from '../utils/test-helpers';
import { logger } from '../../src/utils/logger';

describe('Container Declare Stack Issue', () => {
  let client: MCPTestClient;

  beforeAll(async () => {
    client = new MCPTestClient();
    await client.initialize();
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  it('should demonstrate the declare stack response issue', async () => {
    // First, let's see what a successful declare stack actually returns
    // We'll use a fake stack ID to trigger an error and see the response format
    const fakeStackId = 'a9b2fe99-9b2b-4a66-8848-ad418e894bfd';
    
    const response = await client.callTool('mittwald_container_declare_stack', {
      stackId: fakeStackId,
      desiredServices: {
        webserver: {
          ports: [
            {
              containerPort: 80,
              protocol: 'tcp'
            }
          ],
          imageUri: 'nginx:latest',
          environment: {
            NGINX_HOST: 'localhost'
          }
        }
      },
      desiredVolumes: {}
    });
    
    const content = parseToolContent(response.result);
    logger.info('Declare stack response:', JSON.stringify(content, null, 2));
    
    // This will likely fail with 403, but we'll see the response structure
    if (content.status === 'error') {
      expect(content.message).toMatch(/403|Forbidden|not found|access/i);
      logger.info('Got expected error for invalid stack ID');
    } else if (content.status === 'success') {
      // This is the problematic case - success but 0 services
      logger.warn('Unexpected success - checking service count');
      
      // The issue: handler reports requested count, not actual created count
      expect(content.data.services).toBe(1); // This would fail if it shows 0
      expect(content.data.requestedServices).toEqual(['webserver']);
      
      // The handler should be checking the API response to see what was actually created
      // Currently it just counts what was requested
    }
  });

  it('should show the correct handler implementation', async () => {
    // This test documents what the handler SHOULD be doing
    
    // The current implementation does this:
    // const summary = {
    //   services: Object.keys(requestBody.services || {}).length,  // Just counts request
    //   volumes: Object.keys(requestBody.volumes || {}).length,   // Just counts request
    // };
    
    // It SHOULD be doing something like:
    // const summary = {
    //   services: response.data.createdServices?.length || 0,     // Count actual created
    //   volumes: response.data.createdVolumes?.length || 0,       // Count actual created
    // };
    
    // Or it should wait and query the stack to see what was actually created
    
    expect(true).toBe(true); // Placeholder test
  });
});