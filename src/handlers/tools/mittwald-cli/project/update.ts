import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectUpdateArgs {
  projectId?: string;
  description?: string;
  quiet?: boolean;
}

export const handleProjectUpdate: MittwaldToolHandler<MittwaldProjectUpdateArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!args.projectId) {
      return formatToolResponse(
        'error',
        'Project ID is required to update a project.'
      );
    }

    if (!args.description) {
      return formatToolResponse(
        'error',
        'Description is required to update a project.'
      );
    }

    // Update project using the Mittwald API
    const result = await mittwaldClient.api.project.updateProjectDescription({
      projectId: args.projectId,
      data: {
        description: args.description,
      },
    });

    // Get updated project details
    const project = await mittwaldClient.api.project.getProject({
      projectId: args.projectId
    });

    if (!args.quiet) {
      const responseText = `Project updated successfully!

Project ID: ${args.projectId}
New Description: ${args.description}
Updated Project Details: ${project.data?.description || 'N/A'}`;

      return formatToolResponse('success', responseText);
    } else {
      // Quiet mode - machine readable summary
      return formatToolResponse(
        'success',
        'Project updated successfully',
        {projectId: args.projectId, description: args.description, status: 'updated'}
      );
    }
    
  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};