/**
 * Test to verify the container safety guide resource is available
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';
import { logger } from '../../src/utils/logger';

describe('Container Safety Guide Resource', () => {
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

  it('should list the container safety guide resource', async () => {
    const response = await client.listResources();
    
    logger.info('List resources response:', JSON.stringify(response, null, 2));
    
    const resources = response.result?.resources || response.resources;
    logger.info('Available resources:', resources?.length || 0);
    
    // Find the container safety guide
    const safetyGuide = resources?.find(
      r => r.uri === 'mittwald://container-safety-guide'
    );
    
    expect(safetyGuide).toBeDefined();
    expect(safetyGuide?.name).toBe('Container Operations Safety Guide');
    expect(safetyGuide?.mimeType).toBe('text/markdown');
  });

  it('should read the container safety guide content', async () => {
    const response = await client.readResource('mittwald://container-safety-guide');
    
    const contents = response.result?.contents || response.contents;
    expect(contents).toBeDefined();
    expect(contents.length).toBeGreaterThan(0);
    
    const content = contents[0];
    expect(content.uri).toBe('mittwald://container-safety-guide');
    expect(content.mimeType).toBe('text/markdown');
    expect(content.text).toContain('CRITICAL WARNING: Declarative Stack API');
    expect(content.text).toContain('Safe Container Management Workflow');
    
    logger.info('Container safety guide loaded successfully');
    logger.info(`Content length: ${content.text?.length} characters`);
  });
});