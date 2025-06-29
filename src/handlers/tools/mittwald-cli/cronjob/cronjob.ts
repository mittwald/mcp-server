import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldCronjobArgs {
  help?: boolean;
}

export const handleMittwaldCronjob: MittwaldToolHandler<MittwaldCronjobArgs> = async (args, { mittwaldClient }) => {
  try {
    const helpInfo = {
      command: "mw cronjob",
      description: "Manage cronjobs in your projects",
      availableCommands: [
        {
          command: "mittwald_cronjob_create",
          description: "Create a new cronjob"
        },
        {
          command: "mittwald_cronjob_delete", 
          description: "Delete a cronjob"
        },
        {
          command: "mittwald_cronjob_execute",
          description: "Execute a cronjob manually"
        },
        {
          command: "mittwald_cronjob_get",
          description: "Get details of a specific cronjob"
        },
        {
          command: "mittwald_cronjob_list",
          description: "List all cronjobs in a project"
        },
        {
          command: "mittwald_cronjob_update",
          description: "Update an existing cronjob"
        }
      ],
      subcommands: [
        {
          command: "mittwald_cronjob_execution",
          description: "Manage cronjob executions (abort, get, list, logs)"
        }
      ]
    };

    return formatToolResponse('success', 'Cronjob management commands', helpInfo);
  } catch (error) {
    return formatToolResponse('error', `Error managing cronjobs: ${error instanceof Error ? error.message : String(error)}`);
  }
};