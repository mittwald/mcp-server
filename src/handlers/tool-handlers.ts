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

import {
  handleMySQLDatabaseList,
  handleMySQLDatabaseCreate,
  handleMySQLDatabaseGet,
  handleMySQLDatabaseDelete,
  handleMySQLDatabaseUpdateDescription,
  handleMySQLDatabaseUpdateCharset,
  handleMySQLUserList,
  handleMySQLUserCreate,
  handleMySQLUserGet,
  handleMySQLUserUpdate,
  handleMySQLUserDelete,
  handleMySQLUserUpdatePassword,
  handleMySQLUserEnable,
  handleMySQLUserDisable,
  handleMySQLUserGetPhpMyAdminUrl,
  handleRedisDatabaseList,
  handleRedisDatabaseCreate,
  handleRedisDatabaseGet,
  handleRedisDatabaseDelete,
  handleRedisDatabaseUpdateDescription,
  handleRedisDatabaseUpdateConfiguration,
  handleRedisGetVersions,
  handleAppDatabaseUpdate,
  handleAppDatabaseReplace,
  handleAppDatabaseLink,
  handleAppDatabaseUnlink,
  handleAppDatabaseSetUsers
} from './tools/mittwald/database/index.js';

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

  // Mittwald MySQL Database Tools
  mittwald_mysql_database_list: z.object({
    projectId: z.string().describe("The project ID to list databases for"),
    limit: z.number().optional().describe("Maximum number of results"),
    skip: z.number().optional().describe("Number of results to skip")
  }),

  mittwald_mysql_database_create: z.object({
    projectId: z.string().describe("The project ID to create the database in"),
    description: z.string().describe("Description for the database"),
    characterSettings: z.object({
      collation: z.string().optional().describe("Database collation"),
      characterSet: z.string().optional().describe("Database character set")
    }).optional(),
    version: z.string().optional().describe("MySQL version to use")
  }),

  mittwald_mysql_database_get: z.object({
    mysqlDatabaseId: z.string().describe("The MySQL database ID")
  }),

  mittwald_mysql_database_delete: z.object({
    mysqlDatabaseId: z.string().describe("The MySQL database ID to delete")
  }),

  mittwald_mysql_database_update_description: z.object({
    mysqlDatabaseId: z.string().describe("The MySQL database ID"),
    description: z.string().describe("New description for the database")
  }),

  mittwald_mysql_database_update_charset: z.object({
    mysqlDatabaseId: z.string().describe("The MySQL database ID"),
    defaultCharacterSet: z.string().describe("New default character set"),
    defaultCollation: z.string().describe("New default collation")
  }),

  // Mittwald MySQL User Tools
  mittwald_mysql_user_list: z.object({
    mysqlDatabaseId: z.string().describe("The MySQL database ID to list users for"),
    limit: z.number().optional().describe("Maximum number of results"),
    skip: z.number().optional().describe("Number of results to skip")
  }),

  mittwald_mysql_user_create: z.object({
    mysqlDatabaseId: z.string().describe("The MySQL database ID to create the user for"),
    description: z.string().describe("Description for the user"),
    password: z.string().describe("Password for the new user"),
    accessLevel: z.enum(["full", "readonly"]).optional().describe("Access level for the user"),
    accessIpMask: z.string().optional().describe("IP mask for access restriction"),
    externalAccess: z.boolean().optional().describe("Whether to allow external access")
  }),

  mittwald_mysql_user_get: z.object({
    mysqlUserId: z.string().describe("The MySQL user ID")
  }),

  mittwald_mysql_user_update: z.object({
    mysqlUserId: z.string().describe("The MySQL user ID"),
    description: z.string().optional().describe("New description for the user"),
    accessLevel: z.enum(["full", "readonly"]).optional().describe("New access level"),
    accessIpMask: z.string().optional().describe("New IP mask for access restriction")
  }),

  mittwald_mysql_user_delete: z.object({
    mysqlUserId: z.string().describe("The MySQL user ID to delete")
  }),

  mittwald_mysql_user_update_password: z.object({
    mysqlUserId: z.string().describe("The MySQL user ID"),
    password: z.string().describe("New password for the user")
  }),

  mittwald_mysql_user_enable: z.object({
    mysqlUserId: z.string().describe("The MySQL user ID to enable")
  }),

  mittwald_mysql_user_disable: z.object({
    mysqlUserId: z.string().describe("The MySQL user ID to disable")
  }),

  mittwald_mysql_user_get_phpmyadmin_url: z.object({
    mysqlUserId: z.string().describe("The MySQL user ID")
  }),

  // Mittwald Redis Database Tools
  mittwald_redis_database_list: z.object({
    projectId: z.string().describe("The project ID to list databases for"),
    limit: z.number().optional().describe("Maximum number of results"),
    skip: z.number().optional().describe("Number of results to skip")
  }),

  mittwald_redis_database_create: z.object({
    projectId: z.string().describe("The project ID to create the database in"),
    description: z.string().describe("Description for the database"),
    version: z.string().optional().describe("Redis version to use"),
    configuration: z.object({
      maxmemoryPolicy: z.enum(["noeviction", "allkeys-lru", "volatile-lru", "allkeys-random", "volatile-random", "volatile-ttl"]).optional(),
      maxMemory: z.string().optional().describe("Maximum memory limit")
    }).optional()
  }),

  mittwald_redis_database_get: z.object({
    redisDatabaseId: z.string().describe("The Redis database ID")
  }),

  mittwald_redis_database_delete: z.object({
    redisDatabaseId: z.string().describe("The Redis database ID to delete")
  }),

  mittwald_redis_database_update_description: z.object({
    redisDatabaseId: z.string().describe("The Redis database ID"),
    description: z.string().describe("New description for the database")
  }),

  mittwald_redis_database_update_configuration: z.object({
    redisDatabaseId: z.string().describe("The Redis database ID"),
    configuration: z.object({
      maxmemoryPolicy: z.enum(["noeviction", "allkeys-lru", "volatile-lru", "allkeys-random", "volatile-random", "volatile-ttl"]).optional(),
      maxMemory: z.string().optional().describe("Maximum memory limit"),
      persistentStorage: z.boolean().optional().describe("Enable persistent storage")
    }).describe("Redis configuration options to update")
  }),

  mittwald_redis_get_versions: z.object({}),

  // Mittwald App Database Tools
  mittwald_app_database_update: z.object({
    appInstallationId: z.string().describe("The app installation ID"),
    updateKind: z.enum(["update", "replace", "unlink", "link"]).describe("The kind of update operation"),
    mysqlDatabaseId: z.string().optional().describe("The MySQL database ID to link"),
    mysqlUserId: z.string().optional().describe("The MySQL user ID to use"),
    purpose: z.string().optional().describe("The purpose of the database connection")
  }),

  mittwald_app_database_replace: z.object({
    appInstallationId: z.string().describe("The app installation ID"),
    mysqlDatabaseId: z.string().describe("The new MySQL database ID"),
    mysqlUserId: z.string().describe("The MySQL user ID to use")
  }),

  mittwald_app_database_link: z.object({
    appInstallationId: z.string().describe("The app installation ID"),
    databaseId: z.string().describe("The database ID to link"),
    databaseKind: z.enum(["mysql", "redis"]).describe("The kind of database")
  }),

  mittwald_app_database_unlink: z.object({
    appInstallationId: z.string().describe("The app installation ID"),
    databaseId: z.string().describe("The database ID to unlink"),
    databaseKind: z.enum(["mysql", "redis"]).describe("The kind of database")
  }),

  mittwald_app_database_set_users: z.object({
    appInstallationId: z.string().describe("The app installation ID"),
    databaseId: z.string().describe("The database ID"),
    userIds: z.array(z.string()).describe("Array of database user IDs to set")
  })
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
    
    // Check if this is a Mittwald tool (skip Reddit auth)
    const isMittwaldTool = request.params.name.startsWith('mittwald_');
    
    let handlerContext: ToolHandlerContext;
    
    if (isMittwaldTool) {
      // For Mittwald tools, create a minimal context without Reddit service
      handlerContext = {
        redditService: null as any, // Not used for Mittwald tools
        userId: 'mittwald-user',
        sessionId: context.sessionId,
        progressToken: request.params._meta?.progressToken,
      };
    } else {
      // Extract and validate Reddit credentials from AuthInfo for Reddit tools
      const credentials = extractAndValidateCredentials(context.authInfo);

      // Create Reddit service with validated tokens
      const redditService = new RedditService({
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        username: credentials.userId, // Pass the Reddit username from OAuth
      });

      handlerContext = {
        redditService,
        userId: credentials.userId,
        sessionId: context.sessionId,
        progressToken: request.params._meta?.progressToken,
      };
    }

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
      
      // Mittwald MySQL Database Tools
      case "mittwald_mysql_database_list":
        result = await handleMySQLDatabaseList(args);
        break;
      case "mittwald_mysql_database_create":
        result = await handleMySQLDatabaseCreate(args);
        break;
      case "mittwald_mysql_database_get":
        result = await handleMySQLDatabaseGet(args);
        break;
      case "mittwald_mysql_database_delete":
        result = await handleMySQLDatabaseDelete(args);
        break;
      case "mittwald_mysql_database_update_description":
        result = await handleMySQLDatabaseUpdateDescription(args);
        break;
      case "mittwald_mysql_database_update_charset":
        result = await handleMySQLDatabaseUpdateCharset(args);
        break;
      
      // Mittwald MySQL User Tools
      case "mittwald_mysql_user_list":
        result = await handleMySQLUserList(args);
        break;
      case "mittwald_mysql_user_create":
        result = await handleMySQLUserCreate(args);
        break;
      case "mittwald_mysql_user_get":
        result = await handleMySQLUserGet(args);
        break;
      case "mittwald_mysql_user_update":
        result = await handleMySQLUserUpdate(args);
        break;
      case "mittwald_mysql_user_delete":
        result = await handleMySQLUserDelete(args);
        break;
      case "mittwald_mysql_user_update_password":
        result = await handleMySQLUserUpdatePassword(args);
        break;
      case "mittwald_mysql_user_enable":
        result = await handleMySQLUserEnable(args);
        break;
      case "mittwald_mysql_user_disable":
        result = await handleMySQLUserDisable(args);
        break;
      case "mittwald_mysql_user_get_phpmyadmin_url":
        result = await handleMySQLUserGetPhpMyAdminUrl(args);
        break;
      
      // Mittwald Redis Database Tools
      case "mittwald_redis_database_list":
        result = await handleRedisDatabaseList(args);
        break;
      case "mittwald_redis_database_create":
        result = await handleRedisDatabaseCreate(args);
        break;
      case "mittwald_redis_database_get":
        result = await handleRedisDatabaseGet(args);
        break;
      case "mittwald_redis_database_delete":
        result = await handleRedisDatabaseDelete(args);
        break;
      case "mittwald_redis_database_update_description":
        result = await handleRedisDatabaseUpdateDescription(args);
        break;
      case "mittwald_redis_database_update_configuration":
        result = await handleRedisDatabaseUpdateConfiguration(args);
        break;
      case "mittwald_redis_get_versions":
        result = await handleRedisGetVersions();
        break;
      
      // Mittwald App Database Tools
      case "mittwald_app_database_update":
        result = await handleAppDatabaseUpdate(args);
        break;
      case "mittwald_app_database_replace":
        result = await handleAppDatabaseReplace(args);
        break;
      case "mittwald_app_database_link":
        result = await handleAppDatabaseLink(args);
        break;
      case "mittwald_app_database_unlink":
        result = await handleAppDatabaseUnlink(args);
        break;
      case "mittwald_app_database_set_users":
        result = await handleAppDatabaseSetUsers(args);
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
