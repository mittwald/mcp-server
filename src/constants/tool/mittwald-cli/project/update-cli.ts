import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectUpdateCli } from '../../../../handlers/tools/mittwald-cli/project/update-cli.js';

const tool: Tool = {
  name: "mittwald_project_update",
  title: "Update Project",
  description: "Update an existing project.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      description: {
        type: "string",
        description: "Set the project description"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectUpdateCli,
  schema: tool.inputSchema
};

export default registration;