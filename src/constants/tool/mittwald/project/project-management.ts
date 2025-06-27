import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// List projects
export const mittwald_project_list: Tool = {
  name: "mittwald_project_list",
  description: "List all projects, optionally filtered by customer or server",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "Filter projects by customer ID",
      },
      serverId: {
        type: "string",
        description: "Filter projects by server ID",
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

// Get project details
export const mittwald_project_get: Tool = {
  name: "mittwald_project_get",
  description: "Get detailed information about a specific project",
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

// Delete project
export const mittwald_project_delete: Tool = {
  name: "mittwald_project_delete",
  description: "Delete a project (requires owner permissions)",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to delete",
      },
    },
  },
};

// Update project description
export const mittwald_project_update_description: Tool = {
  name: "mittwald_project_update_description",
  description: "Update the description of a project",
  inputSchema: {
    type: "object",
    required: ["projectId", "description"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID",
      },
      description: {
        type: "string",
        description: "The new project description",
      },
    },
  },
};

// Upload project avatar
export const mittwald_project_upload_avatar: Tool = {
  name: "mittwald_project_upload_avatar",
  description: "Upload an avatar image for a project",
  inputSchema: {
    type: "object",
    required: ["projectId", "fileContent", "filename"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID",
      },
      fileContent: {
        type: "string",
        description: "Base64 encoded file content",
      },
      filename: {
        type: "string",
        description: "The filename including extension (e.g., 'avatar.png')",
      },
      contentType: {
        type: "string",
        description: "MIME type of the file (e.g., 'image/png')",
        default: "image/png",
      },
    },
  },
};

// Delete project avatar
export const mittwald_project_delete_avatar: Tool = {
  name: "mittwald_project_delete_avatar",
  description: "Delete the avatar image of a project",
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

// Get project JWT
export const mittwald_project_get_jwt: Tool = {
  name: "mittwald_project_get_jwt",
  description: "Get a JWT token for authenticating project-specific operations",
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

// Get server projects
export const mittwald_server_list_projects: Tool = {
  name: "mittwald_server_list_projects",
  description: "List all projects on a specific server",
  inputSchema: {
    type: "object",
    required: ["serverId"],
    properties: {
      serverId: {
        type: "string",
        description: "The server ID",
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

// Export success messages
export const projectListSuccessMessage = "Successfully retrieved project list.";
export const projectGetSuccessMessage = "Successfully retrieved project details.";
export const projectDeleteSuccessMessage = "Project has been successfully deleted.";
export const projectUpdateDescriptionSuccessMessage = "Project description has been updated.";
export const projectUploadAvatarSuccessMessage = "Project avatar has been uploaded successfully.";
export const projectDeleteAvatarSuccessMessage = "Project avatar has been deleted.";
export const projectGetJwtSuccessMessage = "Successfully retrieved project JWT token.";
export const serverListProjectsSuccessMessage = "Successfully retrieved server projects.";