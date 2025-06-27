/**
 * @file MCP Tool request handlers
 * @module handlers/tool-handlers
 * 
 * @remarks
 * This module implements the MCP tool handling functionality, managing
 * both tool listing and tool invocation. It serves as the main entry point
 * for all tool-related operations in the Reddit MCP server.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools Specification}
 */

import type {
  CallToolRequest,
  CallToolResult,
  ListToolsRequest,
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TOOLS, TOOL_ERROR_MESSAGES } from '../constants/tools.js';
import { RedditService } from '../services/reddit/reddit-service.js';
import { logger } from '../utils/logger.js';
import type { RedditAuthInfo, MCPToolContext } from '../types/request-context.js';
import type { ToolHandlerContext } from './tools/types.js';
import type {
  GetChannelArgs,
  GetPostArgs,
  GetNotificationsArgs,
  SearchRedditArgs,
  GetCommentArgs,
} from './tools/index.js';
import {
  handleGetChannel,
  handleGetNotifications,
  handleGetPost,
  handleSearchReddit,
  handleGetComment,
  handleElicitationExample,
  handleSamplingExample,
  handleStructuredDataExample,
  handleLogging,
  handleValidationExample,
} from './tools/index.js';
// Import all Mittwald Container API handlers
import {
  handleCreateRegistry,
  handleListRegistries,
  handleGetRegistry,
  handleUpdateRegistry,
  handleDeleteRegistry,
  handleValidateRegistryUri,
  handleValidateRegistryCredentials,
  handleListStacks,
  handleGetStack,
  handleUpdateStack,
  handleDeclareStack,
  handleListServices,
  handleGetService,
  handleGetServiceLogs,
  handleStartService,
  handleStopService,
  handleRestartService,
  handleRecreateService,
  handlePullImageForService,
  handleListVolumes,
  handleGetVolume,
  handleDeleteVolume,
  handleGetContainerImageConfig,
} from './mittwald/container/index.js';

/**
 * Zod schemas for tool validation
 */
