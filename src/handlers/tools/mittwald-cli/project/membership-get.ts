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
      return formatToolResponse(
        'error',
        'No membership data received from API'
      );
    }

    const membership = result.data;

    // Format output based on type
    if (args.output === 'json') {
      return formatToolResponse(
        'success',
        'Membership retrieved successfully',
        membership
      );
    }

    if (args.output === 'yaml') {
      const yamlOutput = `
id: ${membership.id || 'N/A'}
projectId: ${membership.projectId || 'N/A'}
userId: ${membership.userId || 'N/A'}
role: ${membership.role || 'N/A'}
email: ${membership.email || 'N/A'}
firstName: ${membership.firstName || 'N/A'}
lastName: ${membership.lastName || 'N/A'}`;

      return formatToolResponse(
        'success',
        'Membership retrieved in YAML format',
        yamlOutput.trim()
      );
    }

    // Default txt format
    const txtOutput = `
ID: ${membership.id || 'N/A'}
Project ID: ${membership.projectId || 'N/A'}
User ID: ${membership.userId || 'N/A'}
Role: ${membership.role || 'N/A'}
Email: ${membership.email || 'N/A'}
First Name: ${membership.firstName || 'N/A'}
Last Name: ${membership.lastName || 'N/A'}`;

    return formatToolResponse(
      'success',
      'Membership retrieved successfully',
      txtOutput.trim()
    );

  } catch (error) {
    return formatToolResponse(
      'error',
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};