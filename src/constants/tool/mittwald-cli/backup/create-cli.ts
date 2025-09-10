import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleBackupCreateCli } from '../../../../handlers/tools/mittwald-cli/backup/create-cli.js';

const tool: Tool = {
  name: 'mittwald_backup_create',
  title: 'Create Backup',
  description: 'Create a new backup',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this argument is optional if a default project is set in the context'
      },
      expires: {
        type: 'string',
        description: 'Set an expiration date for the backup (format: 30d, 1y, 30m etc.)'
      },
      description: {
        type: 'string',
        description: 'Set a description for the backup'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      wait: {
        type: 'boolean',
        description: 'Wait for the backup to be completed'
      },
      waitTimeout: {
        type: 'string',
        description: 'Timeout for the wait operation (default: 15m)'
      }
    },
    required: ["expires", "projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleBackupCreateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_backup_create_cli = tool;