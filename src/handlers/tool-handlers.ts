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
  PageInsightsPerformanceDataArgs,
  PageInsightsListPerformanceDataForProjectArgs,
  ServiceTokenAuthenticateArgs,
  VerificationVerifyAddressArgs,
  VerificationVerifyCompanyArgs,
  RelocationCreateRelocationArgs,
  RelocationCreateLegacyTariffChangeArgs,
  ArticleGetArticleArgs,
  ArticleListArticlesArgs,
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
  handlePageInsightsGetPerformanceData,
  handlePageInsightsListPerformanceDataForProject,
  handleServiceTokenAuthenticate,
  handleVerificationVerifyAddress,
  handleVerificationVerifyCompany,
  handleRelocationCreateRelocation,
  handleRelocationCreateLegacyTariffChange,
  handleArticleGetArticle,
  handleArticleListArticles,
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

  // Mittwald Miscellaneous API schemas
  mittwald_pageinsights_get_performance_data: z.object({
    domain: z.string().min(1).describe("The domain or subdomain to analyze"),
    path: z.string().min(1).describe("The path on the domain to analyze"),
    date: z.string().optional().describe("Query data for a specific date (format: YYYY-MM-DD)")
  }),

  mittwald_pageinsights_list_performance_data_for_project: z.object({
    projectId: z.string().min(1).describe("The unique identifier of the project")
  }),

  mittwald_servicetoken_authenticate_service: z.object({
    accessKeyId: z.string().min(1).describe("The access key ID for the service")
  }),

  mittwald_verification_verify_address: z.object({
    address: z.object({
      street: z.string().min(1).describe("Street name and number"),
      city: z.string().min(1).describe("City name"),
      postalCode: z.string().min(1).describe("Postal/ZIP code"),
      country: z.string().min(2).max(2).describe("Country code (ISO 3166-1 alpha-2)"),
      state: z.string().optional().describe("State or province (optional)")
    }).describe("The address object to verify")
  }),

  mittwald_verification_verify_company: z.object({
    company: z.object({
      name: z.string().min(1).describe("Company name"),
      registrationNumber: z.string().optional().describe("Business registration number"),
      country: z.string().min(2).max(2).describe("Country code where company is registered"),
      address: z.object({
        street: z.string(),
        city: z.string(),
        postalCode: z.string(),
        country: z.string()
      }).optional().describe("Company address")
    }).describe("The company information to verify")
  }),

  mittwald_relocation_create_relocation: z.object({
    sourceProjectId: z.string().min(1).describe("The ID of the source project to relocate from"),
    targetProjectId: z.string().min(1).describe("The ID of the target project to relocate to"),
    resourceType: z.enum(["app", "database", "domain", "all"]).describe("The type of resources to relocate"),
    resourceIds: z.array(z.string()).optional().describe("Specific resource IDs to relocate")
  }),

  mittwald_relocation_create_legacy_tariff_change: z.object({
    contractId: z.string().min(1).describe("The ID of the contract to change"),
    newTariffId: z.string().min(1).describe("The ID of the new tariff to migrate to"),
    effectiveDate: z.string().optional().describe("The date when the tariff change should become effective")
  }),

  mittwald_article_get_article: z.object({
    articleId: z.string().min(1).describe("The unique identifier of the article to retrieve")
  }),

  mittwald_article_list_articles: z.object({
    tags: z.array(z.string()).optional().describe("Filter articles by tags"),
    templateNames: z.array(z.string()).optional().describe("Filter articles by template names"),
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of articles to return"),
    offset: z.number().int().min(0).default(0).describe("Number of articles to skip for pagination")
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
  // Mittwald Miscellaneous API tools
  mittwald_pageinsights_get_performance_data: PageInsightsPerformanceDataArgs;
  mittwald_pageinsights_list_performance_data_for_project: PageInsightsListPerformanceDataForProjectArgs;
  mittwald_servicetoken_authenticate_service: ServiceTokenAuthenticateArgs;
  mittwald_verification_verify_address: VerificationVerifyAddressArgs;
  mittwald_verification_verify_company: VerificationVerifyCompanyArgs;
  mittwald_relocation_create_relocation: RelocationCreateRelocationArgs;
  mittwald_relocation_create_legacy_tariff_change: RelocationCreateLegacyTariffChangeArgs;
  mittwald_article_get_article: ArticleGetArticleArgs;
  mittwald_article_list_articles: ArticleListArticlesArgs;
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
    
    // Check if this is a Mittwald tool (doesn't need Reddit auth)
    const isMittwaldTool = request.params.name.startsWith('mittwald_');
    
    let handlerContext: ToolHandlerContext;
    
    if (isMittwaldTool) {
      // Mittwald tools don't need Reddit authentication
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
      
      // Mittwald Miscellaneous API tools
      case "mittwald_pageinsights_get_performance_data":
        result = await handlePageInsightsGetPerformanceData(args as PageInsightsPerformanceDataArgs);
        break;
      case "mittwald_pageinsights_list_performance_data_for_project":
        result = await handlePageInsightsListPerformanceDataForProject(args as PageInsightsListPerformanceDataForProjectArgs);
        break;
      case "mittwald_servicetoken_authenticate_service":
        result = await handleServiceTokenAuthenticate(args as ServiceTokenAuthenticateArgs);
        break;
      case "mittwald_verification_verify_address":
        result = await handleVerificationVerifyAddress(args as VerificationVerifyAddressArgs);
        break;
      case "mittwald_verification_verify_company":
        result = await handleVerificationVerifyCompany(args as VerificationVerifyCompanyArgs);
        break;
      case "mittwald_relocation_create_relocation":
        result = await handleRelocationCreateRelocation(args as RelocationCreateRelocationArgs);
        break;
      case "mittwald_relocation_create_legacy_tariff_change":
        result = await handleRelocationCreateLegacyTariffChange(args as RelocationCreateLegacyTariffChangeArgs);
        break;
      case "mittwald_article_get_article":
        result = await handleArticleGetArticle(args as ArticleGetArticleArgs);
        break;
      case "mittwald_article_list_articles":
        result = await handleArticleListArticles(args as ArticleListArticlesArgs);
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
