/**
 * @file mittwald_login_token tool definition
 * @module constants/tool/mittwald-cli/login
 */

export const mittwald_login_token = {
  name: 'mittwald_login_token',
  description: 'Authenticate using an API token',
  inputSchema: {
    type: 'object',
    properties: {
      overwrite: {
        type: 'boolean',
        description: 'Overwrite existing token file',
        default: false,
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
        default: false,
      },
    },
    required: [],
  },
} as const;