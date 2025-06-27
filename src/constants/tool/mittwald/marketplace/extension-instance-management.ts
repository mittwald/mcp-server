import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Extension instance management tools for Mittwald Marketplace API
 */

// List extension instances
export const mittwald_extension_instance_list: Tool = {
  name: "mittwald_extension_instance_list",
  description: "List all extension instances. Can be filtered by project or customer.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "Filter by project ID",
        format: "uuid"
      },
      customerId: {
        type: "string",
        description: "Filter by customer ID",
        format: "uuid"
      },
      limit: {
        type: "number",
        description: "Maximum number of instances to return",
        minimum: 1,
        maximum: 100,
        default: 50
      },
      offset: {
        type: "number",
        description: "Number of instances to skip for pagination",
        minimum: 0,
        default: 0
      }
    }
  }
};

export const MITTWALD_EXTENSION_INSTANCE_LIST_SUCCESS = 
  "Successfully retrieved extension instances list.";

// Get extension instance
export const mittwald_extension_instance_get: Tool = {
  name: "mittwald_extension_instance_get",
  description: "Get detailed information about a specific extension instance including its status, health, and configuration.",
  inputSchema: {
    type: "object",
    properties: {
      extensionInstanceId: {
        type: "string",
        description: "The unique identifier of the extension instance",
        format: "uuid"
      }
    },
    required: ["extensionInstanceId"]
  }
};

export const MITTWALD_EXTENSION_INSTANCE_GET_SUCCESS = 
  "Successfully retrieved extension instance details.";

// Create extension instance
export const mittwald_extension_instance_create: Tool = {
  name: "mittwald_extension_instance_create",
  description: "Create a new instance of an extension. The extension will be installed in the specified project or customer context.",
  inputSchema: {
    type: "object",
    properties: {
      extensionId: {
        type: "string",
        description: "The unique identifier of the extension to install",
        format: "uuid"
      },
      projectId: {
        type: "string",
        description: "The project ID where the extension should be installed",
        format: "uuid"
      },
      customerId: {
        type: "string",
        description: "The customer ID where the extension should be installed (alternative to projectId)",
        format: "uuid"
      },
      scopes: {
        type: "array",
        description: "Initial scopes/permissions for the extension instance",
        items: {
          type: "string"
        }
      }
    },
    required: ["extensionId"]
  }
};

export const MITTWALD_EXTENSION_INSTANCE_CREATE_SUCCESS = 
  "Successfully created extension instance.";

// Delete extension instance
export const mittwald_extension_instance_delete: Tool = {
  name: "mittwald_extension_instance_delete",
  description: "Delete an extension instance. This will uninstall the extension from the project or customer.",
  inputSchema: {
    type: "object",
    properties: {
      extensionInstanceId: {
        type: "string",
        description: "The unique identifier of the extension instance to delete",
        format: "uuid"
      }
    },
    required: ["extensionInstanceId"]
  }
};

export const MITTWALD_EXTENSION_INSTANCE_DELETE_SUCCESS = 
  "Successfully deleted extension instance.";

// Enable extension instance
export const mittwald_extension_instance_enable: Tool = {
  name: "mittwald_extension_instance_enable",
  description: "Enable a disabled extension instance. This will reactivate the extension's functionality.",
  inputSchema: {
    type: "object",
    properties: {
      extensionInstanceId: {
        type: "string",
        description: "The unique identifier of the extension instance to enable",
        format: "uuid"
      }
    },
    required: ["extensionInstanceId"]
  }
};

export const MITTWALD_EXTENSION_INSTANCE_ENABLE_SUCCESS = 
  "Successfully enabled extension instance.";

// Disable extension instance
export const mittwald_extension_instance_disable: Tool = {
  name: "mittwald_extension_instance_disable",
  description: "Disable an extension instance. This will temporarily deactivate the extension's functionality without uninstalling it.",
  inputSchema: {
    type: "object",
    properties: {
      extensionInstanceId: {
        type: "string",
        description: "The unique identifier of the extension instance to disable",
        format: "uuid"
      }
    },
    required: ["extensionInstanceId"]
  }
};

export const MITTWALD_EXTENSION_INSTANCE_DISABLE_SUCCESS = 
  "Successfully disabled extension instance.";

