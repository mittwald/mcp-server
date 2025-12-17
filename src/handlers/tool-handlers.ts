/**
 * @file MCP Tool request handlers
 * @module handlers/tool-handlers
 * 
 * @remarks
 * This module implements the MCP tool handling functionality using dynamic
 * tool loading instead of hardcoded tool imports. It serves as the main entry
 * point for all tool-related operations in the MCP server.
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
import {
  TOOLS,
  TOOL_ERROR_MESSAGES,
  initializeTools,
  getToolHandler,
  getToolSchema
} from '../constants/tools.js';
import { logger } from '../utils/logger.js';
import { isToolExcluded, getExclusionReason } from '../utils/tool-scanner.js';
import { toolCallsTotal, toolDuration, toolMemoryDelta, memoryPressure } from '../metrics/index.js';
import type { MCPToolContext } from '../types/request-context.js';
import type { ToolHandlerContext } from './tools/types.js';
import { filterTools, getToolCategories, getToolCountByCategory } from '../utils/tool-filter.js';
import { runWithSessionContext } from '../utils/execution-context.js';
import { CONFIG } from '../server/config.js';

/**
 * Flag to track if tools have been initialized
 */
let toolsInitialized = false;

/**
 * Ensure tools are initialized before use
 */
async function ensureToolsInitialized(): Promise<void> {
  if (!toolsInitialized) {
    await initializeTools();
    toolsInitialized = true;
  }
}

/**
 * Handles the list tools request.
 * 
 * @param _request - The list tools request (unused, but required by interface)
 * @returns Promise that resolves to a list of available tools
 */
export async function handleListTools(_request: ListToolsRequest): Promise<ListToolsResult> {
  try {
    // Ensure tools are loaded
    await ensureToolsInitialized();
    
    logger.info(`🔧 handleListTools called, TOOLS.length: ${TOOLS.length}`);
    
    // Check if tool filtering is enabled
    if (CONFIG.TOOL_FILTER_ENABLED === true) {
      const maxTools = CONFIG.MAX_TOOLS_PER_RESPONSE || 50;
      const allowedCategories = CONFIG.ALLOWED_TOOL_CATEGORIES?.split(',').map(c => c.trim()).filter(Boolean);
      
      const filterOptions = {
        maxTools,
        categories: allowedCategories && allowedCategories.length > 0 ? allowedCategories : undefined,
      };
      
      const result = filterTools(TOOLS, filterOptions);
      
      logger.info(`📊 Tool filtering enabled:`);
      logger.info(`   Total tools: ${TOOLS.length}`);
      logger.info(`   Filtered tools: ${result.tools.length}`);
      logger.info(`   Max per response: ${maxTools}`);
      if (allowedCategories?.length) {
        logger.info(`   Allowed categories: ${allowedCategories.join(', ')}`);
      }
      
      // Log category distribution
      const categories = getToolCategories(result.tools);
      const categoryCount = getToolCountByCategory(result.tools);
      logger.info(`   Categories: ${categories.join(', ')}`);
      logger.info(`   Category distribution: ${JSON.stringify(categoryCount)}`);
      
      return {
        tools: result.tools,
        nextCursor: result.nextCursor
      };
    } else {
      // Return all tools without filtering
      logger.info(`📊 Tool filtering disabled, returning all ${TOOLS.length} tools`);
      return {
        tools: TOOLS,
      };
    }
  } catch (error) {
    logger.error('Error in handleListTools:', error);
    throw error;
  }
}

/**
 * Handles tool call requests using dynamic tool loading.
 * 
 * @param request - The tool call request
 * @param context - The MCP tool context
 * @returns Promise that resolves to the tool call result
 */
