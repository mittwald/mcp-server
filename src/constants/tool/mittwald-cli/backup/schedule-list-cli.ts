import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleBackupScheduleListCli } from '../../../../handlers/tools/mittwald-cli/backup/schedule-list-cli.js';

const tool: Tool = {
  name: 'mittwald_backup_schedule_list',
  title: 'List Backup Schedules',
  annotations: {
    title: 'List Backup Schedules',
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: 'List backup schedules.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project'
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleBackupScheduleListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_backup_schedule_list_cli = tool;