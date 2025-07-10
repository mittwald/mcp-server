import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ContextResetCliParameters {
  // No specific parameters needed for reset
}

export const mittwald_context_reset_cli: Tool = {
  name: 'mittwald_context_reset_cli',
  description: 'Reset context parameters using CLI wrapper',
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};