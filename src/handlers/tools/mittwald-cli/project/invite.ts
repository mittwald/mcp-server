import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectInviteArgs {
  command?: 'get' | 'list' | 'list-own';
}

export const handleMittwaldProjectInvite: MittwaldToolHandler<MittwaldProjectInviteArgs> = async (args, { mittwaldClient }) => {
  try {
    if (args.command) {
      // Show help for specific subcommand
      const commandHelp = {
        'get': 'Get a ProjectInvite by ID. Use mittwald_project_invite_get tool.',
        'list': 'List all invites belonging to a project. Use mittwald_project_invite_list tool.',
        'list-own': 'List all project invites for the executing user. Use mittwald_project_invite_list_own tool.'
      };

      return formatToolResponse(
        'success',
        commandHelp[args.command],
        {
          command: args.command,
          usage: `Use the specific tool: mittwald_project_invite_${args.command.replace('-', '_')}`
        }
      );
    }

    // Show general help
    return formatToolResponse(
      'success',
      'Invite users to your projects and manage their invitations',
      {
        availableCommands: [
          {
            command: 'get',
            description: 'Get a ProjectInvite by ID',
            tool: 'mittwald_project_invite_get'
          },
          {
            command: 'list',
            description: 'List all invites belonging to a project',
            tool: 'mittwald_project_invite_list'
          },
          {
            command: 'list-own',
            description: 'List all project invites for the executing user',
            tool: 'mittwald_project_invite_list_own'
          }
        ],
        usage: 'Use the specific invite tools listed above for actual operations'
      }
    );

  } catch (error) {
    return formatToolResponse(
      'error',
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}