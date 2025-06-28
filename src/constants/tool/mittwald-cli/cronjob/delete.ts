import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_cronjob_delete: Tool = {
  name: "mittwald_cronjob_delete",
  description: "Delete a cron job from the system. This action is irreversible - once deleted, the cron job cannot be recovered.",
  inputSchema: {
    type: "object",
    properties: {
      cronjobId: {
        type: "string",
        description: "ID of the cronjob to be deleted."
      },
      force: {
        type: "boolean",
        description: "Do not ask for confirmation. Required in MCP context since interactive prompts are not supported."
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary."
      }
    },
    required: ["cronjobId", "force"]
  }
};