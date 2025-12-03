import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSessionAwareContextGet } from '../../../../handlers/tools/mittwald-cli/context/session-aware-context.js';

export interface SessionAwareContextGetCliParameters {
  output?: 'txt' | 'json' | 'yaml';
}

const tool: Tool = {
  name: 'mittwald_context_get_session',
  title: 'Get Session Context',
  description: 'Get current user context from Redis session (session-aware, multi-tenant safe)',
  inputSchema: {
    type: "object",
    properties: {
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: 'The output format to use; use "txt" for a human readable text representation, "json" for a machine-readable JSON representation, or "yaml" for YAML format'
      }
    },
    required: []
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSessionAwareContextGet,
  schema: tool.inputSchema
};

export default registration;