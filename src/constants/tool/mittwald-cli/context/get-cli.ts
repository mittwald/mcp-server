import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ContextGetCliParameters {
  output?: 'txt' | 'json' | 'yaml';
}

export const mittwald_context_get_cli: Tool = {
  name: 'mittwald_context_get_cli',
  description: 'Print an overview of currently set context parameters using CLI wrapper',
  inputSchema: {
    type: "object",
    properties: {
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        default: "json",
        description: 'The output format to use; use "txt" for a human readable text representation, "json" for a machine-readable JSON representation, or "yaml" for YAML format'
      }
    },
    required: []
  }
};