import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

export interface MittwaldOrgInviteRevokeArgs {
  inviteId: string;
}

export const handleOrgInviteRevokeCli: MittwaldToolHandler<MittwaldOrgInviteRevokeArgs> = async (args, context) => {
  try {
    if (!args.inviteId) {
      return formatToolResponse(
        "error",
        "Invite ID is required for revoking an organization invitation."
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['org', 'invite', 'revoke', args.inviteId];
    
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Organization invite not found: ${args.inviteId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to revoke organization invite: ${errorMessage}`
      );
    }
    
    // Return success with output
    return formatToolResponse(
      "success",
      `Organization invite ${args.inviteId} has been revoked successfully`,
      {
        inviteId: args.inviteId,
        revoked: true,
        output: result.stdout
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
