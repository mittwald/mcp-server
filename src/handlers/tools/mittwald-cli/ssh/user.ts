import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldSshUserArgs {
  help?: boolean;
}

export const handleSshUser: MittwaldToolHandler<MittwaldSshUserArgs> = async (args, { mittwaldClient }) => {
  try {
    const helpText = `SSH User Management Commands:

Available Commands:
- ssh-user create   Create a new SSH user
- ssh-user delete   Delete an SSH user  
- ssh-user list     List all SSH users for a project
- ssh-user update   Update an existing SSH user

Usage:
  Use the specific mittwald_ssh_user_* tools for individual operations:
  - mittwald_ssh_user_create
  - mittwald_ssh_user_delete
  - mittwald_ssh_user_list
  - mittwald_ssh_user_update

Description:
  SSH users provide secure shell access to your project environments.
  Each project can have multiple SSH users with different permissions
  and authentication methods (password or public key).`;

    return formatToolResponse(
      "success",
      "SSH User Management Help",
      {
        helpText: helpText,
        availableCommands: [
          "ssh-user create",
          "ssh-user delete", 
          "ssh-user list",
          "ssh-user update"
        ]
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get SSH user help: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};