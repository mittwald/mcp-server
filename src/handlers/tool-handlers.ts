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

// Import Mittwald Customer handlers
import * as CustomerHandlers from './tools/mittwald/customer/index.js';

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
  
  // Mittwald Customer Management Tools
  mittwald_customer_list: z.object({
    limit: z.number().int().min(1).max(1000).optional().describe("Maximum number of customers to return"),
    skip: z.number().int().min(0).optional().describe("Number of customers to skip for pagination"),
    page: z.number().int().min(1).optional().describe("Page number for pagination")
  }),
  
  mittwald_customer_get: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer")
  }),
  
  mittwald_customer_create: z.object({
    email: z.string().email().describe("Email address for the customer account"),
    company: z.string().optional().describe("Company name"),
    firstName: z.string().optional().describe("Customer's first name"),
    lastName: z.string().optional().describe("Customer's last name"),
    phoneNumber: z.string().optional().describe("Customer's phone number"),
    title: z.string().optional().describe("Professional title"),
    salutation: z.string().optional().describe("Salutation"),
    country: z.string().optional().describe("Country code (ISO 3166-1 alpha-2)")
  }),
  
  mittwald_customer_update: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer to update"),
    company: z.string().optional().describe("Company name"),
    firstName: z.string().optional().describe("Customer's first name"),
    lastName: z.string().optional().describe("Customer's last name"),
    phoneNumber: z.string().optional().describe("Customer's phone number"),
    title: z.string().optional().describe("Professional title"),
    salutation: z.string().optional().describe("Salutation"),
    website: z.string().optional().describe("Customer's website URL")
  }),
  
  mittwald_customer_delete: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer to delete")
  }),
  
  mittwald_customer_is_legally_competent: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer")
  }),
  
  // Mittwald Customer Profile Tools
  mittwald_customer_upload_avatar: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer")
  }),
  
  mittwald_customer_delete_avatar: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer")
  }),
  
  mittwald_customer_list_memberships: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer"),
    limit: z.number().int().min(1).optional().describe("Maximum number of memberships to return"),
    skip: z.number().int().min(0).optional().describe("Number of memberships to skip for pagination")
  }),
  
  mittwald_customer_leave: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer organization to leave")
  }),
  
  mittwald_customer_get_wallet: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer")
  }),
  
  mittwald_customer_create_wallet: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer")
  }),
  
  mittwald_customer_create_recommendation_suggestion: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer")
  }),
  
  // Mittwald Customer Invitation Tools
  mittwald_customer_list_invites: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer"),
    limit: z.number().int().min(1).optional().describe("Maximum number of invitations to return"),
    skip: z.number().int().min(0).optional().describe("Number of invitations to skip for pagination")
  }),
  
  mittwald_customer_create_invite: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer"),
    addressId: z.string().min(1).describe("The address ID for the invitation"),
    mailAddress: z.string().email().describe("Email address of the person to invite"),
    message: z.string().optional().describe("Optional personal message to include in the invitation email"),
    membershipRoles: z.array(z.string()).optional().describe("Roles to assign to the invited member")
  }),
  
  mittwald_customer_accept_invite: z.object({
    customerInviteId: z.string().min(1).describe("The unique identifier of the invitation"),
    invitationToken: z.string().optional().describe("Optional invitation token from the invitation email")
  }),
  
  // Mittwald Customer Contract Tools
  mittwald_customer_list_contracts: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer"),
    limit: z.number().int().min(1).optional().describe("Maximum number of contracts to return"),
    skip: z.number().int().min(0).optional().describe("Number of contracts to skip for pagination")
  }),
  
  mittwald_customer_get_lead_fyndr_contract: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer")
  }),
  
  // Mittwald Customer Miscellaneous Tools
  mittwald_customer_get_conversation_preferences: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer")
  }),
  
  mittwald_customer_get_extension_instance: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer"),
    extensionId: z.string().min(1).describe("The unique identifier of the extension")
  }),
  
  mittwald_customer_get_invoice_settings: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer")
  }),
  
  mittwald_customer_update_invoice_settings: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer"),
    billingAddress: z.object({}).optional().describe("Updated billing address information"),
    paymentMethod: z.string().optional().describe("Preferred payment method")
  }),
  
  mittwald_customer_list_invoices: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer"),
    limit: z.number().int().min(1).optional().describe("Maximum number of invoices to return"),
    skip: z.number().int().min(0).optional().describe("Number of invoices to skip for pagination")
  }),
  
  mittwald_customer_get_invoice: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer"),
    invoiceId: z.string().min(1).describe("The unique identifier of the invoice")
  }),
  
  mittwald_customer_get_invoice_file_access_token: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer"),
    invoiceId: z.string().min(1).describe("The unique identifier of the invoice")
  }),
  
  mittwald_customer_list_orders: z.object({
    customerId: z.string().min(1).describe("The unique identifier of the customer"),
    limit: z.number().int().min(1).optional().describe("Maximum number of orders to return"),
    skip: z.number().int().min(0).optional().describe("Number of orders to skip for pagination")
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
  // Mittwald Customer tools - these will be validated by Zod schemas
  mittwald_customer_list: any;
  mittwald_customer_get: any;
  mittwald_customer_create: any;
  mittwald_customer_update: any;
  mittwald_customer_delete: any;
  mittwald_customer_is_legally_competent: any;
  mittwald_customer_upload_avatar: any;
  mittwald_customer_delete_avatar: any;
  mittwald_customer_list_memberships: any;
  mittwald_customer_leave: any;
  mittwald_customer_get_wallet: any;
  mittwald_customer_create_wallet: any;
  mittwald_customer_create_recommendation_suggestion: any;
  mittwald_customer_list_invites: any;
  mittwald_customer_create_invite: any;
  mittwald_customer_accept_invite: any;
  mittwald_customer_list_contracts: any;
  mittwald_customer_get_lead_fyndr_contract: any;
  mittwald_customer_get_conversation_preferences: any;
  mittwald_customer_get_extension_instance: any;
  mittwald_customer_get_invoice_settings: any;
  mittwald_customer_update_invoice_settings: any;
  mittwald_customer_list_invoices: any;
  mittwald_customer_get_invoice: any;
  mittwald_customer_get_invoice_file_access_token: any;
  mittwald_customer_list_orders: any;
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
      // Mittwald Customer Management Tools
      case "mittwald_customer_list":
        result = await CustomerHandlers.handleCustomerList(args);
        break;
      case "mittwald_customer_get":
        result = await CustomerHandlers.handleCustomerGet(args);
        break;
      case "mittwald_customer_create":
        result = await CustomerHandlers.handleCustomerCreate(args);
        break;
      case "mittwald_customer_update":
        result = await CustomerHandlers.handleCustomerUpdate(args);
        break;
      case "mittwald_customer_delete":
        result = await CustomerHandlers.handleCustomerDelete(args);
        break;
      case "mittwald_customer_is_legally_competent":
        result = await CustomerHandlers.handleCustomerIsLegallyCompetent(args);
        break;
      // Mittwald Customer Profile Tools
      case "mittwald_customer_upload_avatar":
        result = await CustomerHandlers.handleCustomerUploadAvatar(args);
        break;
      case "mittwald_customer_delete_avatar":
        result = await CustomerHandlers.handleCustomerDeleteAvatar(args);
        break;
      case "mittwald_customer_list_memberships":
        result = await CustomerHandlers.handleCustomerListMemberships(args);
        break;
      case "mittwald_customer_leave":
        result = await CustomerHandlers.handleCustomerLeave(args);
        break;
      case "mittwald_customer_get_wallet":
        result = await CustomerHandlers.handleCustomerGetWallet(args);
        break;
      case "mittwald_customer_create_wallet":
        result = await CustomerHandlers.handleCustomerCreateWallet(args);
        break;
      case "mittwald_customer_create_recommendation_suggestion":
        result = await CustomerHandlers.handleCustomerCreateRecommendationSuggestion(args);
        break;
      // Mittwald Customer Invitation Tools
      case "mittwald_customer_list_invites":
        result = await CustomerHandlers.handleCustomerListInvites(args);
        break;
      case "mittwald_customer_create_invite":
        result = await CustomerHandlers.handleCustomerCreateInvite(args);
        break;
      case "mittwald_customer_accept_invite":
        result = await CustomerHandlers.handleCustomerAcceptInvite(args);
        break;
      // Mittwald Customer Contract Tools
      case "mittwald_customer_list_contracts":
        result = await CustomerHandlers.handleCustomerListContracts(args);
        break;
      case "mittwald_customer_get_lead_fyndr_contract":
        result = await CustomerHandlers.handleCustomerGetLeadFyndrContract(args);
        break;
      // Mittwald Customer Miscellaneous Tools
      case "mittwald_customer_get_conversation_preferences":
        result = await CustomerHandlers.handleCustomerGetConversationPreferences(args);
        break;
      case "mittwald_customer_get_extension_instance":
        result = await CustomerHandlers.handleCustomerGetExtensionInstance(args);
        break;
      case "mittwald_customer_get_invoice_settings":
        result = await CustomerHandlers.handleCustomerGetInvoiceSettings(args);
        break;
      case "mittwald_customer_update_invoice_settings":
        result = await CustomerHandlers.handleCustomerUpdateInvoiceSettings(args);
        break;
      case "mittwald_customer_list_invoices":
        result = await CustomerHandlers.handleCustomerListInvoices(args);
        break;
      case "mittwald_customer_get_invoice":
        result = await CustomerHandlers.handleCustomerGetInvoice(args);
        break;
      case "mittwald_customer_get_invoice_file_access_token":
        result = await CustomerHandlers.handleCustomerGetInvoiceFileAccessToken(args);
        break;
      case "mittwald_customer_list_orders":
        result = await CustomerHandlers.handleCustomerListOrders(args);
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
