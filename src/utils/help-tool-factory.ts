import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { MittwaldToolHandler } from '../types/mittwald/conversation.js';
import { z } from 'zod';
import { formatToolResponse } from './format-tool-response.js';
import { loadMarkdown, type MarkdownMetadata } from './markdown-loader.js';

/**
 * Creates a help tool from markdown documentation
 * @param metadata - The markdown file metadata
 * @param toolName - The name of the tool (e.g., "mittwald_domain_virtualhost_help")
 * @param availableCommands - List of related commands for this help topic
 * @returns Tool definition and handler
 */
export function createHelpTool(
  metadata: MarkdownMetadata,
  toolName: string,
  availableCommands?: string[]
): {
  tool: Tool;
  handler: MittwaldToolHandler<{}>;
  definition: {
    name: string;
    description: string;
    parameters: z.ZodObject<{}>;
    handler: MittwaldToolHandler<{}>;
  };
} {
  // Create the tool definition
  const tool: Tool = {
    name: toolName,
    description: metadata.description,
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  };

  // Create the handler that loads and returns the markdown content
  const handler: MittwaldToolHandler<{}> = async () => {
    const helpContent = loadMarkdown(metadata.filename);
    
    const responseData: any = {
      help: helpContent.trim()
    };
    
    if (availableCommands && availableCommands.length > 0) {
      responseData.availableCommands = availableCommands;
    }
    
    return formatToolResponse(
      "success",
      metadata.name,
      responseData
    );
  };

  // Create the definition object (for backwards compatibility)
  const definition = {
    name: toolName,
    description: metadata.description,
    parameters: z.object({}),
    handler
  };

  return { tool, handler, definition };
}

/**
 * Create multiple help tools from a list of markdown files
 * @param configs - Array of configurations for each help tool
 * @returns Array of tool definitions
 */
export function createHelpTools(configs: Array<{
  metadata: MarkdownMetadata;
  toolName: string;
  availableCommands?: string[];
}>): Array<{
  tool: Tool;
  handler: MittwaldToolHandler<{}>;
  definition: any;
}> {
  return configs.map(config => createHelpTool(
    config.metadata,
    config.toolName,
    config.availableCommands
  ));
}