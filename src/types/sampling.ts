/**
 * @file Types for MCP Sampling functionality
 * @module types/sampling
 *
 * @remarks
 * This module defines types for the MCP Sampling feature, which allows servers to request
 * LLM completions from clients. Sampling is useful for enhancing server capabilities with
 * AI-generated content, analysis, and decision-making.
 *
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling | MCP Sampling Specification}
 */

import type { PromptMessage, Prompt } from "@modelcontextprotocol/sdk/types.js";

/**
 * Represents a sampling prompt that extends the base MCP Prompt.
 *
 * @remarks
 * Sampling prompts are used to request LLM completions from the client.
 * The server provides a prompt with messages and optional response schemas,
 * and the client returns a completion based on the prompt.
 *
 * @example
 * ```typescript
 * const samplingPrompt: SamplingPrompt = {
 *   name: "create_server_config",
 *   messages: [
 *     { role: "system", content: "You are a helpful Mittwald server configuration assistant." },
 *     { role: "user", content: "Create a server configuration for a TypeScript application" }
 *   ],
 *   _meta: {
 *     callback: "handleCreateServerConfigCallback"
 *   }
 * };
 * ```
 *
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling#prompt-messages | Prompt Messages}
 */
export interface SamplingPrompt extends Prompt {
  /**
   * Array of messages that form the conversation context for the LLM.
   * Messages can have roles like "system", "user", or "assistant".
   *
   * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling#prompt-messages | Prompt Messages}
   */
  messages: PromptMessage[];

  /**
   * Metadata for controlling the sampling behavior and response handling.
   */
  _meta: {
    /**
     * The name of the callback function to invoke after sampling is complete.
     * This function will receive the sampling result and handle any post-processing.
     *
     * @example "handleCreateServerConfigCallback"
     */
    callback: string;
  };
}
