import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldUserArgs {
  help?: boolean;
}

export const handleUser: MittwaldToolHandler<MittwaldUserArgs> = async (args, { mittwaldClient }) => {
  try {
    const helpText = `User Account Management Commands:

Available Topics:
- user api-token   Create a new API token
- user session     Get a specific session  
- user ssh-key     Manage your SSH keys

Available Commands:
- user get         Get profile information for a user

Usage:
  Use the specific mittwald_user_* tools for individual operations:
  - mittwald_user_get
  - mittwald_user_api_token
  - mittwald_user_api_token_create
  - mittwald_user_api_token_get

Description:
  Manage your own user account, including profile information,
  API tokens, sessions, and SSH keys. Most operations default
  to the currently authenticated user.`;

    return formatToolResponse(
      "success",
      "User Account Management Help",
      {
        helpText: helpText,
        availableTopics: [
          "user api-token",
          "user session",
          "user ssh-key"
        ],
        availableCommands: [
          "user get"
        ]
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get user help: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};