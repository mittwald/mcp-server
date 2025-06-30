import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_install: Tool = {
  name: 'mittwald_app_install',
  description: 'Install apps in your projects',
  inputSchema: {
    type: 'object',
    properties: {
      app_type: {
        type: 'string',
        enum: ['contao', 'joomla', 'matomo', 'nextcloud', 'shopware5', 'shopware6', 'typo3', 'wordpress'],
        description: 'Type of application to install',
      },
      project_id: {
        type: 'string',
        description: 'ID or short ID of a project; this flag is optional if a default project is set in the context',
      },
      version: {
        type: 'string',
        description: 'REQUIRED: Exact version number to install. You MUST first call mittwald_app_versions to get valid versions. Do NOT use "latest" - choose the recommended version or most recent stable version from the list.',
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
        default: false,
      },
      host: {
        type: 'string',
        description: 'Host to initially configure your installation with; needs to be created separately',
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
      site_title: {
        type: 'string',
        description: 'Site title for your installation',
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
    required: ['app_type', 'version'],
  },
};