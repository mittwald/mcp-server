import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectGetCli } from '../../../../handlers/tools/mittwald-cli/project/get-cli.js';

const tool: Tool = {
  name: "mittwald_project_get",
  description: "Get details of a project using Mittwald CLI",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      output: {
        type: "string",
        description: "Output format",
        enum: ["txt", "json", "yaml"],
        default: "json"
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectGetCli,
  schema: tool.inputSchema
};

export default registration;