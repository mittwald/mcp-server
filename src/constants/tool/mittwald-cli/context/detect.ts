import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_context_detect: Tool = {
  name: 'mittwald_context_detect',
  description: 'Intelligently detects the type of Mittwald ID provided and shows its context and hierarchy. Helps prevent common mistakes like using stack IDs instead of project IDs.',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Any Mittwald ID (project, server, app, stack, container, etc.)'
      }
    },
    required: ['id']
  }
};