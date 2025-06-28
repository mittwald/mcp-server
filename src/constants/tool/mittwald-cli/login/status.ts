/**
 * @file mittwald_login_status tool definition
 * @module constants/tool/mittwald-cli/login
 */

export const mittwald_login_status = {
  name: 'mittwald_login_status',
  description: 'Checks your current authentication status',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
} as const;