const ToolSchemas = {
  search_reddit: z.object({
    query: z.string().min(1).max(500).describe("Search query"),
    subreddit: z.string().optional().describe("Specific subreddit to search (optional)"),
    sort: z.enum(["relevance", "hot", "new", "top"]).default("relevance").describe("Sort order for results"),
    time: z.enum(["hour", "day", "week", "month", "year", "all"]).default("all").describe("Time filter for results"),
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of results")
  }),
  
  get_channel: z.object({
    subreddit: z.string().min(1).describe("Name of the subreddit (without r/ prefix)"),
    sort: z.enum(["hot", "new", "controversial"]).default("hot").describe("Sort order for posts")
  }),
  
  get_post: z.object({
    id: z.string().describe("The unique identifier of the post to retrieve")
  }),
  
  get_notifications: z.object({
    filter: z.enum(["all", "unread", "messages", "comments", "mentions"]).optional().describe("Filter notifications"),
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of notifications"),
    markRead: z.boolean().optional().describe("Mark notifications as read"),
    excludeIds: z.array(z.string()).optional().describe("IDs to exclude"),
    excludeTypes: z.array(z.enum(["comment_reply", "post_reply", "username_mention", "message", "other"])).optional().describe("Types to exclude"),
    excludeSubreddits: z.array(z.string()).optional().describe("Subreddits to exclude"),
    after: z.string().optional().describe("Cursor for pagination"),
    before: z.string().optional().describe("Cursor for pagination")
  }),
  
  get_comment: z.object({
    id: z.string().describe("The unique identifier of the comment"),
    includeThread: z.boolean().optional().describe("Include full comment thread")
  }),
  
  elicitation_example: z.object({
    type: z.enum(["input", "confirm", "choice"]).describe("Type of elicitation"),
    prompt: z.string().describe("Prompt to show to user"),
    options: z.array(z.string()).optional().describe("Options for choice type")
  }),
  
  sampling_example: z.object({
    taskType: z.enum(['summarize', 'generate', 'analyze', 'translate']).describe("The type of sampling task to demonstrate"),
    content: z.string().describe("Input content for the sampling task"),
    targetLanguage: z.string().optional().describe("Target language for translation tasks"),
    style: z.enum(['formal', 'casual', 'technical', 'creative']).optional().describe("Style preferences for generation tasks")
  }),
  
  structured_data_example: z.object({
    dataType: z.enum(['user', 'analytics', 'weather', 'product']).describe('The type of structured data to return'),
    id: z.string().optional().describe('Optional ID to fetch specific data'),
    includeNested: z.boolean().optional().default(false).describe('Whether to include nested data structures'),
    simulateError: z.boolean().optional().default(false).describe('Whether to simulate validation errors for testing')
  }).strict(),
  
  mcp_logging: z.object({
    level: z.enum(["debug", "info", "warning", "error"]).describe("Log level"),
    message: z.string().describe("Message to log"),
    data: z.unknown().optional().describe("Optional additional data")
  }),
  
  validation_example: z.object({
    name: z.string().min(2).max(50).regex(/^[a-zA-Z ]+$/).describe("Name (letters and spaces only, 2-50 chars)"),
    age: z.number().int().min(0).max(150).describe("Age in years (0-150)"),
    email: z.string().email().describe("Valid email address"),
    role: z.enum(["user", "admin", "moderator"]).describe("User role"),
    preferences: z.object({
      theme: z.enum(["light", "dark", "auto"]).optional().default("auto"),
      notifications: z.boolean().optional().default(true)
    }).optional(),
    tags: z.array(z.string().min(1)).min(0).max(10).optional().describe("List of tags (max 10, unique)")
  }),
  
  // Mittwald Container API Registry tools
  mittwald_container_create_registry: z.object({
    projectId: z.string().describe("Project ID"),
    imageRegistryType: z.enum(["docker", "github", "gitlab"]).describe("Registry type"),
    uri: z.string().describe("Registry URI"),
    username: z.string().optional().describe("Registry username"),
    password: z.string().optional().describe("Registry password")
  }),
  
  mittwald_container_list_registries: z.object({
    projectId: z.string().describe("Project ID"),
    limit: z.number().int().min(1).max(1000).default(100).optional().describe("Maximum results"),
    skip: z.number().int().min(0).default(0).optional().describe("Results to skip"),
    page: z.number().int().min(1).optional().describe("Page number")
  }),
  
  mittwald_container_get_registry: z.object({
    registryId: z.string().describe("Registry ID")
  }),
  
  mittwald_container_update_registry: z.object({
    registryId: z.string().describe("Registry ID"),
    imageRegistryType: z.enum(["docker", "github", "gitlab"]).optional().describe("New registry type"),
    uri: z.string().optional().describe("New registry URI"),
    username: z.string().optional().describe("New registry username"),
    password: z.string().optional().describe("New registry password")
  }),
  
  mittwald_container_delete_registry: z.object({
    registryId: z.string().describe("Registry ID")
  }),
  
  mittwald_container_validate_registry_uri: z.object({
    uri: z.string().describe("Registry URI to validate")
  }),
  
  mittwald_container_validate_registry_credentials: z.object({
    registryId: z.string().describe("Registry ID")
  }),
  
  // Mittwald Container API Stack tools
  mittwald_container_list_stacks: z.object({
    projectId: z.string().describe("Project ID"),
    limit: z.number().int().min(1).max(1000).default(100).optional().describe("Maximum results"),
    skip: z.number().int().min(0).default(0).optional().describe("Results to skip"),
    page: z.number().int().min(1).optional().describe("Page number")
  }),
  
  mittwald_container_get_stack: z.object({
    stackId: z.string().describe("Stack ID")
  }),
  
  mittwald_container_update_stack: z.object({
    stackId: z.string().describe("Stack ID"),
    services: z.array(z.object({
      name: z.string().describe("Service name"),
      imageURI: z.string().optional().describe("Docker image URI"),
      environment: z.record(z.string()).optional().describe("Environment variables"),
      ports: z.array(z.object({
        containerPort: z.number().int().describe("Container port"),
        protocol: z.enum(["tcp", "udp"]).default("tcp").optional().describe("Protocol")
      })).optional().describe("Port mappings"),
      volumes: z.array(z.object({
        name: z.string().describe("Volume name"),
        mountPath: z.string().describe("Mount path"),
        readOnly: z.boolean().default(false).optional().describe("Read-only mount")
      })).optional().describe("Volume mounts")
    })).optional().describe("Services to update"),
    volumes: z.array(z.object({
      name: z.string().describe("Volume name"),
      size: z.string().optional().describe("Volume size")
    })).optional().describe("Volumes to update")
  }),
  
  mittwald_container_declare_stack: z.object({
    stackId: z.string().describe("Stack ID"),
    desiredServices: z.array(z.object({
      name: z.string().describe("Service name"),
      imageURI: z.string().describe("Docker image URI"),
      environment: z.record(z.string()).optional().describe("Environment variables"),
      ports: z.array(z.object({
        containerPort: z.number().int().describe("Container port"),
        protocol: z.enum(["tcp", "udp"]).default("tcp").optional().describe("Protocol")
      })).optional().describe("Port mappings"),
      volumes: z.array(z.object({
        name: z.string().describe("Volume name"),
        mountPath: z.string().describe("Mount path"),
        readOnly: z.boolean().default(false).optional().describe("Read-only mount")
      })).optional().describe("Volume mounts")
    })).optional().describe("Desired services"),
    desiredVolumes: z.array(z.object({
      name: z.string().describe("Volume name"),
      size: z.string().optional().describe("Volume size")
    })).optional().describe("Desired volumes")
  }),
  
  // Mittwald Container API Service tools
  mittwald_container_list_services: z.object({
    projectId: z.string().describe("Project ID"),
    limit: z.number().int().min(1).max(1000).default(100).optional().describe("Maximum results"),
    skip: z.number().int().min(0).default(0).optional().describe("Results to skip"),
    page: z.number().int().min(1).optional().describe("Page number")
  }),
  
  mittwald_container_get_service: z.object({
    stackId: z.string().describe("Stack ID"),
    serviceId: z.string().describe("Service ID")
  }),
  
  mittwald_container_get_service_logs: z.object({
    stackId: z.string().describe("Stack ID"),
    serviceId: z.string().describe("Service ID"),
    since: z.string().optional().describe("Start time (RFC3339)"),
    until: z.string().optional().describe("End time (RFC3339)"),
    limit: z.number().int().min(1).max(10000).default(100).optional().describe("Maximum log lines")
  }),
  
  mittwald_container_start_service: z.object({
    stackId: z.string().describe("Stack ID"),
    serviceId: z.string().describe("Service ID")
  }),
  
  mittwald_container_stop_service: z.object({
    stackId: z.string().describe("Stack ID"),
    serviceId: z.string().describe("Service ID")
  }),
  
  mittwald_container_restart_service: z.object({
    stackId: z.string().describe("Stack ID"),
    serviceId: z.string().describe("Service ID")
  }),
  
  mittwald_container_recreate_service: z.object({
    stackId: z.string().describe("Stack ID"),
    serviceId: z.string().describe("Service ID")
  }),
  
  mittwald_container_pull_image_for_service: z.object({
    stackId: z.string().describe("Stack ID"),
    serviceId: z.string().describe("Service ID")
  }),
  
  // Mittwald Container API Volume tools
  mittwald_container_list_volumes: z.object({
    projectId: z.string().describe("Project ID"),
    limit: z.number().int().min(1).max(1000).default(100).optional().describe("Maximum results"),
    skip: z.number().int().min(0).default(0).optional().describe("Results to skip"),
    page: z.number().int().min(1).optional().describe("Page number")
  }),
  
  mittwald_container_get_volume: z.object({
    stackId: z.string().describe("Stack ID"),
    volumeId: z.string().describe("Volume ID")
  }),
  
  mittwald_container_delete_volume: z.object({
    stackId: z.string().describe("Stack ID"),
    volumeId: z.string().describe("Volume ID")
  }),
  
  mittwald_container_get_container_image_config: z.object({})
};

