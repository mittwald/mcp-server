import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectDeleteArgs {
  projectId: string;
  force: boolean;
}

export const handleProjectDelete: MittwaldToolHandler<MittwaldProjectDeleteArgs> = async (args, { mittwaldClient }) => {
  try {
    // Require explicit force confirmation for safety in MCP context
    if (!args.force) {
      return formatToolResponse(
        "error",
        "Project deletion requires explicit confirmation. Set force=true to proceed."
      );
    }

    // Get project info first for confirmation
    let projectInfo;
    try {
      const projectResult = await mittwaldClient.project.getProject({
        projectId: args.projectId,
      });
      projectInfo = projectResult.data;
    } catch (error) {
      return formatToolResponse(
        "error",
        `Project not found or inaccessible: ${args.projectId}`
      );
    }

    // Delete the project
    await mittwaldClient.project.deleteProject({
      projectId: args.projectId,
    });

    return formatToolResponse(
      "success",
      `Project ${args.projectId} deleted successfully`,
      {
        projectId: args.projectId,
        description: projectInfo?.description || "Unknown",
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to delete project: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};