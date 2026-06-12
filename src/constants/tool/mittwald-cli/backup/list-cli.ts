import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleBackupListCli } from '../../../../handlers/tools/mittwald-cli/backup/list-cli.js';

const tool: Tool = {
  name: 'mittwald_backup_list',
  title: 'List Backups',
  description: 'List backups',
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
  handler: handleBackupListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_backup_list_cli = tool;