/**
 * Type mapping of tool names to their argument types.
 * 
 * @remarks
 * This type ensures type safety when dispatching tool calls
 * to their respective handlers.
 */
type ToolArgs = {
  get_channel: GetChannelArgs;
  get_post: GetPostArgs;
  get_notifications: GetNotificationsArgs;
  search_reddit: SearchRedditArgs;
  get_comment: GetCommentArgs;
  elicitation_example: any; // Example tools use any for flexibility
  sampling_example: any;
  structured_data_example: any;
  mcp_logging: { level: 'debug' | 'info' | 'warning' | 'error'; message: string; data?: any };
  validation_example: any;
  
  // Mittwald Container API types
  mittwald_container_create_registry: any;
  mittwald_container_list_registries: any;
  mittwald_container_get_registry: any;
  mittwald_container_update_registry: any;
  mittwald_container_delete_registry: any;
  mittwald_container_validate_registry_uri: any;
  mittwald_container_validate_registry_credentials: any;
  mittwald_container_list_stacks: any;
  mittwald_container_get_stack: any;
  mittwald_container_update_stack: any;
  mittwald_container_declare_stack: any;
  mittwald_container_list_services: any;
  mittwald_container_get_service: any;
  mittwald_container_get_service_logs: any;
  mittwald_container_start_service: any;
  mittwald_container_stop_service: any;
  mittwald_container_restart_service: any;
  mittwald_container_recreate_service: any;
  mittwald_container_pull_image_for_service: any;
  mittwald_container_list_volumes: any;
  mittwald_container_get_volume: any;
  mittwald_container_delete_volume: any;
  mittwald_container_get_container_image_config: any;
};

