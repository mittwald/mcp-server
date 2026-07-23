import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleBackupDownloadCli } from '../../../../handlers/tools/mittwald-cli/backup/download-cli.js';

const tool: Tool = {
  name: 'mittwald_backup_download',
  title: 'Get Backup Download URL',
  annotations: {
    title: 'Get Backup Download URL',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: false,
  },
  description:
    'Get the download URL for a backup, requesting an export first if none exists yet. ' +
    'This tool does not download anything itself - fetch the returned URL locally. ' +
    'Exports are prepared asynchronously; if no URL is returned yet, call this tool again in a few seconds.',
  inputSchema: {
    type: 'object',
    properties: {
      backupId: {
        type: 'string',
        description: 'ID or short ID of a backup'
      },
      format: {
        type: 'string',
        enum: ['tar', 'zip'],
        description: 'Archive format to export the backup in (default: tar)'
      },
      password: {
        type: 'string',
        description: 'Password to protect the archive with (only applied when a new export is created)'
      },
      recreate: {
        type: 'boolean',
        description: 'Request a fresh export even if a usable one already exists'
      }
    },
    required: ['backupId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleBackupDownloadCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_backup_download_cli = tool;
