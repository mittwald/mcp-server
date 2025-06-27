import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Extension management tools for Mittwald Marketplace API
 */

// List all extensions
export const mittwald_extension_list: Tool = {
  name: "mittwald_extension_list",
  description: "List all available extensions in the marketplace. Returns extensions with their metadata including name, description, version, and statistics.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of extensions to return",
        minimum: 1,
        maximum: 100,
        default: 50
      },
      offset: {
        type: "number",
        description: "Number of extensions to skip for pagination",
        minimum: 0,
        default: 0
      }
    }
  }
};

export const MITTWALD_EXTENSION_LIST_SUCCESS = 
  "Successfully retrieved extensions list.";

// Get extension by ID
export const mittwald_extension_get: Tool = {
  name: "mittwald_extension_get",
  description: "Get detailed information about a specific extension by its ID. Returns full extension details including descriptions, URLs, statistics, and health status.",
  inputSchema: {
    type: "object",
    properties: {
      extensionId: {
        type: "string",
        description: "The unique identifier of the extension",
        format: "uuid"
      }
    },
    required: ["extensionId"]
  }
};

export const MITTWALD_EXTENSION_GET_SUCCESS = 
  "Successfully retrieved extension details.";

// Create extension
export const mittwald_extension_create: Tool = {
  name: "mittwald_extension_create",
  description: "Create a new extension for a contributor. Requires contributor ownership permissions.",
  inputSchema: {
    type: "object",
    properties: {
      contributorId: {
        type: "string",
        description: "The unique identifier of the contributor",
        format: "uuid"
      },
      name: {
        type: "string",
        description: "The name of the extension",
        minLength: 1,
        maxLength: 100
      },
      shortDescription: {
        type: "object",
        description: "Localized short descriptions (key: locale, value: description)",
        additionalProperties: {
          type: "string"
        },
        minProperties: 1
      }
    },
    required: ["contributorId", "name", "shortDescription"]
  }
};

export const MITTWALD_EXTENSION_CREATE_SUCCESS = 
  "Successfully created new extension.";

// Update extension
export const mittwald_extension_update: Tool = {
  name: "mittwald_extension_update",
  description: "Update an existing extension's metadata. Requires contributor ownership permissions.",
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
      name: {
        type: "string",
        description: "The name of the extension",
        minLength: 1,
        maxLength: 100
      },
      shortDescription: {
        type: "object",
        description: "Localized short descriptions",
        additionalProperties: {
          type: "string"
        }
      },
      detailedDescription: {
        type: "object",
        description: "Localized detailed descriptions with format",
        additionalProperties: {
          type: "object",
          properties: {
            content: { type: "string" },
            format: { 
              type: "string",
              enum: ["markdown", "html", "plain"]
            }
          },
          required: ["content", "format"]
        }
      },
      license: {
        type: "string",
        description: "License identifier (e.g., MIT, Apache-2.0)"
      },
      privacyUrl: {
        type: "string",
        description: "URL to privacy policy",
        format: "uri"
      },
      termsOfServiceUrl: {
        type: "string",
        description: "URL to terms of service",
        format: "uri"
      },
      releaseNotesUrl: {
        type: "string",
        description: "URL to release notes",
        format: "uri"
      },
      supportUrl: {
        type: "string",
        description: "URL to support page",
        format: "uri"
      },
      tags: {
        type: "array",
        description: "Tags for categorization",
        items: {
          type: "string"
        }
      },
      version: {
        type: "string",
        description: "Extension version"
      }
    },
    required: ["contributorId", "extensionId"]
  }
};

export const MITTWALD_EXTENSION_UPDATE_SUCCESS = 
  "Successfully updated extension.";

// Delete extension
export const mittwald_extension_delete: Tool = {
  name: "mittwald_extension_delete",
  description: "Delete an extension. Requires contributor ownership permissions and no active installations.",
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
      }
    },
    required: ["contributorId", "extensionId"]
  }
};

export const MITTWALD_EXTENSION_DELETE_SUCCESS = 
  "Successfully deleted extension.";

// Publish/unpublish extension
export const mittwald_extension_publish: Tool = {
  name: "mittwald_extension_publish",
  description: "Publish or unpublish an extension in the marketplace. Published extensions are visible to all users.",
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
      published: {
        type: "boolean",
        description: "Whether to publish (true) or unpublish (false) the extension"
      }
    },
    required: ["contributorId", "extensionId", "published"]
  }
};

export const MITTWALD_EXTENSION_PUBLISH_SUCCESS = 
  "Successfully updated extension publication status.";

