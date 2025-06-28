import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

export interface MittwaldOrgMembershipArgs {
  command?: 'list' | 'list-own' | 'revoke';
  help?: boolean;
}

export const handleOrgMembership: MittwaldToolHandler<MittwaldOrgMembershipArgs> = async (args) => {
  try {
    if (args.help || !args.command) {
      const helpMessage = `
Organization Membership Commands:

Available commands:
  list      - List all memberships belonging to an organization
  list-own  - List all organization memberships for the executing user  
  revoke    - Revoke a user's membership to an organization

Usage:
  Use the specific commands:
  - mittwald_org_membership_list
  - mittwald_org_membership_revoke

Examples:
  - To list memberships: use mittwald_org_membership_list
  - To revoke a membership: use mittwald_org_membership_revoke with membershipId
      `;

      return formatToolResponse(
        "success",
        helpMessage.trim(),
        {
          availableCommands: ["list", "list-own", "revoke"],
          specificTools: [
            "mittwald_org_membership_list",
            "mittwald_org_membership_revoke"
          ]
        }
      );
    }

    // Provide guidance on which specific tool to use
    switch (args.command) {
      case "list":
        return formatToolResponse(
          "success",
          "To list organization memberships, use the mittwald_org_membership_list tool",
          { recommendedTool: "mittwald_org_membership_list" }
        );
      case "list-own":
        return formatToolResponse(
          "success", 
          "List-own functionality can be implemented by using mittwald_org_membership_list without an orgId parameter to list current user's memberships",
          { recommendedTool: "mittwald_org_membership_list" }
        );
      case "revoke":
        return formatToolResponse(
          "success",
          "To revoke an organization membership, use the mittwald_org_membership_revoke tool with a membershipId parameter",
          { recommendedTool: "mittwald_org_membership_revoke" }
        );
      default:
        return formatToolResponse(
          "error",
          `Unknown command: ${args.command}. Available commands: list, list-own, revoke`
        );
    }

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};