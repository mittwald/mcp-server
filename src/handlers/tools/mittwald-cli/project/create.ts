import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectCreateArgs {
  description: string;
  serverId: string;
  wait?: boolean;
  waitTimeout?: number;
  updateContext?: boolean;
}

export const handleProjectCreate: MittwaldToolHandler<MittwaldProjectCreateArgs> = async (args, { mittwaldClient }) => {
  try {
    // Create project using the Mittwald API
    const result = await mittwaldClient.api.project.createProject({
      serverId: args.serverId,
      data: {
        description: args.description,
      },
    });

    if (!result.data || !result.data.id) {
      return formatToolResponse(
        "error",
        "Failed to create project: No project ID returned"
      );
    }

    const projectId = String(result.data.id);
    let response = `Project created successfully with ID: ${projectId}`;

    // Wait for project to be ready if requested
    if (args.wait) {
      const timeout = args.waitTimeout || 300000; // 5 minutes default
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        try {
          const projectStatus = await mittwaldClient.api.project.getProject({
            projectId: projectId,
          });

          if (projectStatus.data?.status === 'ready') {
            response += '\nProject is now ready.';
            break;
          }

          // Wait 2 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          // Continue waiting if we can't get status yet
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Note: updateContext not implemented in MCP context as it's CLI-specific
    if (args.updateContext) {
      response += '\nNote: Context update is not applicable in MCP environment.';
    }

    return formatToolResponse(
      "success",
      response,
      {
        projectId: projectId,
        description: args.description,
        serverId: args.serverId,
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to create project: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};