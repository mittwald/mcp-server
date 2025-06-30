import { describe, it, expect, beforeAll, vi } from 'vitest';
import { handleMittwaldAppDependencyList } from '../../src/handlers/tools/mittwald-cli/app/dependency/list';
import { handleMittwaldAppDependencyVersions } from '../../src/handlers/tools/mittwald-cli/app/dependency/versions';
import { handleMittwaldAppDependencyUpdate } from '../../src/handlers/tools/mittwald-cli/app/dependency/update';
import { handleMittwaldAppDependencyGet } from '../../src/handlers/tools/mittwald-cli/app/dependency/get';
import type { MittwaldToolHandlerContext } from '../../src/types/mittwald/conversation';

/**
 * Integration tests for system software handlers
 * Tests the handlers with mocked API responses
 */
describe('System Software Handlers Integration', () => {
  let mockContext: MittwaldToolHandlerContext;
  
  beforeAll(() => {
    // Create mock context with API client
    mockContext = {
      mittwaldClient: {
        app: {
          listSystemsoftwares: vi.fn(),
          listSystemsoftwareversions: vi.fn(),
          getInstalledSystemsoftwareForAppinstallation: vi.fn(),
          patchAppinstallation: vi.fn()
        }
      } as any,
      userId: 'test-user',
      sessionId: 'test-session',
      progressToken: 'test-token'
    };
  });

  describe('handleMittwaldAppDependencyList', () => {
    it('should list system software in JSON format', async () => {
      const mockSoftware = [
        { id: '123', name: 'composer', description: 'PHP package manager' },
        { id: '456', name: 'im', description: 'ImageMagick' }
      ];
      
      mockContext.mittwaldClient.app.listSystemsoftwares.mockResolvedValue({
        status: 200,
        data: mockSoftware
      });
      
      const result = await handleMittwaldAppDependencyList(
        { output: 'json' },
        mockContext
      );
      
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe('success');
      expect(parsed.message).toContain('Found 2 system software packages');
      expect(parsed.data).toBeInstanceOf(Array);
      expect(parsed.data.length).toBe(2);
    });

    it('should format as CSV when requested', async () => {
      const mockSoftware = [
        { id: '123', name: 'composer', description: 'PHP package manager' }
      ];
      
      mockContext.mittwaldClient.app.listSystemsoftwares.mockResolvedValue({
        status: 200,
        data: mockSoftware
      });
      
      const result = await handleMittwaldAppDependencyList(
        { output: 'csv', csvSeparator: ';' },
        mockContext
      );
      
      expect(result.content[0].text).toContain('ID;Name;Description;Version');
      expect(result.content[0].text).toContain('composer');
    });

    it('should handle API errors gracefully', async () => {
      mockContext.mittwaldClient.app.listSystemsoftwares.mockRejectedValue(
        new Error('API Error')
      );
      
      const result = await handleMittwaldAppDependencyList({}, mockContext);
      
      expect(result.content[0].text).toContain('"status":"error"');
      expect(result.content[0].text).toContain('API Error');
    });
  });

  describe('handleMittwaldAppDependencyVersions', () => {
    it('should list versions for a known software', async () => {
      const mockVersions = [
        { id: 'v1', externalVersion: '2.0.0', recommended: true },
        { id: 'v2', externalVersion: '1.5.0', recommended: false }
      ];
      
      mockContext.mittwaldClient.app.listSystemsoftwares.mockResolvedValue({
        status: 200,
        data: [{ id: '123', name: 'composer' }]
      });
      
      mockContext.mittwaldClient.app.listSystemsoftwareversions.mockResolvedValue({
        status: 200,
        data: mockVersions
      });
      
      const result = await handleMittwaldAppDependencyVersions(
        { systemsoftware: 'composer', output: 'json' },
        mockContext
      );
      
      expect(result.content[0].text).toContain('"status":"success"');
      expect(result.content[0].text).toContain('Found 2 versions');
      expect(result.content[0].text).toContain('2.0.0');
    });

    it('should handle unknown software name', async () => {
      mockContext.mittwaldClient.app.listSystemsoftwares.mockResolvedValue({
        status: 200,
        data: []
      });
      
      const result = await handleMittwaldAppDependencyVersions(
        { systemsoftware: 'unknown-software' },
        mockContext
      );
      
      expect(result.content[0].text).toContain('"status":"error"');
      expect(result.content[0].text).toContain('not found');
    });

    it('should handle missing systemsoftware parameter', async () => {
      const result = await handleMittwaldAppDependencyVersions(
        {} as any,
        mockContext
      );
      
      expect(result.content[0].text).toContain('"status":"error"');
      expect(result.content[0].text).toContain('required');
    });
  });

  describe('handleMittwaldAppDependencyUpdate', () => {
    it('should update system software with version specifier', async () => {
      mockContext.mittwaldClient.app.listSystemsoftwares.mockResolvedValue({
        status: 200,
        data: [{ id: '123', name: 'composer' }]
      });
      
      mockContext.mittwaldClient.app.listSystemsoftwareversions.mockResolvedValue({
        status: 200,
        data: [
          { id: 'v1', externalVersion: '2.5.0' },
          { id: 'v2', externalVersion: '2.4.0' }
        ]
      });
      
      mockContext.mittwaldClient.app.patchAppinstallation.mockResolvedValue({
        status: 204
      });
      
      const result = await handleMittwaldAppDependencyUpdate(
        {
          installationId: 'app-123',
          set: ['composer=~2'],
          updatePolicy: 'patchLevel'
        },
        mockContext
      );
      
      expect(result.content[0].text).toContain('"status":"success"');
      expect(result.content[0].text).toContain('Successfully updated');
      expect(mockContext.mittwaldClient.app.patchAppinstallation).toHaveBeenCalledWith({
        appInstallationId: 'app-123',
        data: {
          systemSoftware: expect.any(Object)
        }
      });
    });

    it('should handle invalid dependency format', async () => {
      const result = await handleMittwaldAppDependencyUpdate(
        {
          installationId: 'app-123',
          set: ['invalid-format']
        },
        mockContext
      );
      
      expect(result.content[0].text).toContain('"status":"error"');
      expect(result.content[0].text).toContain('Invalid dependency format');
    });

    it('should handle missing version match', async () => {
      mockContext.mittwaldClient.app.listSystemsoftwares.mockResolvedValue({
        status: 200,
        data: [{ id: '123', name: 'composer' }]
      });
      
      mockContext.mittwaldClient.app.listSystemsoftwareversions.mockResolvedValue({
        status: 200,
        data: []
      });
      
      const result = await handleMittwaldAppDependencyUpdate(
        {
          installationId: 'app-123',
          set: ['composer=999.0.0']
        },
        mockContext
      );
      
      expect(result.content[0].text).toContain('"status":"error"');
      expect(result.content[0].text).toContain('No matching version found');
    });

    it('should support quiet mode', async () => {
      mockContext.mittwaldClient.app.listSystemsoftwares.mockResolvedValue({
        status: 200,
        data: [{ id: '123', name: 'composer' }]
      });
      
      mockContext.mittwaldClient.app.listSystemsoftwareversions.mockResolvedValue({
        status: 200,
        data: [{ id: 'v1', externalVersion: '2.5.0', recommended: true }]
      });
      
      mockContext.mittwaldClient.app.patchAppinstallation.mockResolvedValue({
        status: 204
      });
      
      const result = await handleMittwaldAppDependencyUpdate(
        {
          installationId: 'app-123',
          set: ['composer=latest'],
          quiet: true
        },
        mockContext
      );
      
      expect(result.content[0].text).toContain('"status":"success"');
      expect(result.content[0].text).toContain('app-123');
    });
  });

  describe('handleMittwaldAppDependencyGet', () => {
    it('should get installed system software', async () => {
      const mockInstalled = [
        {
          systemSoftwareId: '123',
          systemSoftwareVersion: { current: 'v1', desired: 'v1' },
          updatePolicy: 'patchLevel'
        }
      ];
      
      mockContext.mittwaldClient.app.getInstalledSystemsoftwareForAppinstallation.mockResolvedValue({
        status: 200,
        data: mockInstalled
      });
      
      mockContext.mittwaldClient.app.listSystemsoftwares.mockResolvedValue({
        status: 200,
        data: [{ id: '123', name: 'composer' }]
      });
      
      const result = await handleMittwaldAppDependencyGet(
        { installationId: 'app-123', output: 'json' },
        mockContext
      );
      
      expect(result.content[0].text).toContain('"status":"success"');
      expect(result.content[0].text).toContain('Found 1 installed');
    });

    it('should show formatted table by default', async () => {
      mockContext.mittwaldClient.app.getInstalledSystemsoftwareForAppinstallation.mockResolvedValue({
        status: 200,
        data: []
      });
      
      mockContext.mittwaldClient.app.listSystemsoftwares.mockResolvedValue({
        status: 200,
        data: []
      });
      
      const result = await handleMittwaldAppDependencyGet(
        { installationId: 'app-123' },
        mockContext
      );
      
      expect(result.content[0].text).toContain('"status":"success"');
      expect(result.content[0].text).toContain('No system software installed');
    });

    it('should handle missing app ID', async () => {
      const result = await handleMittwaldAppDependencyGet(
        {} as any,
        mockContext
      );
      
      expect(result.content[0].text).toContain('"status":"error"');
      expect(result.content[0].text).toContain('required');
    });
  });
});