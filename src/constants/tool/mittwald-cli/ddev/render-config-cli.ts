import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface DdevRenderConfigCliParameters {
  appInstallationId: string;
  force?: boolean;
}

export const mittwald_ddev_render_config_cli: Tool = {
  name: 'mittwald_ddev_render_config_cli',
  description: 'Render DDEV configuration for an app installation using CLI wrapper',
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: 'The app installation ID to render configuration for'
      },
      force: {
        type: "boolean",
        description: 'Force overwrite existing configuration'
      }
    },
    required: ["appInstallationId"]
  }
};