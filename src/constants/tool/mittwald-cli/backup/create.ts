import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_backup_create: Tool = {
  name: "mittwald_backup_create",
  description: "Create a new backup of a project",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      expires: {
        type: "string",
        description: "An interval after which the backup expires (examples: 30m, 30d, 1y)"
      },
      description: {
        type: "string",
        description: "A description for the backup"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      wait: {
        type: "boolean",
        description: "Wait for the resource to be ready"
      },
      waitTimeout: {
        type: "string",
        description: "The duration to wait for the resource to be ready (common units like 'ms', 's', 'm' are accepted)"
      }
    },
    required: ["expires"]
  }
};