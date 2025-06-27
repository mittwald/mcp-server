/**
 * @file Mittwald Cronjob MCP tool definitions
 * @module constants/tool/mittwald/cronjob
 * 
 * @remarks
 * This module defines all MCP tools for Mittwald cronjob operations.
 * Based on 10 cronjob API endpoints from the Mittwald API.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool to list cronjobs belonging to a project
 */
export const mittwaldCronjobList: Tool = {
  name: "mittwald_cronjob_list",
  description: "List cronjobs belonging to a Mittwald project. Retrieves all cronjobs configured for the specified project including their schedules, commands, and status.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project to list cronjobs for"
      }
    },
    required: ["projectId"]
  },
  _meta: {
    title: "List Project Cronjobs",
    type: "server"
  }
};

/**
 * Tool to create a new cronjob
 */
export const mittwaldCronjobCreate: Tool = {
  name: "mittwald_cronjob_create",
  description: "Create a new cronjob in a Mittwald project. Configure scheduled tasks with cron expressions, commands, and execution settings.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project to create the cronjob in"
      },
      schedule: {
        type: "string",
        description: "Cron expression defining when the job should run (e.g., '0 0 * * *' for daily at midnight)"
      },
      command: {
        type: "string",
        description: "The command to execute"
      },
      description: {
        type: "string",
        description: "Optional description of what the cronjob does"
      },
      appId: {
        type: "string",
        description: "Optional app ID to associate with the cronjob"
      }
    },
    required: ["projectId", "schedule", "command"]
  },
  _meta: {
    title: "Create Cronjob",
    type: "server"
  }
};

/**
 * Tool to get details of a specific cronjob
 */
export const mittwaldCronjobGet: Tool = {
  name: "mittwald_cronjob_get",
  description: "Get detailed information about a specific cronjob including its configuration, schedule, last execution status, and metadata.",
  inputSchema: {
    type: "object",
    properties: {
      cronjobId: {
        type: "string",
        description: "The unique identifier of the cronjob to retrieve"
      }
    },
    required: ["cronjobId"]
  },
  _meta: {
    title: "Get Cronjob Details",
    type: "server"
  }
};

/**
 * Tool to update an existing cronjob
 */
export const mittwaldCronjobUpdate: Tool = {
  name: "mittwald_cronjob_update",
  description: "Update an existing cronjob's configuration including schedule, command, description, or enabled/disabled state.",
  inputSchema: {
    type: "object",
    properties: {
      cronjobId: {
        type: "string",
        description: "The unique identifier of the cronjob to update"
      },
      schedule: {
        type: "string",
        description: "Cron expression defining when the job should run"
      },
      command: {
        type: "string",
        description: "The command to execute"
      },
      description: {
        type: "string",
        description: "Description of what the cronjob does"
      },
      enabled: {
        type: "boolean",
        description: "Whether the cronjob is enabled or disabled"
      }
    },
    required: ["cronjobId"]
  },
  _meta: {
    title: "Update Cronjob",
    type: "server"
  }
};

/**
 * Tool to delete a cronjob
 */
export const mittwaldCronjobDelete: Tool = {
  name: "mittwald_cronjob_delete",
  description: "Delete a cronjob permanently. This action cannot be undone and will remove all execution history.",
  inputSchema: {
    type: "object",
    properties: {
      cronjobId: {
        type: "string",
        description: "The unique identifier of the cronjob to delete"
      }
    },
    required: ["cronjobId"]
  },
  _meta: {
    title: "Delete Cronjob",
    type: "server"
  }
};

/**
 * Tool to update a cronjob's app ID
 */
export const mittwaldCronjobUpdateAppId: Tool = {
  name: "mittwald_cronjob_update_app_id",
  description: "Update the app ID association for a cronjob. This links the cronjob to a specific application installation.",
  inputSchema: {
    type: "object",
    properties: {
      cronjobId: {
        type: "string",
        description: "The unique identifier of the cronjob to update"
      },
      appId: {
        type: "string",
        description: "The app ID to associate with the cronjob"
      }
    },
    required: ["cronjobId", "appId"]
  },
  _meta: {
    title: "Update Cronjob App ID",
    type: "server"
  }
};

/**
 * Tool to manually trigger a cronjob execution
 */
export const mittwaldCronjobTrigger: Tool = {
  name: "mittwald_cronjob_trigger",
  description: "Manually trigger a cronjob execution outside of its normal schedule. Useful for testing or immediate execution needs.",
  inputSchema: {
    type: "object",
    properties: {
      cronjobId: {
        type: "string",
        description: "The unique identifier of the cronjob to trigger"
      }
    },
    required: ["cronjobId"]
  },
  _meta: {
    title: "Trigger Cronjob Execution",
    type: "server"
  }
};

/**
 * Tool to list executions of a cronjob
 */
export const mittwaldCronjobListExecutions: Tool = {
  name: "mittwald_cronjob_list_executions",
  description: "List execution history of a cronjob including status, start/end times, output, and error information for each execution.",
  inputSchema: {
    type: "object",
    properties: {
      cronjobId: {
        type: "string",
        description: "The unique identifier of the cronjob to list executions for"
      }
    },
    required: ["cronjobId"]
  },
  _meta: {
    title: "List Cronjob Executions",
    type: "server"
  }
};

/**
 * Tool to get details of a specific cronjob execution
 */
export const mittwaldCronjobGetExecution: Tool = {
  name: "mittwald_cronjob_get_execution",
  description: "Get detailed information about a specific cronjob execution including output, error logs, duration, and exit status.",
  inputSchema: {
    type: "object",
    properties: {
      cronjobId: {
        type: "string",
        description: "The unique identifier of the cronjob"
      },
      executionId: {
        type: "string",
        description: "The unique identifier of the execution to retrieve"
      }
    },
    required: ["cronjobId", "executionId"]
  },
  _meta: {
    title: "Get Cronjob Execution Details",
    type: "server"
  }
};

/**
 * Tool to abort a running cronjob execution
 */
export const mittwaldCronjobAbortExecution: Tool = {
  name: "mittwald_cronjob_abort_execution",
  description: "Abort a currently running cronjob execution. This will forcefully stop the execution and mark it as aborted.",
  inputSchema: {
    type: "object",
    properties: {
      cronjobId: {
        type: "string",
        description: "The unique identifier of the cronjob"
      },
      executionId: {
        type: "string",
        description: "The unique identifier of the execution to abort"
      }
    },
    required: ["cronjobId", "executionId"]
  },
  _meta: {
    title: "Abort Cronjob Execution",
    type: "server"
  }
};

export const MITTWALD_CRONJOB_TOOLS: Tool[] = [
  mittwaldCronjobList,
  mittwaldCronjobCreate,
  mittwaldCronjobGet,
  mittwaldCronjobUpdate,
  mittwaldCronjobDelete,
  mittwaldCronjobUpdateAppId,
  mittwaldCronjobTrigger,
  mittwaldCronjobListExecutions,
  mittwaldCronjobGetExecution,
  mittwaldCronjobAbortExecution
];