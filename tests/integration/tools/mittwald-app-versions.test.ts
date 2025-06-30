import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../../utils/mcp-test-client';
import { 
  isDockerRunning, 
  validateMCPResponse, 
  validateToolResponse,
  parseToolContent 
} from '../../utils/test-helpers';

describe('mittwald_app_versions tool', () => {
  let client: MCPTestClient;

  beforeAll(async () => {
    // Check if Docker is running
    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      throw new Error('Docker container is not running. Run: docker compose up -d');
    }

    // Initialize MCP client
    client = new MCPTestClient();
    const initResponse = await client.initialize();
    validateMCPResponse(initResponse);
    expect(initResponse.result).toBeDefined();
  });

  afterAll(async () => {
    await client.close();
  });

  describe('Basic functionality', () => {
    it('should list all app versions with default text output', async () => {
      const response = await client.callTool('mittwald_app_versions');
      validateMCPResponse(response);
      
      const result = response.result;
      validateToolResponse(result);
      
      const content = parseToolContent(result);
      expect(content.status).toBe('success');
      expect(content.message).toBe('All app versions');
      expect(content.data).toHaveProperty('output');
      expect(content.data).toHaveProperty('summary');
      expect(content.data).toHaveProperty('totalVersionsShown');
      expect(content.data).toHaveProperty('note');
      
      // Check the note about all versions being available
      expect(content.data.note).toBe('All versions remain available for installation - specify exact version when installing');
    });

    it('should return JSON output when requested', async () => {
      const response = await client.callTool('mittwald_app_versions', {
        output: 'json'
      });
      
      validateMCPResponse(response);
      const content = parseToolContent(response.result);
      
      expect(content.status).toBe('success');
      expect(content.data).toHaveProperty('apps');
      expect(Array.isArray(content.data.apps)).toBe(true);
    });
  });

  describe('Version filtering', () => {
    it('should return filtered versions (latest per major)', async () => {
      const response = await client.callTool('mittwald_app_versions', {
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      const apps = content.data.apps;
      
      // Find Shopware 6 to verify filtering
      const shopware6 = apps.find((app: any) => app.name === 'Shopware 6');
      expect(shopware6).toBeDefined();
      
      // Should only have 1 version (latest) instead of 65+
      expect(shopware6.versions.length).toBeLessThanOrEqual(3); // Allow for multiple major versions
      
      // Verify no unnecessary fields
      if (shopware6.versions.length > 0) {
        const version = shopware6.versions[0];
        expect(version).toHaveProperty('id');
        expect(version).toHaveProperty('externalVersion');
        expect(version).toHaveProperty('internalVersion');
        
        // These fields should NOT be present
        expect(version).not.toHaveProperty('supported');
        expect(version).not.toHaveProperty('deprecated');
        expect(version).not.toHaveProperty('current');
      }
      
      // Apps should not have description field
      expect(shopware6).not.toHaveProperty('description');
    });

    it('should significantly reduce total version count', async () => {
      const response = await client.callTool('mittwald_app_versions', {
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      const apps = content.data.apps;
      
      // Count total versions
      const totalVersions = apps.reduce((sum: number, app: any) => 
        sum + app.versions.length, 0
      );
      
      // Should be dramatically less than the original 417
      expect(totalVersions).toBeLessThan(50); // Should be around 22
      expect(totalVersions).toBeGreaterThan(10); // But not too few
    });
  });

  describe('Specific app filtering', () => {
    it('should return versions for a specific app by name', async () => {
      const response = await client.callTool('mittwald_app_versions', {
        app: 'WordPress',
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.message).toBe('Versions for app "WordPress"');
      
      const apps = content.data.apps;
      expect(apps.length).toBe(1);
      expect(apps[0].name).toBe('WordPress');
    });

    it('should handle case-insensitive app names', async () => {
      const response = await client.callTool('mittwald_app_versions', {
        app: 'wordpress',
        output: 'json'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data.apps.length).toBe(1);
      expect(content.data.apps[0].name).toBe('WordPress');
    });

    it('should return error for non-existent app', async () => {
      const response = await client.callTool('mittwald_app_versions', {
        app: 'NonExistentApp'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('error');
      expect(content.message).toContain('App "NonExistentApp" not found');
      expect(content.message).toContain('Available apps:');
    });
  });

  describe('Output formats', () => {
    it('should support text output format', async () => {
      const response = await client.callTool('mittwald_app_versions', {
        output: 'txt'
      });
      
      const content = parseToolContent(response.result);
      expect(content.status).toBe('success');
      expect(content.data.output).toBeDefined();
      expect(typeof content.data.output).toBe('string');
      
      // Should contain app names followed by versions
      expect(content.data.output).toMatch(/WordPress:\n\s+\d+\.\d+/);
    });

    it('should show version numbers without status fields in text output', async () => {
      const response = await client.callTool('mittwald_app_versions', {
        app: 'TYPO3',
        output: 'txt'
      });
      
      const content = parseToolContent(response.result);
      const output = content.data.output;
      
      // Should not contain status indicators
      expect(output).not.toContain('(current)');
      expect(output).not.toContain('(deprecated)');
      expect(output).not.toContain('(unsupported)');
      
      // Should just be clean version numbers
      expect(output).toMatch(/TYPO3:\n\s+\d+\.\d+/);
    });
  });

  describe('Summary information', () => {
    it('should provide accurate summary information', async () => {
      const response = await client.callTool('mittwald_app_versions');
      
      const content = parseToolContent(response.result);
      expect(content.data.summary).toContain('showing latest version per major release');
      expect(content.data.totalVersionsShown).toBeGreaterThan(0);
      expect(content.data.totalVersionsShown).toBeLessThan(50);
    });
  });
});