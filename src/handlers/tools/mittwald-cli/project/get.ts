import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectGetArgs {
  projectId: string;
  output?: 'json' | 'table' | 'yaml';
}

export const handleProjectGet: MittwaldToolHandler<MittwaldProjectGetArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get project details from the API
    const result = await mittwaldClient.project.getProject({
      projectId: args.projectId,
    });

    if (!result.data) {
      return formatToolResponse(
        "error",
        `Project not found: ${args.projectId}`
      );
    }

    const project = result.data;
    
    // Format output based on requested format
    let formattedOutput;
    const outputFormat = args.output || 'json';
    
    switch (outputFormat) {
      case 'json':
        formattedOutput = JSON.stringify(project, null, 2);
        break;
      case 'yaml':
        // Simple YAML-like output
        formattedOutput = Object.entries(project)
          .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
          .join('\n');
        break;
      case 'table':
        // Table-like output
        formattedOutput = Object.entries(project)
          .map(([key, value]) => `${key.padEnd(20)} ${typeof value === 'object' ? JSON.stringify(value) : value}`)
          .join('\n');
        break;
      default:
        formattedOutput = JSON.stringify(project, null, 2);
    }

    return formatToolResponse(
      "success",
      `Project details for ${args.projectId}:`,
      {
        project: project,
        formattedOutput: formattedOutput,
        format: outputFormat
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get project: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};