// Update extension instance scopes
export const mittwald_extension_instance_update_scopes: Tool = {
  name: "mittwald_extension_instance_update_scopes",
  description: "Update the scopes/permissions for an extension instance. This controls what the extension can access.",
  inputSchema: {
    type: "object",
    properties: {
      extensionInstanceId: {
        type: "string",
        description: "The unique identifier of the extension instance",
        format: "uuid"
      },
      scopes: {
        type: "array",
        description: "New list of scopes/permissions for the extension instance",
        items: {
          type: "string"
        }
      }
    },
    required: ["extensionInstanceId", "scopes"]
  }
};

export const MITTWALD_EXTENSION_INSTANCE_UPDATE_SCOPES_SUCCESS = 
  "Successfully updated extension instance scopes.";

// Create access token retrieval key
export const mittwald_extension_instance_create_retrieval_key: Tool = {
  name: "mittwald_extension_instance_create_retrieval_key",
  description: "Create a retrieval key for obtaining access tokens for an extension instance. Used for authentication workflows.",
  inputSchema: {
    type: "object",
    properties: {
      extensionInstanceId: {
        type: "string",
        description: "The unique identifier of the extension instance",
        format: "uuid"
      }
    },
    required: ["extensionInstanceId"]
  }
};

export const MITTWALD_EXTENSION_INSTANCE_CREATE_RETRIEVAL_KEY_SUCCESS = 
  "Successfully created access token retrieval key.";

// Create extension instance token
export const mittwald_extension_instance_create_token: Tool = {
  name: "mittwald_extension_instance_create_token",
  description: "Create an access token for an extension instance. This token can be used to authenticate API requests on behalf of the extension.",
  inputSchema: {
    type: "object",
    properties: {
      extensionInstanceId: {
        type: "string",
        description: "The unique identifier of the extension instance",
        format: "uuid"
      },
      description: {
        type: "string",
        description: "Description of the token's purpose"
      },
      expiresAt: {
        type: "string",
        description: "Token expiration date in ISO 8601 format",
        format: "date-time"
      },
      scopes: {
        type: "array",
        description: "Specific scopes for this token (subset of instance scopes)",
        items: {
          type: "string"
        }
      }
    },
    required: ["extensionInstanceId"]
  }
};

export const MITTWALD_EXTENSION_INSTANCE_CREATE_TOKEN_SUCCESS = 
  "Successfully created extension instance token.";

// Update extension instance secret
export const mittwald_extension_instance_update_secret: Tool = {
  name: "mittwald_extension_instance_update_secret",
  description: "Update a secret value for an extension instance. Used to configure instance-specific secrets like API keys.",
  inputSchema: {
    type: "object",
    properties: {
      contributorId: {
        type: "string",
        description: "The unique identifier of the contributor",
        format: "uuid"
      },
      extensionId: {
        type: "string",
        description: "The unique identifier of the extension",
        format: "uuid"
      },
      extensionInstanceId: {
        type: "string",
        description: "The unique identifier of the extension instance",
        format: "uuid"
      },
      secretName: {
        type: "string",
        description: "Name of the secret to update"
      },
      secretValue: {
        type: "string",
        description: "New value for the secret"
      }
    },
    required: ["contributorId", "extensionId", "extensionInstanceId", "secretName", "secretValue"]
  }
};

export const MITTWALD_EXTENSION_INSTANCE_UPDATE_SECRET_SUCCESS = 
  "Successfully updated extension instance secret.";

// Authenticate session token
export const mittwald_extension_instance_authenticate_session: Tool = {
  name: "mittwald_extension_instance_authenticate_session",
  description: "Authenticate using a session token and receive an access token. Used in OAuth-like flows.",
  inputSchema: {
    type: "object",
    properties: {
      extensionInstanceId: {
        type: "string",
        description: "The unique identifier of the extension instance",
        format: "uuid"
      },
      sessionId: {
        type: "string",
        description: "The session ID",
        format: "uuid"
      },
      sessionToken: {
        type: "string",
        description: "The session token to authenticate"
      }
    },
    required: ["extensionInstanceId", "sessionId", "sessionToken"]
  }
};

export const MITTWALD_EXTENSION_INSTANCE_AUTHENTICATE_SESSION_SUCCESS = 
  "Successfully authenticated session and received access token.";