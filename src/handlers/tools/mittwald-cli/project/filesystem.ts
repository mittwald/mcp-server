import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

export interface MittwaldProjectFilesystemArgs {
  command?: 'usage';
  help?: boolean;
}

export const handleProjectFilesystem: MittwaldToolHandler<MittwaldProjectFilesystemArgs> = async (args) => {
  try {
    if (args.help || !args.command) {
      const helpMessage = `
Project Filesystem Commands:

Available commands:
  usage  - Get a project directory filesystem usage

Usage:
  Use the specific command:
  - mittwald_project_filesystem_usage

Examples:
  - To get filesystem usage: use mittwald_project_filesystem_usage with projectId
      `;

      return formatToolResponse(
        "success",
        helpMessage.trim(),
        {
          availableCommands: ["usage"],
          specificTools: ["mittwald_project_filesystem_usage"]
        }
      );
    }

    // Provide guidance on which specific tool to use
    switch (args.command) {
      case "usage":
        return formatToolResponse(
          "success",
          "To get project filesystem usage, use the mittwald_project_filesystem_usage tool with a projectId parameter",
          { recommendedTool: "mittwald_project_filesystem_usage" }
        );
      default:
        return formatToolResponse(
          "error",
          `Unknown command: ${args.command}. Available commands: usage`
        );
    }

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};