// Update extension context
export const mittwald_extension_update_context: Tool = {
  name: "mittwald_extension_update_context",
  description: "Update the context requirements for an extension. Context defines which apps or projects the extension can be installed on.",
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
      context: {
        type: "object",
        description: "Context requirements for the extension",
        properties: {
          company: {
            type: "object",
            properties: {
              apps: {
                type: "array",
                items: { type: "string" }
              },
              projects: {
                type: "array",
                items: { type: "string" }
              }
            }
          },
          mittwald: {
            type: "object",
            properties: {
              apps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    aggregateType: { type: "string" },
                    aggregateId: { type: "string" },
                    field: { type: "string" },
                    operator: { 
                      type: "string",
                      enum: ["eq", "ne", "in", "nin"]
                    },
                    value: {}
                  },
                  required: ["aggregateType"]
                }
              },
              projects: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    aggregateType: { type: "string" },
                    aggregateId: { type: "string" },
                    field: { type: "string" },
                    operator: { 
                      type: "string",
                      enum: ["eq", "ne", "in", "nin"]
                    },
                    value: {}
                  },
                  required: ["aggregateType"]
                }
              }
            }
          }
        }
      }
    },
    required: ["contributorId", "extensionId", "context"]
  }
};

export const MITTWALD_EXTENSION_UPDATE_CONTEXT_SUCCESS = 
  "Successfully updated extension context.";

// Upload extension logo
export const mittwald_extension_upload_logo: Tool = {
  name: "mittwald_extension_upload_logo",
  description: "Upload a logo image for an extension. Supported formats: PNG, JPG, SVG.",
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
      logoBase64: {
        type: "string",
        description: "Base64 encoded logo image data"
      },
      contentType: {
        type: "string",
        description: "MIME type of the image",
        enum: ["image/png", "image/jpeg", "image/svg+xml"]
      }
    },
    required: ["contributorId", "extensionId", "logoBase64", "contentType"]
  }
};

export const MITTWALD_EXTENSION_UPLOAD_LOGO_SUCCESS = 
  "Successfully uploaded extension logo.";

// Delete extension logo
export const mittwald_extension_delete_logo: Tool = {
  name: "mittwald_extension_delete_logo",
  description: "Delete the logo of an extension.",
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
      }
    },
    required: ["contributorId", "extensionId"]
  }
};

export const MITTWALD_EXTENSION_DELETE_LOGO_SUCCESS = 
  "Successfully deleted extension logo.";

// Upload extension asset
export const mittwald_extension_upload_asset: Tool = {
  name: "mittwald_extension_upload_asset",
  description: "Upload an asset (image, document, etc.) for an extension.",
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
      filename: {
        type: "string",
        description: "Original filename of the asset"
      },
      contentBase64: {
        type: "string",
        description: "Base64 encoded asset data"
      },
      contentType: {
        type: "string",
        description: "MIME type of the asset"
      }
    },
    required: ["contributorId", "extensionId", "filename", "contentBase64", "contentType"]
  }
};

export const MITTWALD_EXTENSION_UPLOAD_ASSET_SUCCESS = 
  "Successfully uploaded extension asset.";

// Delete extension asset
export const mittwald_extension_delete_asset: Tool = {
  name: "mittwald_extension_delete_asset",
  description: "Delete an asset from an extension.",
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
      assetRefId: {
        type: "string",
        description: "The unique identifier of the asset",
        format: "uuid"
      }
    },
    required: ["contributorId", "extensionId", "assetRefId"]
  }
};

export const MITTWALD_EXTENSION_DELETE_ASSET_SUCCESS = 
  "Successfully deleted extension asset.";

// Create extension secret
export const mittwald_extension_create_secret: Tool = {
  name: "mittwald_extension_create_secret",
  description: "Create a secret for an extension. Secrets are used for secure configuration like API keys.",
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
      name: {
        type: "string",
        description: "Name of the secret"
      },
      value: {
        type: "string",
        description: "Secret value (will be encrypted)"
      }
    },
    required: ["contributorId", "extensionId", "name", "value"]
  }
};

export const MITTWALD_EXTENSION_CREATE_SECRET_SUCCESS = 
  "Successfully created extension secret.";

// Delete extension secret
export const mittwald_extension_delete_secret: Tool = {
  name: "mittwald_extension_delete_secret",
  description: "Delete a secret from an extension.",
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
      extensionSecretId: {
        type: "string",
        description: "The unique identifier of the secret",
        format: "uuid"
      }
    },
    required: ["contributorId", "extensionId", "extensionSecretId"]
  }
};

export const MITTWALD_EXTENSION_DELETE_SECRET_SUCCESS = 
  "Successfully deleted extension secret.";

// Request extension verification
export const mittwald_extension_request_verification: Tool = {
  name: "mittwald_extension_request_verification",
  description: "Request verification process for an extension. Verification is required for certain features.",
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
      }
    },
    required: ["contributorId", "extensionId"]
  }
};

export const MITTWALD_EXTENSION_REQUEST_VERIFICATION_SUCCESS = 
  "Successfully requested extension verification.";