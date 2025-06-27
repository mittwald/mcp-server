import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// List all project invitations
export const mittwald_project_invite_list_all: Tool = {
  name: "mittwald_project_invite_list_all",
  description: "List all project invitations across all projects",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 50,
        description: "Maximum number of results to return",
      },
      skip: {
        type: "integer",
        minimum: 0,
        default: 0,
        description: "Number of results to skip for pagination",
      },
    },
  },
};

// List project invitations
export const mittwald_project_invite_list: Tool = {
  name: "mittwald_project_invite_list",
  description: "List all invitations for a specific project",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 50,
        description: "Maximum number of results to return",
      },
      skip: {
        type: "integer",
        minimum: 0,
        default: 0,
        description: "Number of results to skip for pagination",
      },
    },
  },
};

// Create project invitation
export const mittwald_project_invite_create: Tool = {
  name: "mittwald_project_invite_create",
  description: "Create a new invitation to join a project",
  inputSchema: {
    type: "object",
    required: ["projectId", "mailAddress", "role"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID",
      },
      mailAddress: {
        type: "string",
        description: "Email address of the person to invite",
      },
      role: {
        type: "string",
        enum: ["owner", "member"],
        description: "The role to assign to the invited member",
      },
      membershipExpiresAt: {
        type: "string",
        description: "ISO 8601 datetime when the membership should expire after acceptance",
      },
      message: {
        type: "string",
        description: "Custom message to include in the invitation email",
      },
      language: {
        type: "string",
        enum: ["de", "en"],
        default: "en",
        description: "Language for the invitation email",
      },
    },
  },
};

// Get invitation details
export const mittwald_project_invite_get: Tool = {
  name: "mittwald_project_invite_get",
  description: "Get details of a specific project invitation",
  inputSchema: {
    type: "object",
    required: ["inviteId"],
    properties: {
      inviteId: {
        type: "string",
        description: "The invitation ID",
      },
    },
  },
};

// Delete invitation
export const mittwald_project_invite_delete: Tool = {
  name: "mittwald_project_invite_delete",
  description: "Delete (cancel) a pending project invitation",
  inputSchema: {
    type: "object",
    required: ["inviteId"],
    properties: {
      inviteId: {
        type: "string",
        description: "The invitation ID to delete",
      },
    },
  },
};

// Accept invitation
export const mittwald_project_invite_accept: Tool = {
  name: "mittwald_project_invite_accept",
  description: "Accept a project invitation",
  inputSchema: {
    type: "object",
    required: ["inviteId"],
    properties: {
      inviteId: {
        type: "string",
        description: "The invitation ID to accept",
      },
    },
  },
};

// Decline invitation
export const mittwald_project_invite_decline: Tool = {
  name: "mittwald_project_invite_decline",
  description: "Decline a project invitation",
  inputSchema: {
    type: "object",
    required: ["inviteId"],
    properties: {
      inviteId: {
        type: "string",
        description: "The invitation ID to decline",
      },
    },
  },
};

// Resend invitation
export const mittwald_project_invite_resend: Tool = {
  name: "mittwald_project_invite_resend",
  description: "Resend an invitation email",
  inputSchema: {
    type: "object",
    required: ["inviteId"],
    properties: {
      inviteId: {
        type: "string",
        description: "The invitation ID to resend",
      },
    },
  },
};

// Get project token invite
export const mittwald_project_token_invite_get: Tool = {
  name: "mittwald_project_token_invite_get",
  description: "Get project invitation details using a token",
  inputSchema: {
    type: "object",
    required: ["token"],
    properties: {
      token: {
        type: "string",
        description: "The invitation token",
      },
    },
  },
};

// Export success messages
export const inviteListAllSuccessMessage = "Successfully retrieved all project invitations.";
export const inviteListSuccessMessage = "Successfully retrieved project invitations.";
export const inviteCreateSuccessMessage = "Project invitation has been created and sent.";
export const inviteGetSuccessMessage = "Successfully retrieved invitation details.";
export const inviteDeleteSuccessMessage = "Invitation has been cancelled.";
export const inviteAcceptSuccessMessage = "Invitation has been accepted successfully.";
export const inviteDeclineSuccessMessage = "Invitation has been declined.";
export const inviteResendSuccessMessage = "Invitation email has been resent.";
export const tokenInviteGetSuccessMessage = "Successfully retrieved invitation details from token.";