export async function handleToolCall(
  request: CallToolRequest,
  context: MCPToolContext,
): Promise<CallToolResult> {
  const toolName = request.params.name;
  const end = toolDuration.startTimer({ tool_name: toolName });
  const startTime = Date.now();

  // Capture memory before execution
  const memBefore = process.memoryUsage();

  // Update memory pressure gauge
  const heapPercent = (memBefore.heapUsed / memBefore.heapTotal) * 100;
  memoryPressure.set(heapPercent);

  // Check for critical memory pressure
  if (heapPercent > 90) {
    logger.error('⚠️  CRITICAL memory pressure detected', {
      tool: toolName,
      heapPercent: heapPercent.toFixed(1),
      heapUsedMB: (memBefore.heapUsed / 1024 / 1024).toFixed(1),
      heapTotalMB: (memBefore.heapTotal / 1024 / 1024).toFixed(1),
      sessionId: context.sessionId
    });
  }

  try {
    // Ensure tools are loaded
    await ensureToolsInitialized();
    
    logger.info(`🔧 handleToolCall called for tool: ${request.params.name}`);
    
    // Create minimal context for tool handlers
    const handlerContext: ToolHandlerContext = {
      userId: 'cli-user',
      sessionId: context.sessionId,
      progressToken: request.params._meta?.progressToken,
    };

    // Validate arguments are provided
    if (!request.params.arguments) {
      const toolName = request.params?.name || 'unknown';
      logger.error("Tool call missing required arguments", { toolName });
      
      // Provide helpful error message for specific tools
      if (toolName === 'mittwald_domain_virtualhost_create') {
        throw new Error("Arguments are required. Expected: { hostname: string, pathToApp?: string[], pathToUrl?: string[], pathToContainer?: string[] }. At least one path mapping is required. For containers use pathToContainer: ['/:c-xxxxx:port/tcp'].");
      }
      
      throw new Error(`Arguments are required for tool '${toolName}'`);
    }

    // Check if tool is explicitly excluded (disabled for safety)
    if (isToolExcluded(request.params.name)) {
      const reason = getExclusionReason(request.params.name);
      logger.warn(`Attempted to call disabled tool: ${request.params.name}`, {
        toolName: request.params.name,
        reason: reason || 'excluded_for_safety'
      });

      toolCallsTotal.inc({ tool_name: toolName, status: 'disabled' });
      end(); // Record duration

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: `Tool '${request.params.name}' is disabled for safety reasons: ${reason || 'security policy'}.`,
              data: {
                toolName: request.params.name,
                reason: 'excluded_for_safety',
                suggestedAction: 'Please verify this action is necessary and contact support if required.'
              }
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    // Check if tool exists
    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      logger.error("Unknown tool requested", { toolName: request.params.name });
      throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }

    // Get tool handler dynamically
    const handler = await getToolHandler(request.params.name);
    if (!handler) {
      logger.error("No handler found for tool", { toolName: request.params.name });
      throw new Error(`No handler found for tool: ${request.params.name}`);
    }

    // Get and validate schema if available
    const schema = await getToolSchema(request.params.name);
    if (schema && schema.properties) {
      try {
        // Convert JSON Schema properties to Zod schema
        const zodSchemaProperties: { [key: string]: z.ZodType } = {};
        
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          const prop = propSchema as any;
          
          // Create appropriate Zod type based on JSON schema type
          switch (prop.type) {
            case 'string':
              if (prop.enum) {
                zodSchemaProperties[propName] = z.enum(prop.enum);
              } else {
                zodSchemaProperties[propName] = z.string();
              }
              break;
            case 'boolean':
              zodSchemaProperties[propName] = z.boolean();
              break;
            case 'number':
              zodSchemaProperties[propName] = z.number();
              break;
            case 'array':
              zodSchemaProperties[propName] = z.array(z.string());
              break;
            default:
              zodSchemaProperties[propName] = z.any();
          }
          
          // Make optional if not required
          if (!schema.required || !schema.required.includes(propName)) {
            zodSchemaProperties[propName] = zodSchemaProperties[propName].optional();
          }
        }
        
        const zodSchema = z.object(zodSchemaProperties);
        zodSchema.parse(request.params.arguments);
      } catch (validationError) {
        logger.error("Tool arguments validation failed", { 
          toolName: request.params.name, 
          error: validationError,
          arguments: request.params.arguments
        });
        throw new Error(`Invalid arguments for tool '${request.params.name}': ${validationError}`);
      }
    }

    // Execute the tool handler
    logger.info(`🚀 Executing tool handler for ${request.params.name}`);
    
    // Check if this is a session-aware CLI tool (has session in the name)
    const isSessionAware = request.params.name.includes('_session') || 
                          request.params.name.includes('accessible_projects');
    
    let result: CallToolResult;
    result = await runWithSessionContext(context.sessionId, () => handler(request.params.arguments as any));

    // Capture memory after execution
    const memAfter = process.memoryUsage();
    const memoryDeltaMB = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;
    const durationMs = Date.now() - startTime;

    // Record metrics
    toolCallsTotal.inc({ tool_name: toolName, status: result.isError ? 'error' : 'success' });
    toolMemoryDelta.observe({ tool_name: toolName }, memoryDeltaMB);
    end(); // Record duration

    // Log slow operations
    const SLOW_THRESHOLD_MS = 5000;
    const VERY_SLOW_THRESHOLD_MS = 30000;

    if (durationMs > VERY_SLOW_THRESHOLD_MS) {
      logger.warn(`🐌 VERY SLOW tool execution`, {
        tool: toolName,
        durationMs,
        durationSec: (durationMs / 1000).toFixed(1),
        memoryDeltaMB: memoryDeltaMB.toFixed(1),
        heapUsedMB: (memAfter.heapUsed / 1024 / 1024).toFixed(1),
        sessionId: context.sessionId
      });
    } else if (durationMs > SLOW_THRESHOLD_MS) {
      logger.info(`⏱️  Slow tool execution`, {
        tool: toolName,
        durationMs,
        durationSec: (durationMs / 1000).toFixed(1),
        memoryDeltaMB: memoryDeltaMB.toFixed(1),
        sessionId: context.sessionId
      });
    } else {
      logger.info(`✅ Tool ${request.params.name} executed successfully`, {
        durationMs,
        memoryDeltaMB: memoryDeltaMB.toFixed(1)
      });
    }

    return result;
    
  } catch (error) {
    toolCallsTotal.inc({ tool_name: toolName, status: 'error' });
    end(); // Record duration even on error

    // Capture context for error diagnosis
    const memAfterError = process.memoryUsage();
    const durationMs = Date.now() - startTime;

    logger.error(`❌ Tool ${request.params.name} failed`, {
      tool: toolName,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      durationMs,
      heapUsedMB: (memAfterError.heapUsed / 1024 / 1024).toFixed(1),
      heapTotalMB: (memAfterError.heapTotal / 1024 / 1024).toFixed(1),
      heapPercent: ((memAfterError.heapUsed / memAfterError.heapTotal) * 100).toFixed(1),
      sessionId: context.sessionId,
      uptime: process.uptime().toFixed(0)
    });

    // Return error result instead of throwing
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool '${request.params.name}': ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Initialize the tool handlers system
 * 
 * @remarks
 * This function should be called during server startup to ensure all tools are loaded
 */
export async function initializeToolHandlers(): Promise<void> {
  try {
    await ensureToolsInitialized();
    logger.info('✅ Tool handlers system initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize tool handlers system:', error);
    throw error;
  }
}
