import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContextSetCli } from '../../../../handlers/tools/mittwald-cli/context/set-cli.js';

export interface ContextSetCliParameters {
  projectId?: string;
  serverId?: string;
  orgId?: string;
  installationId?: string;
  stackId?: string;
}

const tool: Tool = {
  name: 'mittwald_context_set_cli',
  description: 'Set context parameters using CLI wrapper',
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: 'The project ID to set as context'
      },
      serverId: {
        type: "string",
        description: 'The server ID to set as context'
      },
      orgId: {
        type: "string",
        description: 'The organization ID to set as context'
      },
      installationId: {
        type: "string",
        description: 'The installation ID to set as context'
      },
      stackId: {
        type: "string",
        description: 'The stack ID to set as context'
      }
    },
    required: [],
    anyOf: [
      { required: ["projectId"] },
      { required: ["serverId"] },
      { required: ["orgId"] },
      { required: ["installationId"] },
      { required: ["stackId"] }
    ]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleContextSetCli,
  schema: tool.inputSchema
};

export default registration;