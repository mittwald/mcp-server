/**
 * @file mittwald_login tool definition
 * @module constants/tool/mittwald-cli/login
 */

export const mittwald_login = {
  name: 'mittwald_login',
  description: 'Manage your client authentication. Lists available login commands.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
} as const;