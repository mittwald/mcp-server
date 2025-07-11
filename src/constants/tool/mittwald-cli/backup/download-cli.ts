import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleBackupDownloadCli } from '../../../../handlers/tools/mittwald-cli/backup/download-cli.js';

const tool: Tool = {
  name: 'mittwald_backup_download',
  description: 'Download a backup using CLI',
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
        description: 'Archive format (tar, zip)'
      },
      output: {
        type: 'string',
        description: 'Output file path'
      },
      password: {
        type: 'string',
        description: 'Password for encrypted archive'
      },
      generatePassword: {
        type: 'boolean',
        description: 'Generate a random password for encryption'
      },
      promptPassword: {
        type: 'boolean',
        description: 'Prompt for password'
      },
      resume: {
        type: 'boolean',
        description: 'Resume a previously interrupted download'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
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