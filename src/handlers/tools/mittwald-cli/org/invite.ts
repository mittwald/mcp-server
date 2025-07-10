import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

export interface MittwaldOrgInviteArgs {
  orgId?: string;
  email: string;
  role?: 'owner' | 'member' | 'accountant';
  message?: string;
  expires?: string;
  quiet?: boolean;
}

export const handleOrgInviteCli: MittwaldToolHandler<MittwaldOrgInviteArgs> = async (args, { orgContext }) => {
  try {
    // Get org ID from args or context
    const orgId = args.orgId || (orgContext as any)?.orgId;
    
    if (!orgId) {
      return formatToolResponse(
        "error",
        "Organization ID is required. Either provide it as a parameter or set a default org in the context."
      );
    }

    if (!args.email) {
      return formatToolResponse(
        "error",
        "Email address is required for organization invitation."
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['org', 'invite'];
    
    // Add org ID
    cliArgs.push('--org-id', orgId);
    
    // Add email (required)
    cliArgs.push('--email', args.email);
    
    // Add role
    if (args.role) {
      cliArgs.push('--role', args.role);
    }
    
    // Add message
    if (args.message) {
      cliArgs.push('--message', args.message);
    }
    
    // Add expires
    if (args.expires) {
      cliArgs.push('--expires', args.expires);
    }
    
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
      
      if (errorMessage.includes('already exists') || errorMessage.includes('already invited')) {
        return formatToolResponse(
          "error",
          `User ${args.email} has already been invited to organization ${orgId}. Error: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Organization not found: ${orgId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to invite user: ${errorMessage}`
      );
    }
    
    // Handle quiet output
    if (args.quiet) {
      const quietResult = parseQuietOutput(result.stdout);
      return formatToolResponse(
        "success",
        `Invitation sent to ${args.email}`,
        { 
          invitationId: quietResult,
          email: args.email,
          role: args.role || 'member',
          orgId 
        }
      );
    }
    
    // Regular output
    return formatToolResponse(
      "success",
      `Invitation sent to ${args.email} for organization ${orgId} with role ${args.role || 'member'}`,
      {
        email: args.email,
        role: args.role || 'member',
        orgId,
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