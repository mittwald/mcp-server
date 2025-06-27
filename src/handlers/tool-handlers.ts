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

// Import all Mittwald handlers and types
import {
  // Cronjob handlers and types
  handleMittwaldCronjobList,
  handleMittwaldCronjobCreate,
  handleMittwaldCronjobGet,
  handleMittwaldCronjobUpdate,
  handleMittwaldCronjobDelete,
  handleMittwaldCronjobUpdateAppId,
  handleMittwaldCronjobTrigger,
  handleMittwaldCronjobListExecutions,
  handleMittwaldCronjobGetExecution,
  handleMittwaldCronjobAbortExecution,
  type MittwaldCronjobListArgs,
  type MittwaldCronjobCreateArgs,
  type MittwaldCronjobGetArgs,
  type MittwaldCronjobUpdateArgs,
  type MittwaldCronjobDeleteArgs,
  type MittwaldCronjobUpdateAppIdArgs,
  type MittwaldCronjobTriggerArgs,
  type MittwaldCronjobListExecutionsArgs,
  type MittwaldCronjobGetExecutionArgs,
  type MittwaldCronjobAbortExecutionArgs,
  // Filesystem handlers and types
  handleMittwaldFilesystemListDirectories,
  handleMittwaldFilesystemGetDiskUsage,
  handleMittwaldFilesystemGetFileContent,
  handleMittwaldFilesystemGetJWT,
  handleMittwaldFilesystemListFiles,
  type MittwaldFilesystemListDirectoriesArgs,
  type MittwaldFilesystemGetDiskUsageArgs,
  type MittwaldFilesystemGetFileContentArgs,
  type MittwaldFilesystemGetJWTArgs,
  type MittwaldFilesystemListFilesArgs,
  // File handlers and types
  handleMittwaldFileCreate,
  handleMittwaldFileGetMeta,
  handleMittwaldFileGet,
  handleMittwaldFileGetWithName,
  handleMittwaldFileGetUploadTokenRules,
  handleMittwaldFileGetUploadTypeRules,
  handleMittwaldConversationRequestFileUpload,
  handleMittwaldConversationGetFileAccessToken,
  handleMittwaldInvoiceGetFileAccessToken,
  handleMittwaldDeprecatedFileGetTokenRules,
  handleMittwaldDeprecatedFileGetTypeRules,
  type MittwaldFileCreateArgs,
  type MittwaldFileGetMetaArgs,
  type MittwaldFileGetArgs,
  type MittwaldFileGetWithNameArgs,
  type MittwaldFileGetUploadTokenRulesArgs,
  type MittwaldFileGetUploadTypeRulesArgs,
  type MittwaldConversationRequestFileUploadArgs,
  type MittwaldConversationGetFileAccessTokenArgs,
  type MittwaldInvoiceGetFileAccessTokenArgs,
  type MittwaldDeprecatedFileGetTokenRulesArgs,
  type MittwaldDeprecatedFileGetTypeRulesArgs
} from './tools/mittwald/index.js';

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

  // Mittwald Cronjob schemas
  mittwald_cronjob_list: z.object({
    projectId: z.string().describe("The unique identifier of the project")
  }),
  
  mittwald_cronjob_create: z.object({
    projectId: z.string().describe("The unique identifier of the project"),
    schedule: z.string().describe("Cron expression defining when the job should run"),
    command: z.string().describe("The command to execute"),
    description: z.string().optional().describe("Optional description of what the cronjob does"),
    appId: z.string().optional().describe("Optional app ID to associate with the cronjob")
  }),

  mittwald_cronjob_get: z.object({
    cronjobId: z.string().describe("The unique identifier of the cronjob")
  }),

  mittwald_cronjob_update: z.object({
    cronjobId: z.string().describe("The unique identifier of the cronjob"),
    schedule: z.string().optional().describe("Cron expression defining when the job should run"),
    command: z.string().optional().describe("The command to execute"),
    description: z.string().optional().describe("Description of what the cronjob does"),
    enabled: z.boolean().optional().describe("Whether the cronjob is enabled or disabled")
  }),

  mittwald_cronjob_delete: z.object({
    cronjobId: z.string().describe("The unique identifier of the cronjob")
  }),

  mittwald_cronjob_update_app_id: z.object({
    cronjobId: z.string().describe("The unique identifier of the cronjob"),
    appId: z.string().describe("The app ID to associate with the cronjob")
  }),

  mittwald_cronjob_trigger: z.object({
    cronjobId: z.string().describe("The unique identifier of the cronjob")
  }),

  mittwald_cronjob_list_executions: z.object({
    cronjobId: z.string().describe("The unique identifier of the cronjob")
  }),

  mittwald_cronjob_get_execution: z.object({
    cronjobId: z.string().describe("The unique identifier of the cronjob"),
    executionId: z.string().describe("The unique identifier of the execution")
  }),

  mittwald_cronjob_abort_execution: z.object({
    cronjobId: z.string().describe("The unique identifier of the cronjob"),
    executionId: z.string().describe("The unique identifier of the execution")
  }),

  // Mittwald Filesystem schemas
  mittwald_filesystem_list_directories: z.object({
    projectId: z.string().describe("The unique identifier of the project"),
    path: z.string().optional().describe("Optional path to list directories from")
  }),

  mittwald_filesystem_get_disk_usage: z.object({
    projectId: z.string().describe("The unique identifier of the project"),
    path: z.string().optional().describe("Optional specific directory path to get usage for")
  }),

  mittwald_filesystem_get_file_content: z.object({
    projectId: z.string().describe("The unique identifier of the project"),
    filePath: z.string().describe("Full path to the file to retrieve content from")
  }),

  mittwald_filesystem_get_jwt: z.object({
    projectId: z.string().describe("The unique identifier of the project")
  }),

  mittwald_filesystem_list_files: z.object({
    projectId: z.string().describe("The unique identifier of the project"),
    path: z.string().optional().describe("Optional path to list files from"),
    recursive: z.boolean().optional().describe("Whether to list files recursively in subdirectories")
  }),

  // Mittwald File schemas
  mittwald_file_create: z.object({
    content: z.string().describe("The file content (base64 encoded for binary files)"),
    filename: z.string().describe("The name of the file to create"),
    contentType: z.string().optional().describe("MIME type of the file")
  }),

  mittwald_file_get_meta: z.object({
    fileId: z.string().describe("The unique identifier of the file")
  }),

  mittwald_file_get: z.object({
    fileId: z.string().describe("The unique identifier of the file")
  }),

  mittwald_file_get_with_name: z.object({
    fileId: z.string().describe("The unique identifier of the file"),
    fileName: z.string().describe("The filename to use in the URL")
  }),

  mittwald_file_get_upload_token_rules: z.object({
    fileUploadToken: z.string().describe("The file upload token to get rules for")
  }),

  mittwald_file_get_upload_type_rules: z.object({
    fileUploadType: z.string().describe("The file upload type to get rules for")
  }),

  mittwald_conversation_request_file_upload: z.object({
    conversationId: z.string().describe("The unique identifier of the conversation"),
    filename: z.string().describe("The name of the file to upload"),
    contentType: z.string().optional().describe("MIME type of the file")
  }),

  mittwald_conversation_get_file_access_token: z.object({
    conversationId: z.string().describe("The unique identifier of the conversation"),
    fileId: z.string().describe("The unique identifier of the file")
  }),

  mittwald_invoice_get_file_access_token: z.object({
    customerId: z.string().describe("The unique identifier of the customer"),
    invoiceId: z.string().describe("The unique identifier of the invoice")
  }),

  mittwald_deprecated_file_get_token_rules: z.object({
    token: z.string().describe("The deprecated file token to get rules for")
  }),

  mittwald_deprecated_file_get_type_rules: z.object({
    name: z.string().describe("The deprecated file type name to get rules for")
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
  
  // Mittwald Cronjob tools
  mittwald_cronjob_list: MittwaldCronjobListArgs;
  mittwald_cronjob_create: MittwaldCronjobCreateArgs;
  mittwald_cronjob_get: MittwaldCronjobGetArgs;
  mittwald_cronjob_update: MittwaldCronjobUpdateArgs;
  mittwald_cronjob_delete: MittwaldCronjobDeleteArgs;
  mittwald_cronjob_update_app_id: MittwaldCronjobUpdateAppIdArgs;
  mittwald_cronjob_trigger: MittwaldCronjobTriggerArgs;
  mittwald_cronjob_list_executions: MittwaldCronjobListExecutionsArgs;
  mittwald_cronjob_get_execution: MittwaldCronjobGetExecutionArgs;
  mittwald_cronjob_abort_execution: MittwaldCronjobAbortExecutionArgs;
  
  // Mittwald Filesystem tools
  mittwald_filesystem_list_directories: MittwaldFilesystemListDirectoriesArgs;
  mittwald_filesystem_get_disk_usage: MittwaldFilesystemGetDiskUsageArgs;
  mittwald_filesystem_get_file_content: MittwaldFilesystemGetFileContentArgs;
  mittwald_filesystem_get_jwt: MittwaldFilesystemGetJWTArgs;
  mittwald_filesystem_list_files: MittwaldFilesystemListFilesArgs;
  
  // Mittwald File tools
  mittwald_file_create: MittwaldFileCreateArgs;
  mittwald_file_get_meta: MittwaldFileGetMetaArgs;
  mittwald_file_get: MittwaldFileGetArgs;
  mittwald_file_get_with_name: MittwaldFileGetWithNameArgs;
  mittwald_file_get_upload_token_rules: MittwaldFileGetUploadTokenRulesArgs;
  mittwald_file_get_upload_type_rules: MittwaldFileGetUploadTypeRulesArgs;
  mittwald_conversation_request_file_upload: MittwaldConversationRequestFileUploadArgs;
  mittwald_conversation_get_file_access_token: MittwaldConversationGetFileAccessTokenArgs;
  mittwald_invoice_get_file_access_token: MittwaldInvoiceGetFileAccessTokenArgs;
  mittwald_deprecated_file_get_token_rules: MittwaldDeprecatedFileGetTokenRulesArgs;
  mittwald_deprecated_file_get_type_rules: MittwaldDeprecatedFileGetTypeRulesArgs;
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
        
      // Mittwald Cronjob cases
      case "mittwald_cronjob_list":
        result = await handleMittwaldCronjobList(args as MittwaldCronjobListArgs, handlerContext);
        break;
      case "mittwald_cronjob_create":
        result = await handleMittwaldCronjobCreate(args as MittwaldCronjobCreateArgs, handlerContext);
        break;
      case "mittwald_cronjob_get":
        result = await handleMittwaldCronjobGet(args as MittwaldCronjobGetArgs, handlerContext);
        break;
      case "mittwald_cronjob_update":
        result = await handleMittwaldCronjobUpdate(args as MittwaldCronjobUpdateArgs, handlerContext);
        break;
      case "mittwald_cronjob_delete":
        result = await handleMittwaldCronjobDelete(args as MittwaldCronjobDeleteArgs, handlerContext);
        break;
      case "mittwald_cronjob_update_app_id":
        result = await handleMittwaldCronjobUpdateAppId(args as MittwaldCronjobUpdateAppIdArgs, handlerContext);
        break;
      case "mittwald_cronjob_trigger":
        result = await handleMittwaldCronjobTrigger(args as MittwaldCronjobTriggerArgs, handlerContext);
        break;
      case "mittwald_cronjob_list_executions":
        result = await handleMittwaldCronjobListExecutions(args as MittwaldCronjobListExecutionsArgs, handlerContext);
        break;
      case "mittwald_cronjob_get_execution":
        result = await handleMittwaldCronjobGetExecution(args as MittwaldCronjobGetExecutionArgs, handlerContext);
        break;
      case "mittwald_cronjob_abort_execution":
        result = await handleMittwaldCronjobAbortExecution(args as MittwaldCronjobAbortExecutionArgs, handlerContext);
        break;
        
      // Mittwald Filesystem cases
      case "mittwald_filesystem_list_directories":
        result = await handleMittwaldFilesystemListDirectories(args as MittwaldFilesystemListDirectoriesArgs, handlerContext);
        break;
      case "mittwald_filesystem_get_disk_usage":
        result = await handleMittwaldFilesystemGetDiskUsage(args as MittwaldFilesystemGetDiskUsageArgs, handlerContext);
        break;
      case "mittwald_filesystem_get_file_content":
        result = await handleMittwaldFilesystemGetFileContent(args as MittwaldFilesystemGetFileContentArgs, handlerContext);
        break;
      case "mittwald_filesystem_get_jwt":
        result = await handleMittwaldFilesystemGetJWT(args as MittwaldFilesystemGetJWTArgs, handlerContext);
        break;
      case "mittwald_filesystem_list_files":
        result = await handleMittwaldFilesystemListFiles(args as MittwaldFilesystemListFilesArgs, handlerContext);
        break;
        
      // Mittwald File cases
      case "mittwald_file_create":
        result = await handleMittwaldFileCreate(args as MittwaldFileCreateArgs, handlerContext);
        break;
      case "mittwald_file_get_meta":
        result = await handleMittwaldFileGetMeta(args as MittwaldFileGetMetaArgs, handlerContext);
        break;
      case "mittwald_file_get":
        result = await handleMittwaldFileGet(args as MittwaldFileGetArgs, handlerContext);
        break;
      case "mittwald_file_get_with_name":
        result = await handleMittwaldFileGetWithName(args as MittwaldFileGetWithNameArgs, handlerContext);
        break;
      case "mittwald_file_get_upload_token_rules":
        result = await handleMittwaldFileGetUploadTokenRules(args as MittwaldFileGetUploadTokenRulesArgs, handlerContext);
        break;
      case "mittwald_file_get_upload_type_rules":
        result = await handleMittwaldFileGetUploadTypeRules(args as MittwaldFileGetUploadTypeRulesArgs, handlerContext);
        break;
      case "mittwald_conversation_request_file_upload":
        result = await handleMittwaldConversationRequestFileUpload(args as MittwaldConversationRequestFileUploadArgs, handlerContext);
        break;
      case "mittwald_conversation_get_file_access_token":
        result = await handleMittwaldConversationGetFileAccessToken(args as MittwaldConversationGetFileAccessTokenArgs, handlerContext);
        break;
      case "mittwald_invoice_get_file_access_token":
        result = await handleMittwaldInvoiceGetFileAccessToken(args as MittwaldInvoiceGetFileAccessTokenArgs, handlerContext);
        break;
      case "mittwald_deprecated_file_get_token_rules":
        result = await handleMittwaldDeprecatedFileGetTokenRules(args as MittwaldDeprecatedFileGetTokenRulesArgs, handlerContext);
        break;
      case "mittwald_deprecated_file_get_type_rules":
        result = await handleMittwaldDeprecatedFileGetTypeRules(args as MittwaldDeprecatedFileGetTypeRulesArgs, handlerContext);
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
