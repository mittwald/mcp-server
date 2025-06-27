import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Marketplace utility tools (scopes, public keys, customer/project extensions)
 */

// List available scopes
export const mittwald_marketplace_list_scopes: Tool = {
  name: "mittwald_marketplace_list_scopes",
  description: "List all available scopes that can be requested by extensions. Scopes define what permissions an extension can have.",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

export const MITTWALD_MARKETPLACE_LIST_SCOPES_SUCCESS = 
  "Successfully retrieved available scopes list.";

// Get public key
export const mittwald_marketplace_get_public_key: Tool = {
  name: "mittwald_marketplace_get_public_key",
  description: "Get a public key by its serial number. Public keys are used for verifying webhook signatures.",
  inputSchema: {
    type: "object",
    properties: {
      serial: {
        type: "string",
        description: "The serial number of the public key"
      }
    },
    required: ["serial"]
  }
};

export const MITTWALD_MARKETPLACE_GET_PUBLIC_KEY_SUCCESS = 
  "Successfully retrieved public key.";

// Get webhook public key
export const mittwald_marketplace_get_webhook_public_key: Tool = {
  name: "mittwald_marketplace_get_webhook_public_key",
  description: "Get a webhook public key by its serial number. Used for webhook signature verification.",
  inputSchema: {
    type: "object",
    properties: {
      serial: {
        type: "string",
        description: "The serial number of the webhook public key"
      }
    },
    required: ["serial"]
  }
};

export const MITTWALD_MARKETPLACE_GET_WEBHOOK_PUBLIC_KEY_SUCCESS = 
  "Successfully retrieved webhook public key.";

// Get customer extension
export const mittwald_marketplace_get_customer_extension: Tool = {
  name: "mittwald_marketplace_get_customer_extension",
  description: "Get extension information in the context of a specific customer. Shows customer-specific extension details.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer",
        format: "uuid"
      },
      extensionId: {
        type: "string",
        description: "The unique identifier of the extension",
        format: "uuid"
      }
    },
    required: ["customerId", "extensionId"]
  }
};

export const MITTWALD_MARKETPLACE_GET_CUSTOMER_EXTENSION_SUCCESS = 
  "Successfully retrieved customer-specific extension details.";

// Get project extension  
export const mittwald_marketplace_get_project_extension: Tool = {
  name: "mittwald_marketplace_get_project_extension",
  description: "Get extension information in the context of a specific project. Shows project-specific extension details and compatibility.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project",
        format: "uuid"
      },
      extensionId: {
        type: "string",
        description: "The unique identifier of the extension",
        format: "uuid"
      }
    },
    required: ["projectId", "extensionId"]
  }
};

export const MITTWALD_MARKETPLACE_GET_PROJECT_EXTENSION_SUCCESS = 
  "Successfully retrieved project-specific extension details.";

// Dry run webhook
export const mittwald_marketplace_dry_run_webhook: Tool = {
  name: "mittwald_marketplace_dry_run_webhook",
  description: "Perform a dry run test of a webhook for an extension instance. Tests webhook connectivity and response without side effects.",
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
      webhookKind: {
        type: "string",
        description: "The type of webhook to test",
        enum: ["install", "uninstall", "enable", "disable", "update"]
      }
    },
    required: ["contributorId", "extensionId", "extensionInstanceId", "webhookKind"]
  }
};

export const MITTWALD_MARKETPLACE_DRY_RUN_WEBHOOK_SUCCESS = 
  "Successfully performed webhook dry run test.";