import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleAppCreatePhpWorkerCli } from '../../../../../handlers/tools/mittwald-cli/app/create/php-worker-cli.js';

const tool: Tool = {
  name: 'mittwald_app_create_php_worker',
  title: 'Create PHP Worker App',
  description: 'Create a PHP worker app.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this argument is optional if a default project is set in the context'
      },
      siteTitle: {
        type: 'string',
        description: 'Title for the new app'
      },
      entrypoint: {
        type: 'string',
        description: 'Entrypoint file for the PHP worker application'
      },
      wait: {
        type: 'boolean',
        description: 'Wait for the app to be ready'
      },
      waitTimeout: {
        type: 'number',
        description: 'Timeout for the wait operation in seconds'
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppCreatePhpWorkerCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_create_php_worker_cli = tool;