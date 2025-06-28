import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectMembershipArgs {
  command?: 'get' | 'get-own' | 'list' | 'list-own';
}

export const handleMittwaldProjectMembership: MittwaldToolHandler<MittwaldProjectMembershipArgs> = async (args, { mittwaldClient }) => {
  try {
    if (args.command) {
      // Show help for specific subcommand
      const commandHelp = {
        'get': 'Get a ProjectMembership by ID. Use mittwald_project_membership_get tool.',
        'get-own': 'Get the executing user\'s membership in a Project. Use mittwald_project_membership_get_own tool.',
        'list': 'List all memberships for a Project. Use mittwald_project_membership_list tool.',
        'list-own': 'List ProjectMemberships belonging to the executing user. Use mittwald_project_membership_list_own tool.'
      };

      return formatToolResponse({
        success: true,
        data: {
          command: args.command,
          description: commandHelp[args.command],
          usage: `Use the specific tool: mittwald_project_membership_${args.command.replace('-', '_')}`
        }
      });
    }

    // Show general help
    return formatToolResponse({
      success: true,
      data: {
        description: 'Control who gets to work on your projects, and who doesn\'t',
        availableCommands: [
          {
            command: 'get',
            description: 'Get a ProjectMembership by ID',
            tool: 'mittwald_project_membership_get'
          },
          {
            command: 'get-own',
            description: 'Get the executing user\'s membership in a Project',
            tool: 'mittwald_project_membership_get_own'
          },
          {
            command: 'list',
            description: 'List all memberships for a Project',
            tool: 'mittwald_project_membership_list'
          },
          {
            command: 'list-own',
            description: 'List ProjectMemberships belonging to the executing user',
            tool: 'mittwald_project_membership_list_own'
          }
        ],
        usage: 'Use the specific membership tools listed above for actual operations'
      }
    });

  } catch (error) {
    return formatToolResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};