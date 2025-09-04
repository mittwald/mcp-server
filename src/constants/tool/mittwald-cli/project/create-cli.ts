import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleProjectCreateCli } from '../../../../handlers/tools/mittwald-cli/project/create-cli.js';

const tool: Tool = {
  name: "mittwald_project_create",
  title: "Create Project",
  description: "Create a new project.",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "A description for the project"
      },
      serverId: {
        type: "string",
        description: "ID or short ID of a server; this flag is optional if a default server is set in the context"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      wait: {
        type: "boolean",
        description: "Wait for the resource to be ready"
      },
      waitTimeout: {
        type: "string",
        description: "The duration to wait for the resource to be ready (common units like 'ms', 's', 'm' are accepted)",
        default: "600s"
      },
      updateContext: {
        type: "boolean",
        description: "Update the CLI context to use the newly created project"
      }
    },
    required: ["description"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleProjectCreateCli,
  schema: tool.inputSchema
};

export default registration;