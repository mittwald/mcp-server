import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectDeleteCli } from '../../../../handlers/tools/mittwald-cli/project/delete-cli.js';

const tool: Tool = {
  name: "mittwald_project_delete",
  description: "Delete a project using Mittwald CLI",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      force: {
        type: "boolean",
        description: "Do not ask for confirmation"
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectDeleteCli,
  schema: tool.inputSchema
};

export default registration;