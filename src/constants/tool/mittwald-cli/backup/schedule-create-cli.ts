import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleBackupScheduleCreateCli } from '../../../../handlers/tools/mittwald-cli/backup/schedule-create-cli.js';

const tool: Tool = {
  name: 'mittwald_backup_schedule_create',
  title: 'Create Backup Schedule',
  description: 'Create a backup schedule.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this argument is optional if a default project is set in the context'
      },
      schedule: {
        type: 'string',
        description: 'Cron expression for the backup schedule'
      },
      ttl: {
        type: 'string',
        description: 'Time-to-live for backups (7d - 400d)'
      },
      description: {
        type: 'string',
        description: 'Description for the backup schedule'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      }
    },
    required: ['schedule', 'ttl']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleBackupScheduleCreateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_backup_schedule_create_cli = tool;