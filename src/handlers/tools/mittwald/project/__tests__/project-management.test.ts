import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getMittwaldClient } from '../../../../../services/mittwald/index.js';
import { handleProjectList, handleProjectGet } from '../project-management.js';

// Mock the Mittwald client
vi.mock('../../../../../services/mittwald/index.js', () => ({
  getMittwaldClient: vi.fn(),
}));

describe('Project Management Handlers', () => {
  const mockClient = {
    api: {
      project: {
        listProjects: vi.fn(),
        getProject: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getMittwaldClient as any).mockReturnValue(mockClient);
  });

  describe('handleProjectList', () => {
    it('should successfully list projects', async () => {
      const mockProjects = [
        { id: 'proj-1', shortId: 'p-123', description: 'Test Project 1' },
        { id: 'proj-2', shortId: 'p-456', description: 'Test Project 2' },
      ];

      mockClient.api.project.listProjects.mockResolvedValue({
        status: 200,
        data: mockProjects,
      });

      const result = await handleProjectList({ limit: 10 });

      expect(mockClient.api.project.listProjects).toHaveBeenCalledWith({ limit: 10 });
      expect(result.content[0].text).toContain('Successfully retrieved project list');
      expect(result.content[0].text).toContain('"count": 2');
    });

    it('should handle API errors', async () => {
      mockClient.api.project.listProjects.mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await handleProjectList({});

      expect(result.content[0].text).toContain('Failed to list projects');
      expect(result.content[0].text).toContain('"status": "error"');
    });
  });

  describe('handleProjectGet', () => {
    it('should successfully get project details', async () => {
      const mockProject = {
        id: 'proj-1',
        shortId: 'p-123',
        description: 'Test Project',
        customerId: 'cust-1',
      };

      mockClient.api.project.getProject.mockResolvedValue({
        status: 200,
        data: mockProject,
      });

      const result = await handleProjectGet({ projectId: 'proj-1' });

      expect(mockClient.api.project.getProject).toHaveBeenCalledWith({ projectId: 'proj-1' });
      expect(result.content[0].text).toContain('Successfully retrieved project details');
      expect(result.content[0].text).toContain('"id": "proj-1"');
    });

    it('should handle not found errors', async () => {
      mockClient.api.project.getProject.mockResolvedValue({
        status: 404,
        statusText: 'Not Found',
      });

      const result = await handleProjectGet({ projectId: 'proj-1' });

      expect(result.content[0].text).toContain('Failed to get project');
      expect(result.content[0].text).toContain('"status": "error"');
    });
  });
});