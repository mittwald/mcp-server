import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppUploadCli } from '../../../../handlers/tools/mittwald-cli/app/upload-cli.js';

const tool: Tool = {
  name: 'mittwald_app_upload',
  title: 'Upload App Files',
  description: 'Upload the filesystem of an app to a project.',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      },
      source: {
        type: 'string',
        description: 'Source directory from which to upload the app installation'
      },
      sshUser: {
        type: 'string',
        description: 'Override the SSH user to connect with; if omitted, your own user will be used'
      },
      sshIdentityFile: {
        type: 'string',
        description: 'The SSH identity file (private key) to use for public key authentication'
      },
      exclude: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Exclude files matching the given patterns'
      },
      dryRun: {
        type: 'boolean',
        description: 'Do not actually upload the app installation'
      },
      delete: {
        type: 'boolean',
        description: 'Delete remote files that are not present locally'
      },
      remoteSubDirectory: {
        type: 'string',
        description: 'Specify a sub-directory within the app installation to upload'
      }
    },
    required: ['source', 'installationId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppUploadCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_upload_cli = tool;