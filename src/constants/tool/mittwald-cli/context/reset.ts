import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ContextResetParameters {}

export const mittwald_context_reset: Tool = {
  name: 'mittwald_context_reset',
  description: 'Reset context values - resets any values for common parameters that you\'ve previously set with \'context set\'',
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};