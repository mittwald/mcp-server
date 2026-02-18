/**
 * @file OpenAPI 3.0 schema template for MCP tools
 * @module docs/reference/scripts/openapi-template
 *
 * @remarks
 * Provides the base OpenAPI 3.0 template and conversion utilities
 * for generating OpenAPI specifications from MCP tool manifests.
 */

/**
 * OpenAPI 3.0 Info Object
 */
export interface OpenAPIInfo {
  title: string;
  description: string;
  version: string;
  contact?: {
    name: string;
    url: string;
    email: string;
  };
  license?: {
    name: string;
    url: string;
  };
}

/**
 * OpenAPI 3.0 Server Object
 */
export interface OpenAPIServer {
  url: string;
  description: string;
  variables?: Record<string, unknown>;
}

/**
 * OpenAPI 3.0 Parameter Object
 */
export interface OpenAPIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description: string;
  required: boolean;
  schema: Record<string, unknown>;
}

/**
 * OpenAPI 3.0 Response Object
 */
export interface OpenAPIResponse {
  description: string;
  content?: {
    'application/json': {
      schema: Record<string, unknown>;
    };
  };
}

/**
 * OpenAPI 3.0 Operation Object
 */
export interface OpenAPIOperation {
  summary: string;
  description: string;
  operationId: string;
  tags: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required: boolean;
    content: {
      'application/json': {
        schema: Record<string, unknown>;
      };
    };
  };
  responses: {
    '200': OpenAPIResponse;
    '400': OpenAPIResponse;
    '401': OpenAPIResponse;
    '404': OpenAPIResponse;
  };
}

/**
 * OpenAPI 3.0 Path Item Object
 */
export interface OpenAPIPathItem {
  post: OpenAPIOperation;
}

/**
 * OpenAPI 3.0 Schema Object
 */
export interface OpenAPISchema {
  openapi: string;
  info: OpenAPIInfo;
  servers: OpenAPIServer[];
  paths: Record<string, OpenAPIPathItem>;
  components: {
    schemas: Record<string, Record<string, unknown>>;
  };
  tags: Array<{
    name: string;
    description: string;
  }>;
}

/**
 * Creates the base OpenAPI schema template
 *
 * @returns Base OpenAPI 3.0 schema object
 */
export function createOpenAPITemplate(): OpenAPISchema {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Mittwald MCP Tools API',
      description: 'MCP tool definitions and specifications for Mittwald hosting platform',
      version: '1.0.0',
      contact: {
        name: 'Mittwald Support',
        url: 'https://mittwald.de',
        email: 'support@mittwald.de',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://api.mittwald.de',
        description: 'Mittwald API Server',
      },
    ],
    paths: {},
    components: {
      schemas: {
        Tool: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            parameters: {
              type: 'array',
              items: { $ref: '#/components/schemas/Parameter' },
            },
            returnType: { $ref: '#/components/schemas/ReturnType' },
          },
          required: ['name', 'title', 'description', 'parameters', 'returnType'],
        },
        Parameter: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            description: { type: 'string' },
            required: { type: 'boolean' },
            enum: { type: 'array', items: { type: 'string' } },
            default: {},
          },
          required: ['name', 'type', 'description', 'required'],
        },
        ReturnType: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            description: { type: 'string' },
            example: {},
          },
          required: ['type', 'description'],
        },
        ToolsManifest: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            generatedAt: { type: 'string', format: 'date-time' },
            totalTools: { type: 'integer' },
            tools: { type: 'object' },
            domains: { type: 'object' },
          },
          required: ['version', 'generatedAt', 'totalTools', 'tools', 'domains'],
        },
        Error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' },
          },
          required: ['code', 'message'],
        },
      },
    },
    tags: [
      {
        name: 'Tools',
        description: 'MCP Tool definitions and operations',
      },
      {
        name: 'Domains',
        description: 'Tool domain information',
      },
      {
        name: 'Manifests',
        description: 'Tool manifest operations',
      },
    ],
  };
}

/**
 * Creates a path item for a tool operation in OpenAPI
 *
 * @param toolName - Name of the tool
 * @param toolTitle - Title of the tool
 * @param description - Description of the tool
 * @param domain - Domain/category of the tool
 * @param parameters - Tool parameters schema
 * @returns OpenAPI PathItem object
 */
export function createOpenAPIPathItem(
  toolName: string,
  toolTitle: string,
  description: string,
  domain: string,
  parameters: Record<string, unknown>
): OpenAPIPathItem {
  return {
    post: {
      summary: toolTitle,
      description,
      operationId: toolName,
      tags: [domain],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: parameters,
          },
        },
      },
      responses: {
        '200': {
          description: `Successful response from ${toolName}`,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['success', 'error'] },
                  message: { type: 'string' },
                  data: {},
                  metadata: {
                    type: 'object',
                    properties: {
                      durationMs: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Invalid parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        '401': {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        '404': {
          description: 'Tool not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
  };
}
