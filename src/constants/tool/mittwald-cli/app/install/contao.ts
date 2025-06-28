import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_install_contao: Tool = {
  name: 'mittwald_app_install_contao',
  description: 'Creates new Contao installation',
  inputSchema: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'ID or short ID of a project; this flag is optional if a default project is set in the context',
      },
      version: {
        type: 'string',
        description: 'Version of Contao to be installed',
        default: 'latest',
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
        default: false,
      },
      host: {
        type: 'string',
        description: 'Host to initially configure your Contao installation with; needs to be created separately',
      },
      admin_firstname: {
        type: 'string',
        description: 'First name of your administrator user',
      },
      admin_user: {
        type: 'string',
        description: 'Username for your administrator user',
      },
      admin_email: {
        type: 'string',
        description: 'Email address of your administrator user',
      },
      admin_pass: {
        type: 'string',
        description: 'Password of your administrator user',
      },
      admin_lastname: {
        type: 'string',
        description: 'Last name of your administrator user',
      },
      site_title: {
        type: 'string',
        description: 'Site title for your Contao installation',
      },
      wait: {
        type: 'boolean',
        description: 'Wait for the resource to be ready',
        default: false,
      },
      wait_timeout: {
        type: 'string',
        description: 'The duration to wait for the resource to be ready (common units like "ms", "s", "m" are accepted)',
        default: '600s',
      },
    },
    required: ['version'],
  },
};