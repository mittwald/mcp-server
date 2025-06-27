import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// List all project memberships
export const mittwald_project_membership_list_all: Tool = {
  name: "mittwald_project_membership_list_all",
  description: "List all project memberships across all projects",
  inputSchema: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        description: "Filter memberships by user ID",
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

// List project memberships
export const mittwald_project_membership_list: Tool = {
  name: "mittwald_project_membership_list",
  description: "List all memberships for a specific project",
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

// Get own membership
export const mittwald_project_membership_get_self: Tool = {
  name: "mittwald_project_membership_get_self",
  description: "Get your own membership details for a specific project",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID",
      },
    },
  },
};

// Get membership details
export const mittwald_project_membership_get: Tool = {
  name: "mittwald_project_membership_get",
  description: "Get details of a specific project membership",
  inputSchema: {
    type: "object",
    required: ["membershipId"],
    properties: {
      membershipId: {
        type: "string",
        description: "The membership ID",
      },
    },
  },
};

// Update membership
export const mittwald_project_membership_update: Tool = {
  name: "mittwald_project_membership_update",
  description: "Update a project membership (change role or expiration)",
  inputSchema: {
    type: "object",
    required: ["membershipId"],
    properties: {
      membershipId: {
        type: "string",
        description: "The membership ID",
      },
      role: {
        type: "string",
        enum: ["owner", "member"],
        description: "The new role for the membership",
      },
      expiresAt: {
        type: "string",
        description: "ISO 8601 datetime when the membership should expire",
      },
    },
  },
};

// Remove membership
export const mittwald_project_membership_remove: Tool = {
  name: "mittwald_project_membership_remove",
  description: "Remove a member from a project",
  inputSchema: {
    type: "object",
    required: ["membershipId"],
    properties: {
      membershipId: {
        type: "string",
        description: "The membership ID to remove",
      },
    },
  },
};

// Leave project
export const mittwald_project_leave: Tool = {
  name: "mittwald_project_leave",
  description: "Leave a project (remove your own membership)",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to leave",
      },
    },
  },
};

// Export success messages
export const membershipListAllSuccessMessage = "Successfully retrieved all project memberships.";
export const membershipListSuccessMessage = "Successfully retrieved project memberships.";
export const membershipGetSelfSuccessMessage = "Successfully retrieved your membership details.";
export const membershipGetSuccessMessage = "Successfully retrieved membership details.";
export const membershipUpdateSuccessMessage = "Membership has been updated successfully.";
export const membershipRemoveSuccessMessage = "Member has been removed from the project.";
export const projectLeaveSuccessMessage = "You have successfully left the project.";