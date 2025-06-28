import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_cronjob_execute: Tool = {
  name: "mittwald_cronjob_execute",
  description: "Manually run a cron job immediately, bypassing its scheduled interval. This will trigger the cron job to execute once and return information about the execution.",
  inputSchema: {
    type: "object",
    properties: {
      cronjobId: {
        type: "string",
        description: "ID of the cronjob to be executed."
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary."
      }
    },
    required: ["cronjobId"]
  }
};