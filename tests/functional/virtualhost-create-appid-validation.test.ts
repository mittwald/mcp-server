/**
 * Test to verify virtualhost create app ID validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { parseToolContent } from '../utils/test-helpers';

describe('VirtualHost Create App ID Validation', () => {
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

  it('should reject container service ID (c-xxxxx) when expecting app ID', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'test.example.com',
      pathToApp: ['/:c-k70elp'] // Container ID, not app ID
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('error');
    expect(content.message).toContain('Invalid app ID format');
    expect(content.message).toContain('Container service IDs start with \'c-\', not \'a-\'');
  });

  it('should accept valid app short ID (a-xxxxx)', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'test.example.com',
      pathToApp: ['/:a-123456'] // Valid app short ID format
    });
    
    const content = parseToolContent(response.result);
    
    // Will likely fail with API error, but should pass validation
    if (content.status === 'error') {
      expect(content.message).not.toContain('Invalid app ID format');
    }
  });

  it('should accept valid app UUID', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'test.example.com',
      pathToApp: ['/:3ecaf1a9-6eb4-4869-b811-8a13c3a2e745'] // Valid UUID format
    });
    
    const content = parseToolContent(response.result);
    
    // Will likely fail with API error, but should pass validation
    if (content.status === 'error') {
      expect(content.message).not.toContain('Invalid app ID format');
    }
  });

  it('should reject invalid ID formats', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'test.example.com',
      pathToApp: ['/:invalid-id-format']
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('error');
    expect(content.message).toContain('Invalid app ID format');
  });

  it('should provide helpful error for missing colon separator', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'test.example.com',
      pathToApp: ['/a-123456'] // Missing colon
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('error');
    expect(content.message).toContain('Invalid path-to-app format');
    expect(content.message).toContain('Expected format: path:appId');
  });
});