/**
 * API Verifier (WP07 - addressing review feedback)
 *
 * Verifies success criteria by calling MCP tools and checking results.
 * Used for api verification method.
 */

import { writeFile } from 'node:fs/promises';
import type { ApiVerification } from './types.js';
import type { EvidenceArtifact } from './types.js';

export interface ApiVerificationResult {
  success: boolean;
  artifacts: EvidenceArtifact[];
  error?: string;
  toolResult?: unknown;
}

interface VerifyOptions {
  criterionIndex: number;
  responsePath?: string;
}

/**
 * Function type for calling MCP tools
 * This allows injection of the actual MCP client
 */
export type McpToolCaller = (
  toolName: string,
  params: Record<string, unknown>
) => Promise<{ success: boolean; result: unknown; error?: string }>;

export class ApiVerifier {
  private toolCaller: McpToolCaller | null = null;

  /**
   * Set the MCP tool caller function
   * This should be provided by the executor that has access to the MCP client
   */
  setToolCaller(caller: McpToolCaller): void {
    this.toolCaller = caller;
  }

  /**
   * Verify an API criterion by calling an MCP tool
   *
   * @param config - API verification configuration
   * @param options - Verification options including output paths
   * @returns Verification result
   */
  async verifyApi(
    config: ApiVerification,
    options: VerifyOptions
  ): Promise<ApiVerificationResult> {
    if (!this.toolCaller) {
      return {
        success: false,
        artifacts: [],
        error: 'API verification not available: no MCP tool caller configured',
      };
    }

    try {
      const callResult = await this.toolCaller(config.tool, config.params);

      if (!callResult.success) {
        return {
          success: false,
          artifacts: [],
          error: callResult.error || `Tool ${config.tool} call failed`,
          toolResult: callResult.result,
        };
      }

      // Check if result matches expected pattern
      const resultString = this.stringifyResult(callResult.result);
      const pattern = new RegExp(config.expectedPattern);
      const matches = pattern.test(resultString);

      const artifacts: EvidenceArtifact[] = [];

      // Save response if path provided
      if (options.responsePath) {
        const responseContent = JSON.stringify(
          {
            tool: config.tool,
            params: config.params,
            result: callResult.result,
            expectedPattern: config.expectedPattern,
            matched: matches,
          },
          null,
          2
        );
        await writeFile(options.responsePath, responseContent, 'utf-8');
        artifacts.push({
          type: 'response',
          path: options.responsePath,
          criterionIndex: options.criterionIndex,
          timestamp: new Date().toISOString(),
          metadata: {
            tool: config.tool,
            matched: matches,
          },
        });
      }

      return {
        success: matches,
        artifacts,
        toolResult: callResult.result,
        error: matches
          ? undefined
          : `Pattern '${config.expectedPattern}' not found in tool result`,
      };
    } catch (error) {
      return {
        success: false,
        artifacts: [],
        error: this.stringifyError(error),
      };
    }
  }

  private stringifyResult(result: unknown): string {
    if (typeof result === 'string') {
      return result;
    }
    return JSON.stringify(result);
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return JSON.stringify(error);
  }
}
