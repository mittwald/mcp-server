import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppUpgradeCli } from '../../../../handlers/tools/mittwald-cli/app/upgrade-cli.js';

const tool: Tool = {
  name: 'mittwald_app_upgrade',
  title: 'Upgrade App Version',
  description: 'Upgrade app installation to target version.',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      },
      targetVersion: {
        type: 'string',
        description: 'Target version to upgrade app to; if omitted, target version will be prompted interactively'
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this flag is optional if a default project is set in the context'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      wait: {
        type: 'boolean',
        description: 'Wait for the resource to be ready'
      },
      waitTimeout: {
        type: 'string',
        description: 'The duration to wait for the resource to be ready (common units like ms, s, m are accepted)',
        default: '600s'
      }
    }
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppUpgradeCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_upgrade_cli = tool;