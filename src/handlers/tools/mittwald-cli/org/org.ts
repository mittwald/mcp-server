import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

export interface MittwaldOrgArgs {
  command?: 'delete' | 'get' | 'invite' | 'list' | 'membership';
  help?: boolean;
}

export const handleOrg: MittwaldToolHandler<MittwaldOrgArgs> = async (args) => {
  try {
    if (args.help || !args.command) {
      const helpMessage = `
Organization Management Commands:

Available commands:
  delete      - Delete an organization
  get         - Get an organization profile
  invite      - Invite a user to an organization
  list        - Get all organizations the authenticated user has access to
  membership  - List all memberships belonging to an organization

Topics:
  org invite      - Invite a user to an organization
  org membership  - List all memberships belonging to an organization

Usage:
  Use the specific commands with the mittwald_org_ prefix:
  - mittwald_org_delete
  - mittwald_org_get
  - mittwald_org_invite
  - mittwald_org_list
  - mittwald_org_membership_list
  - mittwald_org_membership_revoke

Examples:
  - To list organizations: use mittwald_org_list
  - To get org details: use mittwald_org_get with orgId
  - To manage memberships: use mittwald_org_membership_list
      `;

      return formatToolResponse(
        "success",
        helpMessage.trim(),
        {
          availableCommands: ["delete", "get", "invite", "list", "membership"],
          topics: ["invite", "membership"],
          specificTools: [
            "mittwald_org_delete",
            "mittwald_org_get", 
            "mittwald_org_invite",
            "mittwald_org_list",
            "mittwald_org_membership_list",
            "mittwald_org_membership_revoke"
          ]
        }
      );
    }

    // Provide guidance on which specific tool to use
    switch (args.command) {
      case "delete":
        return formatToolResponse(
          "success",
          "To delete an organization, use the mittwald_org_delete tool",
          { recommendedTool: "mittwald_org_delete" }
        );
      case "get":
        return formatToolResponse(
          "success",
          "To get an organization profile, use the mittwald_org_get tool with an orgId parameter",
          { recommendedTool: "mittwald_org_get" }
        );
      case "invite":
        return formatToolResponse(
          "success",
          "To invite a user to an organization, use the mittwald_org_invite tool",
          { recommendedTool: "mittwald_org_invite" }
        );
      case "list":
        return formatToolResponse(
          "success",
          "To list organizations, use the mittwald_org_list tool",
          { recommendedTool: "mittwald_org_list" }
        );
      case "membership":
        return formatToolResponse(
          "success",
          "To manage organization memberships, use mittwald_org_membership_list and mittwald_org_membership_revoke tools",
          { 
            recommendedTools: [
              "mittwald_org_membership_list",
              "mittwald_org_membership_revoke"
            ]
          }
        );
      default:
        return formatToolResponse(
          "error",
          `Unknown command: ${args.command}. Available commands: delete, get, invite, list, membership`
        );
    }

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};