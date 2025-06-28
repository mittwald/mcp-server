import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldLoginResetArgs {
  // No arguments needed for login reset
}

export const handleLoginReset: MittwaldToolHandler<MittwaldLoginResetArgs> = async (args, context) => {
  try {
    // The login reset command in the CLI deletes the local token file
    // In the MCP context, we don't have access to the file system in the same way
    // Instead, we'll provide guidance on how to reset authentication
    
    const resetInstructions = {
      message: "Authentication reset information",
      steps: [
        "To reset your Mittwald authentication, you need to:",
        "1. Revoke your current API token in the mStudio web interface",
        "2. Or use the 'mittwald_user_api_token_revoke' command to revoke specific tokens",
        "3. Generate a new API token if needed",
        "4. Update your MCP server configuration with the new token"
      ],
      note: "The MCP server uses the API token passed in its configuration. Unlike the CLI, it doesn't store tokens in local files.",
      webInterface: "https://studio.mittwald.de/app/account/api-tokens",
    };

    return formatToolResponse(
      "success",
      "Authentication reset instructions provided",
      resetInstructions
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to provide reset information: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};