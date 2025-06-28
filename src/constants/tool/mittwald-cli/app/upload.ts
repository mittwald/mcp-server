import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_upload: Tool = {
  name: "mittwald_app_upload",
  description: "Upload the filesystem of an app from your local machine to a project using rsync over SSH.",
  inputSchema: {
    type: "object",
    properties: {
      installationId: {
        type: "string",
        description: "ID or short ID of an app installation"
      },
      source: {
        type: "string",
        description: "Source directory to upload from"
      },
      exclude: {
        type: "array",
        items: {
          type: "string"
        },
        description: "A list of files and directories to exclude from the upload"
      },
      dryRun: {
        type: "boolean",
        description: "Preview the upload without actually uploading the files"
      },
      delete: {
        type: "boolean",
        description: "Delete files on the server that are not present locally"
      },
      remoteSubDirectory: {
        type: "string",
        description: "Remote subdirectory to upload to"
      },
      sshUser: {
        type: "string",
        description: "SSH user"
      },
      sshIdentityFile: {
        type: "string",
        description: "SSH private key file"
      }
    },
    required: ["installationId", "source"]
  }
};