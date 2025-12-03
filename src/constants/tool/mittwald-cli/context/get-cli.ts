import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleContextGetCli } from '../../../../handlers/tools/mittwald-cli/context/get-cli.js';

export interface ContextGetCliParameters {
  output?: 'txt' | 'json' | 'yaml';
}

const tool: Tool = {
  name: 'mittwald_context_get',
  title: 'Get Context Info',
  description: 'Print an overview of currently set context parameters.',
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
  handler: handleContextGetCli,
  schema: tool.inputSchema
};

export default registration;