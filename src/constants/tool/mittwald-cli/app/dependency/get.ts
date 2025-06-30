import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Get installed system software for an app installation
 */
export const mittwald_app_dependency_get: Tool = {
  name: 'mittwald_app_dependency_get',
  description: `Get the installed system software packages for a specific app installation.

This shows:
- Currently installed system software (Composer, ImageMagick, etc.)
- Current vs desired versions
- Update policies for each software
- Update availability status

Examples:
- View all: mittwald_app_dependency_get --installationId=<app-id>
- JSON output: mittwald_app_dependency_get --installationId=<app-id> --output=json`,
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID of the app installation'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (default: txt)'
      }
    },
    required: ['installationId']
  }
};