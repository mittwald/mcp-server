import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

export interface MittwaldOrgMembershipRevokeArgs {
  membershipId: string;
  quiet?: boolean;
}

export const handleOrgMembershipRevokeCli: MittwaldToolHandler<MittwaldOrgMembershipRevokeArgs> = async (args, context) => {
  try {
    if (!args.membershipId) {
      return formatToolResponse(
        "error",
        "Membership ID is required for revoking organization membership."
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['org', 'membership', 'revoke', args.membershipId];
    
    // Add quiet flag
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Organization membership not found: ${args.membershipId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to revoke organization membership: ${errorMessage}`
      );
    }
    
    // Handle quiet output
    if (args.quiet) {
      const quietResult = parseQuietOutput(result.stdout);
      return formatToolResponse(
        "success",
        `Organization membership ${args.membershipId} revoked successfully`,
        { 
          membershipId: args.membershipId,
          revoked: true,
          result: quietResult
        }
      );
    }
    
    // Regular output
    return formatToolResponse(
      "success",
      `Organization membership ${args.membershipId} has been revoked successfully`,
      {
        membershipId: args.membershipId,
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

// Export with old name for backward compatibility
export const handleOrgMembershipRevoke = handleOrgMembershipRevokeCli;