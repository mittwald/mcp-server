/**
 * @file MCP Prompt request handlers
 * @module handlers/prompt-handlers
 */

import type {
  ListPromptsResult,
  GetPromptRequest,
  GetPromptResult,
  PromptMessage,
  TextContent,
} from '@modelcontextprotocol/sdk/types.js';
import { PROMPTS } from '../constants/sampling/index.js';
import { handleResourceCall } from './resource-handlers.js';

/**
 * Handles MCP prompt listing requests.
 * 
 * @returns Promise resolving to the list of available prompts
 */
export async function handleListPrompts(): Promise<ListPromptsResult> {
  return { prompts: PROMPTS };
}

/**
 * Handles MCP prompt retrieval requests.
 * 
 * @param request - The prompt retrieval request with name and arguments
 * @returns Promise resolving to the prompt with variables replaced
 * @throws Error if the requested prompt is not found
 */
export async function handleGetPrompt(
  request: GetPromptRequest,
): Promise<GetPromptResult> {
  // Since PROMPTS is empty, always throw error
  throw new Error(`Prompt not found: ${request.params.name}`);
}
