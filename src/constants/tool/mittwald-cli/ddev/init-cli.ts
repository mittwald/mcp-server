import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface DdevInitCliParameters {
  directory?: string;
  appId?: string;
  serverId?: string;
  projectId?: string;
  sshHost?: string;
  sshUser?: string;
  documentRoot?: string;
  ddevDirectory?: string;
  workingCopy?: boolean;
}

export const mittwald_ddev_init_cli: Tool = {
  name: 'mittwald_ddev_init',
  title: 'Initialize DDEV Project',
  description: 'Initialize DDEV project configuration.',
  inputSchema: {
    type: "object",
    properties: {
      directory: {
        type: "string",
        description: 'The directory to initialize DDEV in'
      },
      appId: {
        type: "string",
        description: 'The app ID to use for DDEV configuration'
      },
      serverId: {
        type: "string",
        description: 'The server ID to use for DDEV configuration'
      },
      projectId: {
        type: "string",
        description: 'The project ID to use for DDEV configuration'
      },
      sshHost: {
        type: "string",
        description: 'The SSH host to use for DDEV configuration'
      },
      sshUser: {
        type: "string",
        description: 'The SSH user to use for DDEV configuration'
      },
      documentRoot: {
        type: "string",
        description: 'The document root path for DDEV configuration'
      },
      ddevDirectory: {
        type: "string",
        description: 'The DDEV directory path for configuration'
      },
      workingCopy: {
        type: "boolean",
        description: 'Whether to create a working copy'
      }
    },
    required: []
  }
};