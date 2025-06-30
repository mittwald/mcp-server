import { describe, it, expect, beforeAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { isDockerRunning, validateMCPResponse } from '../utils/test-helpers';

describe('MCP Server Connection', () => {
  beforeAll(async () => {
    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      throw new Error('Docker container is not running. Run: docker compose up -d');
    }
  });

  it('should connect to the MCP server', async () => {
    const client = new MCPTestClient();
    const response = await client.initialize();
    
    validateMCPResponse(response);
    expect(response.result).toBeDefined();
    expect(response.result.protocolVersion).toBe('0.1.0');
    expect(response.result.serverInfo).toBeDefined();
    expect(response.result.capabilities).toBeDefined();
  });

  it('should maintain session across requests', async () => {
    const client = new MCPTestClient();
    
    // Initialize
    await client.initialize();
    const sessionId1 = client.getSessionId();
    expect(sessionId1).toBeTruthy();
    
    // Make another request
    const response = await client.listTools();
    const sessionId2 = client.getSessionId();
    
    // Session ID should remain the same
    expect(sessionId2).toBe(sessionId1);
    validateMCPResponse(response);
  });

  it('should list available tools', async () => {
    const client = new MCPTestClient();
    await client.initialize();
    
    const response = await client.listTools();
    validateMCPResponse(response);
    
    expect(response.result).toBeDefined();
    expect(response.result.tools).toBeDefined();
    expect(Array.isArray(response.result.tools)).toBe(true);
    expect(response.result.tools.length).toBeGreaterThan(100); // Should have 160+ tools
    
    // Check for mittwald_app_versions tool
    const appVersionsTool = response.result.tools.find(
      (tool: any) => tool.name === 'mittwald_app_versions'
    );
    expect(appVersionsTool).toBeDefined();
    expect(appVersionsTool.description).toBe('List supported Apps and Versions.');
  });

  it('should list available resources', async () => {
    const client = new MCPTestClient();
    await client.initialize();
    
    const response = await client.listResources();
    validateMCPResponse(response);
    
    expect(response.result).toBeDefined();
    expect(response.result.resources).toBeDefined();
    expect(Array.isArray(response.result.resources)).toBe(true);
  });
});