/**
 * @file Mittwald File MCP tool definitions
 * @module constants/tool/mittwald/file
 * 
 * @remarks
 * This module defines all MCP tools for Mittwald file operations.
 * Based on 11 file API endpoints from the Mittwald API.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool to create a new file
 */
export const mittwaldFileCreate: Tool = {
  name: "mittwald_file_create",
  description: "Create a new file in the Mittwald platform. This uploads and stores a file with metadata and returns file information including ID and access details.",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The file content (base64 encoded for binary files)"
      },
      filename: {
        type: "string",
        description: "The name of the file to create"
      },
      contentType: {
        type: "string",
        description: "MIME type of the file (e.g., 'text/plain', 'image/jpeg')"
      }
    },
    required: ["content", "filename"]
  },
  _meta: {
    title: "Create File",
    type: "server"
  }
};

/**
 * Tool to get file metadata
 */
export const mittwaldFileGetMeta: Tool = {
  name: "mittwald_file_get_meta",
  description: "Get metadata information for a specific file including size, content type, creation date, and other file properties without downloading the actual content.",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "The unique identifier of the file to get metadata for"
      }
    },
    required: ["fileId"]
  },
  _meta: {
    title: "Get File Metadata",
    type: "server"
  }
};

/**
 * Tool to get file content
 */
export const mittwaldFileGet: Tool = {
  name: "mittwald_file_get",
  description: "Download and retrieve the complete content of a file by its ID. Returns the file data along with metadata such as content type and size.",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "The unique identifier of the file to retrieve"
      }
    },
    required: ["fileId"]
  },
  _meta: {
    title: "Get File Content",
    type: "server"
  }
};

/**
 * Tool to get file with user-friendly URL
 */
export const mittwaldFileGetWithName: Tool = {
  name: "mittwald_file_get_with_name",
  description: "Get file content using a user-friendly URL that includes the filename. This provides a more readable download URL for end users.",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "The unique identifier of the file"
      },
      fileName: {
        type: "string",
        description: "The filename to use in the URL"
      }
    },
    required: ["fileId", "fileName"]
  },
  _meta: {
    title: "Get File with Friendly URL",
    type: "server"
  }
};

/**
 * Tool to get file upload token rules
 */
export const mittwaldFileGetUploadTokenRules: Tool = {
  name: "mittwald_file_get_upload_token_rules",
  description: "Get the upload rules and restrictions for a specific file upload token including allowed file types, size limits, and security constraints.",
  inputSchema: {
    type: "object",
    properties: {
      fileUploadToken: {
        type: "string",
        description: "The file upload token to get rules for"
      }
    },
    required: ["fileUploadToken"]
  },
  _meta: {
    title: "Get File Upload Token Rules",
    type: "server"
  }
};

/**
 * Tool to get file upload type rules
 */
export const mittwaldFileGetUploadTypeRules: Tool = {
  name: "mittwald_file_get_upload_type_rules",
  description: "Get the upload rules and restrictions for a specific file upload type including allowed formats, size limits, and validation requirements.",
  inputSchema: {
    type: "object",
    properties: {
      fileUploadType: {
        type: "string",
        description: "The file upload type to get rules for"
      }
    },
    required: ["fileUploadType"]
  },
  _meta: {
    title: "Get File Upload Type Rules",
    type: "server"
  }
};

/**
 * Tool to request file upload for conversation
 */
export const mittwaldConversationRequestFileUpload: Tool = {
  name: "mittwald_conversation_request_file_upload",
  description: "Request a file upload token for attaching files to a conversation or support ticket. Returns upload parameters and authorization details.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        description: "The unique identifier of the conversation to upload file to"
      },
      filename: {
        type: "string",
        description: "The name of the file to upload"
      },
      contentType: {
        type: "string",
        description: "MIME type of the file"
      }
    },
    required: ["conversationId", "filename"]
  },
  _meta: {
    title: "Request Conversation File Upload",
    type: "server"
  }
};

/**
 * Tool to get conversation file access token
 */
export const mittwaldConversationGetFileAccessToken: Tool = {
  name: "mittwald_conversation_get_file_access_token",
  description: "Request an access token for downloading a file that belongs to a conversation or support ticket. Required for accessing protected conversation files.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        description: "The unique identifier of the conversation"
      },
      fileId: {
        type: "string",
        description: "The unique identifier of the file to access"
      }
    },
    required: ["conversationId", "fileId"]
  },
  _meta: {
    title: "Get Conversation File Access Token",
    type: "server"
  }
};

/**
 * Tool to get invoice file access token
 */
export const mittwaldInvoiceGetFileAccessToken: Tool = {
  name: "mittwald_invoice_get_file_access_token",
  description: "Request an access token for downloading an invoice file. Provides secure access to customer invoice documents and billing information.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      },
      invoiceId: {
        type: "string",
        description: "The unique identifier of the invoice"
      }
    },
    required: ["customerId", "invoiceId"]
  },
  _meta: {
    title: "Get Invoice File Access Token",
    type: "server"
  }
};

/**
 * Tool to get deprecated file token rules
 */
export const mittwaldDeprecatedFileGetTokenRules: Tool = {
  name: "mittwald_deprecated_file_get_token_rules",
  description: "Get upload rules for a deprecated file token. This is a legacy endpoint maintained for backward compatibility with older file upload systems.",
  inputSchema: {
    type: "object",
    properties: {
      token: {
        type: "string",
        description: "The deprecated file token to get rules for"
      }
    },
    required: ["token"]
  },
  _meta: {
    title: "Get Deprecated File Token Rules",
    type: "server"
  }
};

/**
 * Tool to get deprecated file type rules
 */
export const mittwaldDeprecatedFileGetTypeRules: Tool = {
  name: "mittwald_deprecated_file_get_type_rules",
  description: "Get upload rules for a deprecated file type. This is a legacy endpoint maintained for backward compatibility with older file type systems.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The deprecated file type name to get rules for"
      }
    },
    required: ["name"]
  },
  _meta: {
    title: "Get Deprecated File Type Rules",
    type: "server"
  }
};

export const MITTWALD_FILE_TOOLS: Tool[] = [
  mittwaldFileCreate,
  mittwaldFileGetMeta,
  mittwaldFileGet,
  mittwaldFileGetWithName,
  mittwaldFileGetUploadTokenRules,
  mittwaldFileGetUploadTypeRules,
  mittwaldConversationRequestFileUpload,
  mittwaldConversationGetFileAccessToken,
  mittwaldInvoiceGetFileAccessToken,
  mittwaldDeprecatedFileGetTokenRules,
  mittwaldDeprecatedFileGetTypeRules
];