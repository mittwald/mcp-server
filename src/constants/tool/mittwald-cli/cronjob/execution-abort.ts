import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_cronjob_execution_abort: Tool = {
  name: "mittwald_cronjob_execution_abort",
  description: "Abort a running cron job execution. This command will stop a currently running cronjob execution.",
  inputSchema: {
    type: "object",
    properties: {
      cronjobId: {
        type: "string",
        description: "ID of the cronjob the execution belongs to"
      },
      executionId: {
        type: "string",
        description: "ID of the cron job execution to abort"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary."
      }
    },
    required: ["cronjobId", "executionId"]
  }
};