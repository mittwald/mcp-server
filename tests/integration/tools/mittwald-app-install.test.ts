import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from '../../utils/mcp-test-client';
import { 
  isDockerRunning, 
  validateMCPResponse, 
  parseToolContent 
} from '../../utils/test-helpers';

describe('mittwald_app_install tools', () => {
  let client: MCPTestClient;

  beforeAll(async () => {
    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      throw new Error('Docker container is not running. Run: docker compose up -d');
    }

    client = new MCPTestClient();
    const initResponse = await client.initialize();
    validateMCPResponse(initResponse);
  });

  afterAll(async () => {
    await client.close();
  });

  describe('Generic mittwald_app_install', () => {
    it('should dispatch to WordPress handler', async () => {
      const response = await client.callTool('mittwald_app_install', {
        app_type: 'wordpress',
        project_id: 'test-project-id',
        version: '6.8.1',
        host: 'test.example.com',
        admin_user: 'testuser',
        admin_email: 'test@example.com',
        admin_pass: 'TestPass123!',
        site_title: 'Test Site',
        wait: false
      });

      validateMCPResponse(response);
      const content = parseToolContent(response.result);
      
      // Should get an error because it's a test project ID
      expect(content.status).toBe('error');
      // But the error should be from the WordPress handler, not the generic handler
      expect(content.message).not.toContain('Implementation pending');
    });

    it('should return error for unknown app type', async () => {
      const response = await client.callTool('mittwald_app_install', {
        app_type: 'unknown-app',
        project_id: 'test-project-id'
      });

      validateMCPResponse(response);
      const content = parseToolContent(response.result);
      
      expect(content.status).toBe('error');
      expect(content.message).toContain('Unknown app type: unknown-app');
    });

    it('should return error for missing project_id', async () => {
      const response = await client.callTool('mittwald_app_install', {
        app_type: 'wordpress'
      });

      validateMCPResponse(response);
      const content = parseToolContent(response.result);
      
      expect(content.status).toBe('error');
      expect(content.message).toBe('Project ID is required');
    });
  });

  describe('mittwald_app_install_wordpress', () => {
    it('should validate project ID', async () => {
      const response = await client.callTool('mittwald_app_install_wordpress', {
        projectId: 'invalid-project-id',
        version: '6.8.1'
      });

      validateMCPResponse(response);
      const content = parseToolContent(response.result);
      
      expect(content.status).toBe('error');
      // The exact error message will depend on the API response
    });

    it('should handle version lookup', async () => {
      const response = await client.callTool('mittwald_app_install_wordpress', {
        projectId: 'test-project-id',
        version: 'non-existent-version'
      });

      validateMCPResponse(response);
      const content = parseToolContent(response.result);
      
      expect(content.status).toBe('error');
      // Should mention the version not being found
      expect(content.message.toLowerCase()).toContain('version');
    });
  });
});