import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleAppCreatePythonCli } from '../../../../../handlers/tools/mittwald-cli/app/create/python-cli.js';

const tool: Tool = {
  name: 'mittwald_app_create_python',
  title: 'Create Python App',
  description: 'Create a Python app.',
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
        description: 'Entrypoint file for the Python application'
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
  handler: handleAppCreatePythonCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_create_python_cli = tool;