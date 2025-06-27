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
import { getMittwaldClient } from '../services/mittwald/index.js';
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
import type {
  MittwaldAppListArgs,
  MittwaldAppGetArgs,
  MittwaldAppListVersionsArgs,
  MittwaldAppGetVersionArgs,
  MittwaldAppGetVersionUpdateCandidatesArgs,
  MittwaldAppInstallationListArgs,
  MittwaldAppInstallationGetArgs,
  MittwaldAppInstallationCreateArgs,
  MittwaldAppInstallationUpdateArgs,
  MittwaldAppInstallationDeleteArgs,
  MittwaldAppInstallationActionArgs,
  MittwaldAppInstallationCopyArgs,
  MittwaldAppInstallationGetStatusArgs,
  MittwaldAppInstallationGetMissingDependenciesArgs,
  MittwaldSystemSoftwareListArgs,
  MittwaldSystemSoftwareGetArgs,
  MittwaldSystemSoftwareListVersionsArgs,
  MittwaldSystemSoftwareGetVersionArgs,
  MittwaldAppInstallationGetSystemSoftwareArgs,
  MittwaldAppInstallationUpdateSystemSoftwareArgs
} from './tools/mittwald/app/index.js';
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
  handleMittwaldAppList,
  handleMittwaldAppGet,
  handleMittwaldAppListVersions,
  handleMittwaldAppGetVersion,
  handleMittwaldAppGetVersionUpdateCandidates,
  handleMittwaldAppInstallationList,
  handleMittwaldAppInstallationGet,
  handleMittwaldAppInstallationCreate,
  handleMittwaldAppInstallationUpdate,
  handleMittwaldAppInstallationDelete,
  handleMittwaldAppInstallationAction,
  handleMittwaldAppInstallationCopy,
  handleMittwaldAppInstallationGetStatus,
  handleMittwaldAppInstallationGetMissingDependencies,
  handleMittwaldSystemSoftwareList,
  handleMittwaldSystemSoftwareGet,
  handleMittwaldSystemSoftwareListVersions,
  handleMittwaldSystemSoftwareGetVersion,
  handleMittwaldAppInstallationGetSystemSoftware,
  handleMittwaldAppInstallationUpdateSystemSoftware,
} from './tools/mittwald/app/index.js';

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

  // Mittwald App API schemas
  mittwald_app_list: z.object({
    limit: z.number().int().min(1).max(1000).optional().default(100).describe("Maximum number of apps to return"),
    skip: z.number().int().min(0).optional().default(0).describe("Number of apps to skip (for pagination)")
  }),

  mittwald_app_get: z.object({
    appId: z.string().uuid().describe("The UUID of the app to retrieve")
  }),

  mittwald_app_list_versions: z.object({
    appId: z.string().uuid().describe("The UUID of the app to list versions for"),
    recommended: z.boolean().optional().default(false).describe("Filter to only show recommended versions")
  }),

  mittwald_app_get_version: z.object({
    appId: z.string().uuid().describe("The UUID of the app"),
    appVersionId: z.string().uuid().describe("The UUID of the app version to retrieve")
  }),

  mittwald_app_get_version_update_candidates: z.object({
    appId: z.string().uuid().describe("The UUID of the app"),
    baseAppVersionId: z.string().uuid().describe("The UUID of the current app version to find updates for")
  }),

  // Mittwald App Installation schemas
  mittwald_app_installation_list: z.object({
    projectId: z.string().uuid().describe("The UUID of the project to list app installations for"),
    limit: z.number().int().min(1).max(1000).optional().default(100).describe("Maximum number of app installations to return"),
    skip: z.number().int().min(0).optional().default(0).describe("Number of app installations to skip (for pagination)")
  }),

  mittwald_app_installation_get: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to retrieve")
  }),

  mittwald_app_installation_create: z.object({
    appId: z.string().uuid().describe("The UUID of the app to install"),
    projectId: z.string().uuid().describe("The UUID of the project to install the app in"),
    description: z.string().min(1).describe("Human-readable description for this app installation"),
    appVersionId: z.string().uuid().optional().describe("The UUID of the specific app version to install"),
    updatePolicy: z.enum(["none", "patchLevel", "all"]).optional().default("patchLevel").describe("Automatic update policy"),
    userInputs: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).optional().describe("Configuration values for app installation")
  }),

  mittwald_app_installation_update: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to update"),
    description: z.string().optional().describe("New description for the app installation"),
    appVersionId: z.string().uuid().optional().describe("The UUID of the app version to update to"),
    updatePolicy: z.enum(["none", "patchLevel", "all"]).optional().describe("New automatic update policy"),
    customDocumentRoot: z.string().optional().describe("Custom document root path"),
    userInputs: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).optional().describe("Updated configuration values")
  }),

  mittwald_app_installation_delete: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to delete")
  }),

  mittwald_app_installation_action: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to perform the action on"),
    action: z.enum(["start", "stop", "restart"]).describe("The action to perform on the app installation")
  }),

  mittwald_app_installation_copy: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to copy"),
    description: z.string().min(1).describe("Description for the new copied app installation"),
    projectId: z.string().uuid().describe("The UUID of the target project to copy the installation to")
  }),

  mittwald_app_installation_get_status: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to get status for")
  }),

  mittwald_app_installation_get_missing_dependencies: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to check dependencies for")
  }),

  // Mittwald System Software schemas
  mittwald_system_software_list: z.object({
    limit: z.number().int().min(1).max(1000).optional().default(100).describe("Maximum number of system software packages to return"),
    skip: z.number().int().min(0).optional().default(0).describe("Number of system software packages to skip")
  }),

  mittwald_system_software_get: z.object({
    systemSoftwareId: z.string().uuid().describe("The UUID of the system software package to retrieve")
  }),

  mittwald_system_software_list_versions: z.object({
    systemSoftwareId: z.string().uuid().describe("The UUID of the system software to list versions for"),
    recommended: z.boolean().optional().default(false).describe("Filter to only show recommended versions")
  }),

  mittwald_system_software_get_version: z.object({
    systemSoftwareId: z.string().uuid().describe("The UUID of the system software"),
    systemSoftwareVersionId: z.string().uuid().describe("The UUID of the system software version to retrieve")
  }),

  mittwald_app_installation_get_system_software: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to get system software for")
  }),

  mittwald_app_installation_update_system_software: z.object({
    appInstallationId: z.string().uuid().describe("The UUID of the app installation to update system software for"),
    systemSoftware: z.array(z.object({
      systemSoftwareId: z.string().uuid(),
      systemSoftwareVersionId: z.string().uuid(),
      updatePolicy: z.enum(["none", "inheritedFromApp", "patchLevel", "all"])
    })).min(1).describe("List of system software to update")
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
  // Mittwald App API tools
  mittwald_app_list: MittwaldAppListArgs;
  mittwald_app_get: MittwaldAppGetArgs;
  mittwald_app_list_versions: MittwaldAppListVersionsArgs;
  mittwald_app_get_version: MittwaldAppGetVersionArgs;
  mittwald_app_get_version_update_candidates: MittwaldAppGetVersionUpdateCandidatesArgs;
  // Mittwald App Installation tools
  mittwald_app_installation_list: MittwaldAppInstallationListArgs;
  mittwald_app_installation_get: MittwaldAppInstallationGetArgs;
  mittwald_app_installation_create: MittwaldAppInstallationCreateArgs;
  mittwald_app_installation_update: MittwaldAppInstallationUpdateArgs;
  mittwald_app_installation_delete: MittwaldAppInstallationDeleteArgs;
  mittwald_app_installation_action: MittwaldAppInstallationActionArgs;
  mittwald_app_installation_copy: MittwaldAppInstallationCopyArgs;
  mittwald_app_installation_get_status: MittwaldAppInstallationGetStatusArgs;
  mittwald_app_installation_get_missing_dependencies: MittwaldAppInstallationGetMissingDependenciesArgs;
  // Mittwald System Software tools
  mittwald_system_software_list: MittwaldSystemSoftwareListArgs;
  mittwald_system_software_get: MittwaldSystemSoftwareGetArgs;
  mittwald_system_software_list_versions: MittwaldSystemSoftwareListVersionsArgs;
  mittwald_system_software_get_version: MittwaldSystemSoftwareGetVersionArgs;
  mittwald_app_installation_get_system_software: MittwaldAppInstallationGetSystemSoftwareArgs;
  mittwald_app_installation_update_system_software: MittwaldAppInstallationUpdateSystemSoftwareArgs;
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
      mittwaldClient: getMittwaldClient(),
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
      
      // Mittwald App API tools
      case "mittwald_app_list":
        result = await handleMittwaldAppList(args as MittwaldAppListArgs, handlerContext);
        break;
      case "mittwald_app_get":
        result = await handleMittwaldAppGet(args as MittwaldAppGetArgs, handlerContext);
        break;
      case "mittwald_app_list_versions":
        result = await handleMittwaldAppListVersions(args as MittwaldAppListVersionsArgs, handlerContext);
        break;
      case "mittwald_app_get_version":
        result = await handleMittwaldAppGetVersion(args as MittwaldAppGetVersionArgs, handlerContext);
        break;
      case "mittwald_app_get_version_update_candidates":
        result = await handleMittwaldAppGetVersionUpdateCandidates(args as MittwaldAppGetVersionUpdateCandidatesArgs, handlerContext);
        break;
      
      // Mittwald App Installation tools
      case "mittwald_app_installation_list":
        result = await handleMittwaldAppInstallationList(args as MittwaldAppInstallationListArgs, handlerContext);
        break;
      case "mittwald_app_installation_get":
        result = await handleMittwaldAppInstallationGet(args as MittwaldAppInstallationGetArgs, handlerContext);
        break;
      case "mittwald_app_installation_create":
        result = await handleMittwaldAppInstallationCreate(args as MittwaldAppInstallationCreateArgs, handlerContext);
        break;
      case "mittwald_app_installation_update":
        result = await handleMittwaldAppInstallationUpdate(args as MittwaldAppInstallationUpdateArgs, handlerContext);
        break;
      case "mittwald_app_installation_delete":
        result = await handleMittwaldAppInstallationDelete(args as MittwaldAppInstallationDeleteArgs, handlerContext);
        break;
      case "mittwald_app_installation_action":
        result = await handleMittwaldAppInstallationAction(args as MittwaldAppInstallationActionArgs, handlerContext);
        break;
      case "mittwald_app_installation_copy":
        result = await handleMittwaldAppInstallationCopy(args as MittwaldAppInstallationCopyArgs, handlerContext);
        break;
      case "mittwald_app_installation_get_status":
        result = await handleMittwaldAppInstallationGetStatus(args as MittwaldAppInstallationGetStatusArgs, handlerContext);
        break;
      case "mittwald_app_installation_get_missing_dependencies":
        result = await handleMittwaldAppInstallationGetMissingDependencies(args as MittwaldAppInstallationGetMissingDependenciesArgs, handlerContext);
        break;
      
      // Mittwald System Software tools
      case "mittwald_system_software_list":
        result = await handleMittwaldSystemSoftwareList(args as MittwaldSystemSoftwareListArgs, handlerContext);
        break;
      case "mittwald_system_software_get":
        result = await handleMittwaldSystemSoftwareGet(args as MittwaldSystemSoftwareGetArgs, handlerContext);
        break;
      case "mittwald_system_software_list_versions":
        result = await handleMittwaldSystemSoftwareListVersions(args as MittwaldSystemSoftwareListVersionsArgs, handlerContext);
        break;
      case "mittwald_system_software_get_version":
        result = await handleMittwaldSystemSoftwareGetVersion(args as MittwaldSystemSoftwareGetVersionArgs, handlerContext);
        break;
      case "mittwald_app_installation_get_system_software":
        result = await handleMittwaldAppInstallationGetSystemSoftware(args as MittwaldAppInstallationGetSystemSoftwareArgs, handlerContext);
        break;
      case "mittwald_app_installation_update_system_software":
        result = await handleMittwaldAppInstallationUpdateSystemSoftware(args as MittwaldAppInstallationUpdateSystemSoftwareArgs, handlerContext);
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
