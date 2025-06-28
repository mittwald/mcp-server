import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldUserApiTokenArgs {
  help?: boolean;
}

export const handleUserApiToken: MittwaldToolHandler<MittwaldUserApiTokenArgs> = async (args, { mittwaldClient }) => {
  try {
    const helpText = `API Token Management Commands:

Available Commands:
- user api-token create   Create a new API token
- user api-token get      Get a specific API token  
- user api-token list     List all API tokens of the user
- user api-token revoke   Revoke an API token

Usage:
  Use the specific mittwald_user_api_token_* tools for individual operations:
  - mittwald_user_api_token_create
  - mittwald_user_api_token_get
  - mittwald_user_api_token_list
  - mittwald_user_api_token_revoke

Description:
  API tokens provide programmatic access to the Mittwald API.
  They can be created with different roles (api_read, api_write)
  and can be set to expire after a specified time period.`;

    return formatToolResponse(
      "success",
      "API Token Management Help",
      {
        helpText: helpText,
        availableCommands: [
          "user api-token create",
          "user api-token get", 
          "user api-token list",
          "user api-token revoke"
        ]
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get API token help: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};