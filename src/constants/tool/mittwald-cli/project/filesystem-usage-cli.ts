import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectFilesystemUsageCli } from '../../../../handlers/tools/mittwald-cli/project/filesystem-usage-cli.js';

const tool: Tool = {
  name: "mittwald_project_filesystem_usage_cli",
  description: "Get a project directory filesystem usage using Mittwald CLI",
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
      },
      human: {
        type: "boolean",
        description: "Display human readable sizes"
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectFilesystemUsageCli,
  schema: tool.inputSchema
};

export default registration;