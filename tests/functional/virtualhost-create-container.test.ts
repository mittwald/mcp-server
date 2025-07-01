/**
 * Test to verify virtualhost create with container targets
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { parseToolContent } from '../utils/test-helpers';

describe('VirtualHost Create with Container Targets', () => {
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

  it('should accept valid container short ID with port', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'opensearch.example.com',
      pathToContainer: ['/:c-f6kw84:5601/tcp'] // OpenSearch Dashboard port
    });
    
    const content = parseToolContent(response.result);
    
    // Will likely fail with API error, but should pass validation
    if (content.status === 'error') {
      expect(content.message).not.toContain('Invalid container ID format');
      expect(content.message).not.toContain('Invalid port format');
      expect(content.message).not.toContain('Invalid path-to-container format');
    }
  });

  it('should accept valid container UUID with port', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'nginx.example.com',
      pathToContainer: ['/:3f7d4b6a-1234-5678-9abc-def012345678:80/tcp']
    });
    
    const content = parseToolContent(response.result);
    
    // Will likely fail with API error, but should pass validation
    if (content.status === 'error') {
      expect(content.message).not.toContain('Invalid container ID format');
      expect(content.message).not.toContain('Invalid port format');
    }
  });

  it('should reject invalid port format', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'test.example.com',
      pathToContainer: ['/:c-f6kw84:5601'] // Missing protocol
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('error');
    expect(content.message).toContain('Invalid port format');
    expect(content.message).toContain('Expected format: port/protocol');
  });

  it('should reject missing port in container mapping', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'test.example.com',
      pathToContainer: ['/:c-f6kw84'] // Missing port
    });
    
    const content = parseToolContent(response.result);
    expect(content.status).toBe('error');
    expect(content.message).toContain('Invalid path-to-container format');
    expect(content.message).toContain('Expected format: path:containerId:port');
  });

  it('should accept UDP ports', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'udp.example.com',
      pathToContainer: ['/:c-abc123:53/udp'] // DNS server example
    });
    
    const content = parseToolContent(response.result);
    
    // Should pass validation
    if (content.status === 'error') {
      expect(content.message).not.toContain('Invalid port format');
    }
  });

  it('should support mixed target types', async () => {
    const response = await client.callTool('mittwald_domain_virtualhost_create', {
      hostname: 'mixed.example.com',
      pathToApp: ['/app:a-123456'],
      pathToContainer: ['/dashboard:c-f6kw84:5601/tcp'],
      pathToUrl: ['/docs:https://docs.example.com']
    });
    
    const content = parseToolContent(response.result);
    
    // Should pass validation for all three types
    if (content.status === 'error') {
      expect(content.message).not.toContain('Invalid app ID format');
      expect(content.message).not.toContain('Invalid container ID format');
      expect(content.message).not.toContain('Invalid path-to-url format');
    }
  });
});