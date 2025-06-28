import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectMembershipGetOwnArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleMittwaldProjectMembershipGetOwn: MittwaldToolHandler<MittwaldProjectMembershipGetOwnArgs> = async (args, { mittwaldClient }) => {
  try {
    // If no projectId provided, we would need to get it from context
    // For now, we'll require it since we don't have context management
    if (!args.projectId) {
      return formatToolResponse({
        success: false,
        error: 'Project ID is required. Use the projectId parameter to specify a project.'
      });
    }

    // Get the current user's membership for the specified project
    const result = await mittwaldClient.api.project.getUserMembershipForProject({
      projectId: args.projectId,
    });

    if (!result.data) {
      return formatToolResponse({
        success: false,
        error: 'No membership data received from API'
      });
    }

    const membership = result.data;

    // Format output based on type
    if (args.output === 'json') {
      return formatToolResponse({
        success: true,
        data: membership
      });
    }

    if (args.output === 'yaml') {
      const yamlOutput = `
id: ${membership.id || 'N/A'}
projectId: ${membership.projectId || 'N/A'}
userId: ${membership.userId || 'N/A'}
role: ${membership.role || 'N/A'}
createdAt: ${membership.createdAt || 'N/A'}
updatedAt: ${membership.updatedAt || 'N/A'}`;

      return formatToolResponse({
        success: true,
        data: yamlOutput.trim()
      });
    }

    // Default txt format
    const txtOutput = `
ID: ${membership.id || 'N/A'}
Project ID: ${membership.projectId || 'N/A'}
User ID: ${membership.userId || 'N/A'}
Role: ${membership.role || 'N/A'}
Created At: ${membership.createdAt || 'N/A'}
Updated At: ${membership.updatedAt || 'N/A'}`;

    return formatToolResponse({
      success: true,
      data: txtOutput.trim()
    });

  } catch (error) {
    return formatToolResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};