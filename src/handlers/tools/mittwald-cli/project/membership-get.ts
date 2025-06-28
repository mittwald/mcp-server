import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectMembershipGetArgs {
  membershipId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleMittwaldProjectMembershipGet: MittwaldToolHandler<MittwaldProjectMembershipGetArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get the project membership by ID
    const result = await mittwaldClient.api.project.getProjectMembership({
      projectMembershipId: args.membershipId,
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