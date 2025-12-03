import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSessionAwareContextSet } from '../../../../handlers/tools/mittwald-cli/context/session-aware-context.js';

export interface SessionAwareContextSetCliParameters {
  projectId?: string;
  serverId?: string;
  orgId?: string;
  installationId?: string;
  stackId?: string;
}

const tool: Tool = {
  name: 'mittwald_context_set_session',
  title: 'Set Session Context',
  description: 'Set user context in Redis session (session-aware, multi-tenant safe)',
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: 'The project ID to set as context for this user session'
      },
      serverId: {
        type: "string",
        description: 'The server ID to set as context for this user session'
      },
      orgId: {
        type: "string",
        description: 'The organization ID to set as context for this user session'
      },
      installationId: {
        type: "string",
        description: 'The installation ID to set as context for this user session'
      },
      stackId: {
        type: "string",
        description: 'The stack ID to set as context for this user session'
      }
    },
    required: [],
    additionalProperties: false
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSessionAwareContextSet,
  schema: tool.inputSchema
};

export default registration;