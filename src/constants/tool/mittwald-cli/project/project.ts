import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project: Tool = {
  name: 'mittwald_project',
  description: 'Manage your projects, and also any kinds of user memberships concerning these projects. Shows available project commands and topics.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false
  }
};