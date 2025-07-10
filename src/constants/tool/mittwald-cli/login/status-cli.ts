import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface LoginStatusCliParameters {
  output?: 'txt' | 'json' | 'yaml';
}

export const mittwald_login_status_cli: Tool = {
  name: 'mittwald_login_status_cli',
  description: 'Check login status using CLI wrapper',
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