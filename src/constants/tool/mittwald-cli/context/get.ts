import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ContextGetParameters {
  output?: 'txt' | 'json';
}

export const mittwald_context_get: Tool = {
  name: 'mittwald_context_get',
  description: 'Print an overview of currently set context parameters',
  inputSchema: {
    type: "object",
    properties: {
      output: {
        type: "string",
        enum: ["txt", "json"],
        default: "txt",
        description: 'The output format to use; use "txt" for a human readable text representation, and "json" for a machine-readable JSON representation'
      }
    },
    required: []
  }
};