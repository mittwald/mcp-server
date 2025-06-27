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
import { CONFIG } from '../server/config.js';
import { logger } from '../utils/logger.js';
import type { RedditAuthInfo, MCPToolContext } from '../types/request-context.js';
import type { ToolHandlerContext } from './tools/types.js';
import type { MittwaldToolHandlerContext } from '../types/mittwald/conversation.js';
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

// Mittwald tool handlers
import * as ConversationHandlers from './tools/mittwald/conversation/index.js';
import * as NotificationHandlers from './tools/mittwald/notification/index.js';

// Mittwald tool argument types
import type {
  ConversationListArgs,
  ConversationCreateArgs,
  ConversationGetArgs,
  ConversationUpdateArgs,
  ConversationMessageListArgs,
  ConversationMessageCreateArgs,
  ConversationMessageUpdateArgs,
  ConversationMembersGetArgs,
  ConversationStatusSetArgs,
  ConversationFileUploadRequestArgs,
  ConversationFileAccessTokenArgs,
} from '../types/mittwald/conversation.js';
import type {
  NotificationListArgs,
  NotificationUnreadCountsArgs,
  NotificationMarkAllReadArgs,
  NotificationMarkReadArgs,
} from '../types/mittwald/notification.js';

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

  // Mittwald Conversation API schemas
  mittwald_conversation_list: z.object({
    sort: z.array(z.enum(["createdAt", "lastMessage.createdAt", "title", "priority", "shortId", "conversationId"])).optional(),
    order: z.array(z.enum(["asc", "desc"])).optional()
  }),

  mittwald_conversation_create: z.object({
    categoryId: z.string().describe("The category ID for the conversation"),
    mainUserId: z.string().uuid().describe("UUID of the main user for the conversation"),
    notificationRoles: z.array(z.object({})).describe("Array of notification roles"),
    relatedTo: z.object({}).describe("Reference to related aggregate"),
    sharedWith: z.object({}).describe("Shareable aggregate reference"),
    title: z.string().describe("Title of the conversation")
  }),

  mittwald_conversation_get: z.object({
    conversationId: z.string().uuid().describe("UUID of the conversation to retrieve")
  }),

  mittwald_conversation_update: z.object({
    conversationId: z.string().uuid().describe("UUID of the conversation to update"),
    categoryId: z.string().uuid().optional().describe("New category ID"),
    relatedTo: z.object({}).optional().describe("New related aggregate reference"),
    title: z.string().optional().describe("New title")
  }),

  mittwald_conversation_message_list: z.object({
    conversationId: z.string().uuid().describe("UUID of the conversation")
  }),

  mittwald_conversation_message_create: z.object({
    conversationId: z.string().uuid().describe("UUID of the conversation"),
    messageContent: z.string().max(8000).describe("Message content (max 8000 chars)"),
    fileIds: z.array(z.string().uuid()).optional().describe("Optional file IDs to attach")
  }),

  mittwald_conversation_message_update: z.object({
    conversationId: z.string().uuid().describe("UUID of the conversation"),
    messageId: z.string().uuid().describe("UUID of the message to update"),
    messageContent: z.string().describe("New message content")
  }),

  mittwald_conversation_members_get: z.object({
    conversationId: z.string().uuid().describe("UUID of the conversation")
  }),

  mittwald_conversation_status_set: z.object({
    conversationId: z.string().uuid().describe("UUID of the conversation"),
    status: z.enum(["open", "answered", "closed"]).describe("New conversation status")
  }),

  mittwald_conversation_file_upload_request: z.object({
    conversationId: z.string().uuid().describe("UUID of the conversation")
  }),

  mittwald_conversation_file_access_token: z.object({
    conversationId: z.string().uuid().describe("UUID of the conversation"),
    fileId: z.string().uuid().describe("UUID of the file")
  }),

  // Mittwald Notification API schemas
  mittwald_notification_list: z.object({
    status: z.string().optional().describe("Filter by notification status"),
    limit: z.number().int().positive().optional().describe("Maximum number of notifications"),
    skip: z.number().int().min(0).optional().describe("Number to skip for pagination"),
    page: z.number().int().positive().optional().describe("Page number")
  }),

  mittwald_notification_unread_counts: z.object({}),

  mittwald_notification_mark_all_read: z.object({
    severities: z.array(z.enum(["success", "info", "warning", "error"])).optional().describe("Filter by severities"),
    referenceId: z.string().optional().describe("Filter by reference ID"),
    referenceAggregate: z.string().optional().describe("Filter by reference aggregate"),
    referenceDomain: z.string().optional().describe("Filter by reference domain")
  }),

  mittwald_notification_mark_read: z.object({
    notificationId: z.string().describe("ID of notification to mark as read")
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
  // Mittwald Conversation API tools
  mittwald_conversation_list: ConversationListArgs;
  mittwald_conversation_create: ConversationCreateArgs;
  mittwald_conversation_get: ConversationGetArgs;
  mittwald_conversation_update: ConversationUpdateArgs;
  mittwald_conversation_message_list: ConversationMessageListArgs;
  mittwald_conversation_message_create: ConversationMessageCreateArgs;
  mittwald_conversation_message_update: ConversationMessageUpdateArgs;
  mittwald_conversation_members_get: ConversationMembersGetArgs;
  mittwald_conversation_status_set: ConversationStatusSetArgs;
  mittwald_conversation_file_upload_request: ConversationFileUploadRequestArgs;
  mittwald_conversation_file_access_token: ConversationFileAccessTokenArgs;
  // Mittwald Notification API tools
  mittwald_notification_list: NotificationListArgs;
  mittwald_notification_unread_counts: NotificationUnreadCountsArgs;
  mittwald_notification_mark_all_read: NotificationMarkAllReadArgs;
  mittwald_notification_mark_read: NotificationMarkReadArgs;
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

    // Create Mittwald client context for Mittwald tools
    const mittwaldClient = getMittwaldClient(CONFIG.MITTWALD_API_TOKEN);
    const mittwaldHandlerContext: MittwaldToolHandlerContext = {
      mittwaldClient,
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
      
      // Mittwald Conversation API cases
      case "mittwald_conversation_list":
        result = await ConversationHandlers.handleMittwaldConversationList(args as ConversationListArgs, mittwaldHandlerContext);
        break;
      case "mittwald_conversation_create":
        result = await ConversationHandlers.handleMittwaldConversationCreate(args as ConversationCreateArgs, mittwaldHandlerContext);
        break;
      case "mittwald_conversation_get":
        result = await ConversationHandlers.handleMittwaldConversationGet(args as ConversationGetArgs, mittwaldHandlerContext);
        break;
      case "mittwald_conversation_update":
        result = await ConversationHandlers.handleMittwaldConversationUpdate(args as ConversationUpdateArgs, mittwaldHandlerContext);
        break;
      case "mittwald_conversation_message_list":
        result = await ConversationHandlers.handleMittwaldConversationMessageList(args as ConversationMessageListArgs, mittwaldHandlerContext);
        break;
      case "mittwald_conversation_message_create":
        result = await ConversationHandlers.handleMittwaldConversationMessageCreate(args as ConversationMessageCreateArgs, mittwaldHandlerContext);
        break;
      case "mittwald_conversation_message_update":
        result = await ConversationHandlers.handleMittwaldConversationMessageUpdate(args as ConversationMessageUpdateArgs, mittwaldHandlerContext);
        break;
      case "mittwald_conversation_members_get":
        result = await ConversationHandlers.handleMittwaldConversationMembersGet(args as ConversationMembersGetArgs, mittwaldHandlerContext);
        break;
      case "mittwald_conversation_status_set":
        result = await ConversationHandlers.handleMittwaldConversationStatusSet(args as ConversationStatusSetArgs, mittwaldHandlerContext);
        break;
      case "mittwald_conversation_file_upload_request":
        result = await ConversationHandlers.handleMittwaldConversationFileUploadRequest(args as ConversationFileUploadRequestArgs, mittwaldHandlerContext);
        break;
      case "mittwald_conversation_file_access_token":
        result = await ConversationHandlers.handleMittwaldConversationFileAccessToken(args as ConversationFileAccessTokenArgs, mittwaldHandlerContext);
        break;
      
      // Mittwald Notification API cases
      case "mittwald_notification_list":
        result = await NotificationHandlers.handleMittwaldNotificationList(args as NotificationListArgs, mittwaldHandlerContext);
        break;
      case "mittwald_notification_unread_counts":
        result = await NotificationHandlers.handleMittwaldNotificationUnreadCounts(args as NotificationUnreadCountsArgs, mittwaldHandlerContext);
        break;
      case "mittwald_notification_mark_all_read":
        result = await NotificationHandlers.handleMittwaldNotificationMarkAllRead(args as NotificationMarkAllReadArgs, mittwaldHandlerContext);
        break;
      case "mittwald_notification_mark_read":
        result = await NotificationHandlers.handleMittwaldNotificationMarkRead(args as NotificationMarkReadArgs, mittwaldHandlerContext);
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
