import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_cronjob_execution_logs: Tool = {
  name: "mittwald_cronjob_execution_logs",
  description: "Get the log output of a cronjob execution. This command prints the log output of a cronjob execution, useful for debugging and monitoring cronjob behavior.",
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
      },
      noPager: {
        type: "boolean",
        description: "Disable pager for output"
      }
    },
    required: ["cronjobId", "executionId"]
  }
};