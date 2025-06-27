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
  ListSshKeysArgs,
  CreateSshKeyArgs,
  GetSshKeyArgs,
  UpdateSshKeyArgs,
  DeleteSshKeyArgs,
  ListSshUsersArgs,
  CreateSshUserArgs,
  GetSshUserArgs,
  UpdateSshUserArgs,
  DeleteSshUserArgs,
  ListSftpUsersArgs,
  CreateSftpUserArgs,
  GetSftpUserArgs,
  UpdateSftpUserArgs,
  DeleteSftpUserArgs,
  ListBackupsArgs,
  CreateBackupArgs,
  GetBackupArgs,
  DeleteBackupArgs,
  UpdateBackupDescriptionArgs,
  CreateBackupExportArgs,
  DeleteBackupExportArgs,
  ListBackupSchedulesArgs,
  CreateBackupScheduleArgs,
  GetBackupScheduleArgs,
  UpdateBackupScheduleArgs,
  DeleteBackupScheduleArgs,
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
  handleListSshKeys,
  handleCreateSshKey,
  handleGetSshKey,
  handleUpdateSshKey,
  handleDeleteSshKey,
  handleListSshUsers,
  handleCreateSshUser,
  handleGetSshUser,
  handleUpdateSshUser,
  handleDeleteSshUser,
  handleListSftpUsers,
  handleCreateSftpUser,
  handleGetSftpUser,
  handleUpdateSftpUser,
  handleDeleteSftpUser,
  handleListBackups,
  handleCreateBackup,
  handleGetBackup,
  handleDeleteBackup,
  handleUpdateBackupDescription,
  handleCreateBackupExport,
  handleDeleteBackupExport,
  handleListBackupSchedules,
  handleCreateBackupSchedule,
  handleGetBackupSchedule,
  handleUpdateBackupSchedule,
  handleDeleteBackupSchedule,
} from './tools/index.js';

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

  // Mittwald SSH Key tools
  mittwald_list_ssh_keys: z.object({}),
  
  mittwald_create_ssh_key: z.object({
    label: z.string().describe("A descriptive label for the SSH key"),
    publicKey: z.string().describe("The public key content (OpenSSH format)"),
    expiresAt: z.string().optional().describe("Optional expiration date for the SSH key (ISO 8601 format)")
  }),
  
  mittwald_get_ssh_key: z.object({
    sshKeyId: z.string().describe("The unique identifier of the SSH key")
  }),
  
  mittwald_update_ssh_key: z.object({
    sshKeyId: z.string().describe("The unique identifier of the SSH key"),
    label: z.string().optional().describe("New label for the SSH key"),
    expiresAt: z.string().optional().describe("New expiration date for the SSH key (ISO 8601 format)")
  }),
  
  mittwald_delete_ssh_key: z.object({
    sshKeyId: z.string().describe("The unique identifier of the SSH key to delete")
  }),

  // Mittwald SSH User tools
  mittwald_list_ssh_users: z.object({
    projectId: z.string().describe("The unique identifier of the project")
  }),
  
  mittwald_create_ssh_user: z.object({
    projectId: z.string().describe("The unique identifier of the project"),
    username: z.string().describe("The username for the SSH user"),
    description: z.string().optional().describe("Optional description for the SSH user"),
    publicKeys: z.array(z.string()).optional().describe("Array of SSH public key IDs to associate with this user")
  }),
  
  mittwald_get_ssh_user: z.object({
    sshUserId: z.string().describe("The unique identifier of the SSH user")
  }),
  
  mittwald_update_ssh_user: z.object({
    sshUserId: z.string().describe("The unique identifier of the SSH user"),
    description: z.string().optional().describe("New description for the SSH user"),
    publicKeys: z.array(z.string()).optional().describe("Array of SSH public key IDs to associate with this user"),
    status: z.enum(["active", "inactive"]).optional().describe("Status of the SSH user")
  }),
  
  mittwald_delete_ssh_user: z.object({
    sshUserId: z.string().describe("The unique identifier of the SSH user to delete")
  }),

  // Mittwald SFTP User tools
  mittwald_list_sftp_users: z.object({
    projectId: z.string().describe("The unique identifier of the project")
  }),
  
  mittwald_create_sftp_user: z.object({
    projectId: z.string().describe("The unique identifier of the project"),
    username: z.string().describe("The username for the SFTP user"),
    description: z.string().optional().describe("Optional description for the SFTP user"),
    password: z.string().optional().describe("Password for the SFTP user (if not provided, one will be generated)")
  }),
  
  mittwald_get_sftp_user: z.object({
    sftpUserId: z.string().describe("The unique identifier of the SFTP user")
  }),
  
  mittwald_update_sftp_user: z.object({
    sftpUserId: z.string().describe("The unique identifier of the SFTP user"),
    description: z.string().optional().describe("New description for the SFTP user"),
    password: z.string().optional().describe("New password for the SFTP user"),
    status: z.enum(["active", "inactive"]).optional().describe("Status of the SFTP user")
  }),
  
  mittwald_delete_sftp_user: z.object({
    sftpUserId: z.string().describe("The unique identifier of the SFTP user to delete")
  }),

  // Mittwald Backup tools
  mittwald_list_backups: z.object({
    projectId: z.string().describe("The unique identifier of the project"),
    sort: z.enum(["oldestFirst", "newestFirst"]).optional().describe("Sort order for the backup list"),
    limit: z.number().optional().describe("Maximum number of backups to return"),
    offset: z.number().optional().describe("Number of backups to skip for pagination")
  }),
  
  mittwald_create_backup: z.object({
    projectId: z.string().describe("The unique identifier of the project"),
    description: z.string().optional().describe("Optional description for the backup"),
    expirationTime: z.string().optional().describe("When the backup should expire (ISO 8601 format)"),
    ignoredSources: z.object({
      files: z.boolean().describe("Whether to exclude files from the backup"),
      databases: z.array(z.object({
        kind: z.string().describe("Type of database (e.g., 'mysql', 'redis')"),
        name: z.string().describe("Name of the database to exclude")
      })).optional().describe("Array of databases to exclude from the backup")
    }).optional().describe("Sources to exclude from the backup")
  }),
  
  mittwald_get_backup: z.object({
    projectBackupId: z.string().describe("The unique identifier of the project backup")
  }),
  
  mittwald_delete_backup: z.object({
    projectBackupId: z.string().describe("The unique identifier of the project backup to delete")
  }),
  
  mittwald_update_backup_description: z.object({
    projectBackupId: z.string().describe("The unique identifier of the project backup"),
    description: z.string().describe("New description for the backup")
  }),
  
  mittwald_create_backup_export: z.object({
    projectBackupId: z.string().describe("The unique identifier of the project backup"),
    format: z.string().optional().describe("Export format (default: 'tar')"),
    withPassword: z.boolean().optional().describe("Whether to password-protect the export"),
    password: z.string().optional().describe("Password for the export (required if withPassword is true)")
  }),
  
  mittwald_delete_backup_export: z.object({
    projectBackupId: z.string().describe("The unique identifier of the project backup")
  }),

  // Mittwald Backup Schedule tools
  mittwald_list_backup_schedules: z.object({
    projectId: z.string().describe("The unique identifier of the project")
  }),
  
  mittwald_create_backup_schedule: z.object({
    projectId: z.string().describe("The unique identifier of the project"),
    description: z.string().optional().describe("Optional description for the backup schedule"),
    schedule: z.string().describe("Cron expression defining when backups should be created (e.g., '0 4 * * *' for daily at 4 AM)"),
    ttl: z.string().optional().describe("Time-to-live for backups created by this schedule (e.g., '7d' for 7 days)")
  }),
  
  mittwald_get_backup_schedule: z.object({
    projectBackupScheduleId: z.string().describe("The unique identifier of the backup schedule")
  }),
  
  mittwald_update_backup_schedule: z.object({
    projectBackupScheduleId: z.string().describe("The unique identifier of the backup schedule"),
    description: z.string().optional().describe("New description for the backup schedule"),
    schedule: z.string().optional().describe("New cron expression for the backup schedule"),
    ttl: z.string().optional().describe("New time-to-live for backups created by this schedule")
  }),
  
  mittwald_delete_backup_schedule: z.object({
    projectBackupScheduleId: z.string().describe("The unique identifier of the backup schedule to delete")
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
  
  // Mittwald SSH/SFTP and Backup tool types
  mittwald_list_ssh_keys: ListSshKeysArgs;
  mittwald_create_ssh_key: CreateSshKeyArgs;
  mittwald_get_ssh_key: GetSshKeyArgs;
  mittwald_update_ssh_key: UpdateSshKeyArgs;
  mittwald_delete_ssh_key: DeleteSshKeyArgs;
  mittwald_list_ssh_users: ListSshUsersArgs;
  mittwald_create_ssh_user: CreateSshUserArgs;
  mittwald_get_ssh_user: GetSshUserArgs;
  mittwald_update_ssh_user: UpdateSshUserArgs;
  mittwald_delete_ssh_user: DeleteSshUserArgs;
  mittwald_list_sftp_users: ListSftpUsersArgs;
  mittwald_create_sftp_user: CreateSftpUserArgs;
  mittwald_get_sftp_user: GetSftpUserArgs;
  mittwald_update_sftp_user: UpdateSftpUserArgs;
  mittwald_delete_sftp_user: DeleteSftpUserArgs;
  mittwald_list_backups: ListBackupsArgs;
  mittwald_create_backup: CreateBackupArgs;
  mittwald_get_backup: GetBackupArgs;
  mittwald_delete_backup: DeleteBackupArgs;
  mittwald_update_backup_description: UpdateBackupDescriptionArgs;
  mittwald_create_backup_export: CreateBackupExportArgs;
  mittwald_delete_backup_export: DeleteBackupExportArgs;
  mittwald_list_backup_schedules: ListBackupSchedulesArgs;
  mittwald_create_backup_schedule: CreateBackupScheduleArgs;
  mittwald_get_backup_schedule: GetBackupScheduleArgs;
  mittwald_update_backup_schedule: UpdateBackupScheduleArgs;
  mittwald_delete_backup_schedule: DeleteBackupScheduleArgs;
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
        
      // Mittwald SSH Key tools
      case "mittwald_list_ssh_keys":
        result = await handleListSshKeys(args as ListSshKeysArgs);
        break;
      case "mittwald_create_ssh_key":
        result = await handleCreateSshKey(args as CreateSshKeyArgs);
        break;
      case "mittwald_get_ssh_key":
        result = await handleGetSshKey(args as GetSshKeyArgs);
        break;
      case "mittwald_update_ssh_key":
        result = await handleUpdateSshKey(args as UpdateSshKeyArgs);
        break;
      case "mittwald_delete_ssh_key":
        result = await handleDeleteSshKey(args as DeleteSshKeyArgs);
        break;
        
      // Mittwald SSH User tools
      case "mittwald_list_ssh_users":
        result = await handleListSshUsers(args as ListSshUsersArgs);
        break;
      case "mittwald_create_ssh_user":
        result = await handleCreateSshUser(args as CreateSshUserArgs);
        break;
      case "mittwald_get_ssh_user":
        result = await handleGetSshUser(args as GetSshUserArgs);
        break;
      case "mittwald_update_ssh_user":
        result = await handleUpdateSshUser(args as UpdateSshUserArgs);
        break;
      case "mittwald_delete_ssh_user":
        result = await handleDeleteSshUser(args as DeleteSshUserArgs);
        break;
        
      // Mittwald SFTP User tools
      case "mittwald_list_sftp_users":
        result = await handleListSftpUsers(args as ListSftpUsersArgs);
        break;
      case "mittwald_create_sftp_user":
        result = await handleCreateSftpUser(args as CreateSftpUserArgs);
        break;
      case "mittwald_get_sftp_user":
        result = await handleGetSftpUser(args as GetSftpUserArgs);
        break;
      case "mittwald_update_sftp_user":
        result = await handleUpdateSftpUser(args as UpdateSftpUserArgs);
        break;
      case "mittwald_delete_sftp_user":
        result = await handleDeleteSftpUser(args as DeleteSftpUserArgs);
        break;
        
      // Mittwald Backup tools
      case "mittwald_list_backups":
        result = await handleListBackups(args as ListBackupsArgs);
        break;
      case "mittwald_create_backup":
        result = await handleCreateBackup(args as CreateBackupArgs);
        break;
      case "mittwald_get_backup":
        result = await handleGetBackup(args as GetBackupArgs);
        break;
      case "mittwald_delete_backup":
        result = await handleDeleteBackup(args as DeleteBackupArgs);
        break;
      case "mittwald_update_backup_description":
        result = await handleUpdateBackupDescription(args as UpdateBackupDescriptionArgs);
        break;
      case "mittwald_create_backup_export":
        result = await handleCreateBackupExport(args as CreateBackupExportArgs);
        break;
      case "mittwald_delete_backup_export":
        result = await handleDeleteBackupExport(args as DeleteBackupExportArgs);
        break;
        
      // Mittwald Backup Schedule tools
      case "mittwald_list_backup_schedules":
        result = await handleListBackupSchedules(args as ListBackupSchedulesArgs);
        break;
      case "mittwald_create_backup_schedule":
        result = await handleCreateBackupSchedule(args as CreateBackupScheduleArgs);
        break;
      case "mittwald_get_backup_schedule":
        result = await handleGetBackupSchedule(args as GetBackupScheduleArgs);
        break;
      case "mittwald_update_backup_schedule":
        result = await handleUpdateBackupSchedule(args as UpdateBackupScheduleArgs);
        break;
      case "mittwald_delete_backup_schedule":
        result = await handleDeleteBackupSchedule(args as DeleteBackupScheduleArgs);
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
