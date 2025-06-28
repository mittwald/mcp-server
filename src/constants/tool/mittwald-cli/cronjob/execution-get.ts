import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_cronjob_execution_get: Tool = {
  name: "mittwald_cronjob_execution_get",
  description: "Get a cron job execution. This command retrieves detailed information about a specific cronjob execution.",
  inputSchema: {
    type: "object",
    properties: {
      cronjobId: {
        type: "string",
        description: "ID of the cronjob the execution belongs to"
      },
      executionId: {
        type: "string",
        description: "ID of the cronjob execution to be retrieved"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output format",
        default: "txt"
      }
    },
    required: ["cronjobId", "executionId"]
  }
};