/**
 * Handles MCP tool listing requests.
 * 
 * @remarks
 * Returns all available tools sorted alphabetically by name.
 * This allows MCP clients to discover what tools are available
 * for interacting with Reddit.
 * 
 * @param _request - The tool listing request (currently unused)
 * @returns Promise resolving to the list of available tools
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools#listing-tools | Listing Tools}
 */
export async function handleListTools(_request: ListToolsRequest): Promise<ListToolsResult> {
  try {
    logger.info(`🔧 handleListTools called, TOOLS.length: ${TOOLS.length}`);
    const tools = [...TOOLS].sort((a, b) => a.name.localeCompare(b.name));
    logger.info(`✅ Returning ${tools.length} tools: ${tools.map(t => t.name).join(', ')}`);
    return { tools };
  } catch (error) {
    logger.error("Failed to list tools", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { tools: TOOLS };
  }
}

/**
 * Zod schema for validating Reddit credentials from AuthInfo.extra
 */
const RedditCredentialsSchema = z.object({
  redditAccessToken: z.string().min(1, "Reddit access token is required"),
  redditRefreshToken: z.string().min(1, "Reddit refresh token is required"),
  userId: z.string().min(1, "User ID is required"),
});

/**
 * Reddit authentication credentials structure.
 * 
 * @remarks
 * Contains the OAuth tokens and user ID needed to authenticate
 * requests to the Reddit API.
 */
interface RedditCredentials {
  /** OAuth2 access token for API requests */
  accessToken: string;
  /** OAuth2 refresh token for renewing access */
  refreshToken: string;
  /** Reddit user ID */
  userId: string;
}

/**
 * Extracts and validates Reddit credentials from AuthInfo.
 * 
 * @remarks
 * This function ensures that all required authentication data
 * is present before attempting to make Reddit API calls.
 * 
 * @param authInfo - Authentication information from the MCP context
 * @returns Validated Reddit credentials
 * @throws Error if required credentials are missing or invalid
 */
function extractAndValidateCredentials(authInfo: RedditAuthInfo): RedditCredentials {
  if (!authInfo.extra) {
    throw new Error("Authentication failed: Missing auth info");
  }

  try {
    const validated = RedditCredentialsSchema.parse(authInfo.extra);
    return {
      accessToken: validated.redditAccessToken,
      refreshToken: validated.redditRefreshToken,
      userId: validated.userId,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      logger.error("Reddit credentials validation failed", {
        errors: error.errors,
        authInfo: authInfo.extra,
      });
      throw new Error(`Authentication failed: ${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Handles MCP tool invocation requests.
 * 
 * @remarks
 * This is the main dispatcher for tool calls. It:
 * 1. Validates the requested tool exists
 * 2. Extracts and validates authentication credentials
 * 3. Validates tool arguments against the tool's input schema
 * 4. Creates a Reddit service instance
 * 5. Dispatches to the appropriate tool handler
 * 6. Returns the tool result or error
 * 
 * Tools that require content generation (like create_post) will trigger
 * the sampling feature and return an async processing message.
 * 
 * @param request - The tool invocation request containing tool name and arguments
 * @param context - MCP context containing authentication and session information
 * @returns Promise resolving to the tool execution result
 * @throws Error if tool is unknown, auth fails, or execution fails
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools#calling-tools | Calling Tools}
 */
export async function handleToolCall(
  request: CallToolRequest,
  context: MCPToolContext,
): Promise<CallToolResult> {
  
  try {
    logger.info(`🔧 handleToolCall called for tool: ${request.params.name}`);
    // Extract and validate Reddit credentials from AuthInfo
    const credentials = extractAndValidateCredentials(context.authInfo);

    // Create Reddit service with validated tokens
    const redditService = new RedditService({
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      username: credentials.userId, // Pass the Reddit username from OAuth
    });

    const handlerContext: ToolHandlerContext = {
      redditService,
      userId: credentials.userId,
      sessionId: context.sessionId,
      progressToken: request.params._meta?.progressToken,
    };

    if (!request.params.arguments) {
      logger.error("Tool call missing required arguments", { toolName: request.params?.name });
      throw new Error("Arguments are required");
    }

    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      logger.error("Unknown tool requested", { toolName: request.params.name });
      throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }


    // Validate arguments using Zod schema
    const toolName = request.params.name as keyof typeof ToolSchemas;
    const schema = ToolSchemas[toolName];
    
    if (!schema) {
      logger.error("No Zod schema found for tool", { toolName });
      throw new Error(`No validation schema found for tool: ${toolName}`);
    }
    
    let args: ToolArgs[keyof ToolArgs];
    try {
      const validatedArgs = schema.parse(request.params.arguments);
      args = validatedArgs as ToolArgs[keyof ToolArgs];
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error("Tool argument validation failed", { 
          toolName, 
          errors: error.errors,
          arguments: request.params.arguments 
        });
        throw new Error(`Invalid arguments for tool ${toolName}: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }


    let result: CallToolResult;

    switch (request.params.name) {
      case "get_channel":
        result = await handleGetChannel(args as GetChannelArgs, handlerContext);
        break;
      case "get_post":
        result = await handleGetPost(args as GetPostArgs, handlerContext);
        break;
      case "get_notifications":
        result = await handleGetNotifications(args as GetNotificationsArgs, handlerContext);
        break;
      case "get_comment":
        result = await handleGetComment(args as GetCommentArgs, handlerContext);
        break;
      case "search_reddit":
        result = await handleSearchReddit(args as SearchRedditArgs, handlerContext);
        break;
      case "elicitation_example":
        result = await handleElicitationExample(args, context);
        break;
      case "sampling_example":
        result = await handleSamplingExample(args, context);
        break;
      case "structured_data_example":
        result = await handleStructuredDataExample(args, context);
        break;
      case "mcp_logging":
        result = await handleLogging(args, handlerContext);
        break;
      case "validation_example":
        result = await handleValidationExample(args, handlerContext);
        break;
        
      // Mittwald Container API Registry tools
      case "mittwald_container_create_registry":
        result = await handleCreateRegistry(args);
        break;
      case "mittwald_container_list_registries":
        result = await handleListRegistries(args);
        break;
      case "mittwald_container_get_registry":
        result = await handleGetRegistry(args);
        break;
      case "mittwald_container_update_registry":
        result = await handleUpdateRegistry(args);
        break;
      case "mittwald_container_delete_registry":
        result = await handleDeleteRegistry(args);
        break;
      case "mittwald_container_validate_registry_uri":
        result = await handleValidateRegistryUri(args);
        break;
      case "mittwald_container_validate_registry_credentials":
        result = await handleValidateRegistryCredentials(args);
        break;
        
      // Mittwald Container API Stack tools
      case "mittwald_container_list_stacks":
        result = await handleListStacks(args);
        break;
      case "mittwald_container_get_stack":
        result = await handleGetStack(args);
        break;
      case "mittwald_container_update_stack":
        result = await handleUpdateStack(args);
        break;
      case "mittwald_container_declare_stack":
        result = await handleDeclareStack(args);
        break;
        
      // Mittwald Container API Service tools
      case "mittwald_container_list_services":
        result = await handleListServices(args);
        break;
      case "mittwald_container_get_service":
        result = await handleGetService(args);
        break;
      case "mittwald_container_get_service_logs":
        result = await handleGetServiceLogs(args);
        break;
      case "mittwald_container_start_service":
        result = await handleStartService(args);
        break;
      case "mittwald_container_stop_service":
        result = await handleStopService(args);
        break;
      case "mittwald_container_restart_service":
        result = await handleRestartService(args);
        break;
      case "mittwald_container_recreate_service":
        result = await handleRecreateService(args);
        break;
      case "mittwald_container_pull_image_for_service":
        result = await handlePullImageForService(args);
        break;
        
      // Mittwald Container API Volume tools
      case "mittwald_container_list_volumes":
        result = await handleListVolumes(args);
        break;
      case "mittwald_container_get_volume":
        result = await handleGetVolume(args);
        break;
      case "mittwald_container_delete_volume":
        result = await handleDeleteVolume(args);
        break;
      case "mittwald_container_get_container_image_config":
        result = await handleGetContainerImageConfig(args);
        break;
        
      default:
        logger.error("Unsupported tool in switch statement", { toolName: request.params.name });
        throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error("Tool call failed", {
      toolName: request.params?.name,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-throw the error to be handled by MCP framework
    throw error;
  }
}
