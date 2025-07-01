/**
 * Test to verify virtualhost create validation and error messages
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { parseToolContent } from '../utils/test-helpers';
import { logger } from '../../src/utils/logger';

describe('VirtualHost Create Validation', () => {
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

  it('should fail when no arguments are provided', async () => {
    // Call without any arguments - this should trigger an error response
    const response = await client.makeRequest('tools/call', {
      name: 'mittwald_domain_virtualhost_create'
      // Intentionally missing arguments
    });
    
    // Check if we got an error response
    if (response.error) {
      logger.info('Got expected error:', response.error.message);
      expect(response.error.message).toContain('Arguments are required');
      expect(response.error.message).toContain('pathToApp');
      expect(response.error.message).toContain('pathToUrl');
    } else {
      expect.fail('Expected error for missing arguments');
    }
  });

  it('should fail when hostname is missing', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      pathToApp: ['/:a-123456']
    });
    
    // Check for validation error
    if (response.error) {
      expect(response.error.message).toContain('hostname');
    } else if (response.result) {
      const content = parseToolContent(response.result);
      expect(content.status).toBe('error');
      expect(content.message).toContain('hostname');
    } else {
      expect.fail('Expected validation error for missing hostname');
    }
  });

  it('should fail when no path mappings are provided', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'example.com'
      // Missing both pathToApp and pathToUrl
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('error');
    expect(content.message).toBe('At least one path mapping (pathToApp or pathToUrl) must be specified');
  });

  it('should fail with invalid pathToApp format', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'example.com',
      pathToApp: ['invalid-format'] // Missing colon separator
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('error');
    expect(content.message).toContain('Invalid path-to-app format');
    expect(content.message).toContain('Expected format: path:appId');
  });

  it('should fail with invalid pathToUrl format', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'example.com',
      pathToUrl: ['no-colon'] // Missing colon separator
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('error');
    expect(content.message).toContain('Invalid path-to-url format');
    expect(content.message).toContain('Expected format: path:url');
  });

  it('should succeed with valid pathToApp', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'test.example.com',
      pathToApp: ['/:a-123456-invalid-app'] // Valid format, but app might not exist
    });
    
    const content = parseToolContent(response.result);
    
    // Might fail due to invalid app ID or permissions, but should not be a validation error
    if (content.status === 'error') {
      // Should not be a format error
      expect(content.message).not.toContain('Invalid path-to-app format');
      expect(content.message).not.toContain('At least one path mapping');
      
      // Likely a 403 or 404 error
      logger.info('Got expected API error:', content.message);
    }
  });

  it('should list tool with updated description', async () => {
    const response = await client.makeRequest('tools/list');
    
    const tools = response.result?.tools || [];
    const virtualHostTool = tools.find((t: any) => t.name === 'mittwald_domain_virtualhost_create');
    
    expect(virtualHostTool).toBeDefined();
    expect(virtualHostTool.description).toContain('IMPORTANT: At least one path mapping');
    expect(virtualHostTool.description).toContain('Example:');
  });
});