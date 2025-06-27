import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Contributor management tools for Mittwald Marketplace API
 */

// List contributors
export const mittwald_contributor_list: Tool = {
  name: "mittwald_contributor_list",
  description: "List all marketplace contributors. Returns a list of contributors with their basic information including ID, name, domain, and state.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of contributors to return",
        minimum: 1,
        maximum: 100,
        default: 50
      },
      offset: {
        type: "number",
        description: "Number of contributors to skip for pagination",
        minimum: 0,
        default: 0
      }
    }
  }
};

export const MITTWALD_CONTRIBUTOR_LIST_SUCCESS = 
  "Successfully retrieved marketplace contributors list.";

// Get contributor by ID
export const mittwald_contributor_get: Tool = {
  name: "mittwald_contributor_get",
  description: "Get detailed information about a specific marketplace contributor by their ID. Returns contributor details including name, domain, state, imprint, and support metadata.",
  inputSchema: {
    type: "object",
    properties: {
      contributorId: {
        type: "string",
        description: "The unique identifier of the contributor",
        format: "uuid"
      }
    },
    required: ["contributorId"]
  }
};

export const MITTWALD_CONTRIBUTOR_GET_SUCCESS = 
  "Successfully retrieved contributor details.";

// Get contributor extensions
export const mittwald_contributor_get_extensions: Tool = {
  name: "mittwald_contributor_get_extensions",
  description: "List all extensions published by a specific contributor. Returns a list of extensions with their metadata including name, description, version, and statistics.",
  inputSchema: {
    type: "object",
    properties: {
      contributorId: {
        type: "string",
        description: "The unique identifier of the contributor",
        format: "uuid"
      },
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
    },
    required: ["contributorId"]
  }
};

export const MITTWALD_CONTRIBUTOR_GET_EXTENSIONS_SUCCESS = 
  "Successfully retrieved contributor's extensions list.";