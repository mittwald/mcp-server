/**
 * Log Pattern Verifier (WP07 - addressing review feedback)
 *
 * Verifies success criteria by searching session logs for patterns.
 * Used for log-pattern verification method.
 */

import { readFile, writeFile } from 'node:fs/promises';
import type { LogPatternVerification } from './types.js';
import type { EvidenceArtifact } from './types.js';

export interface LogPatternVerificationResult {
  success: boolean;
  matchCount: number;
  artifacts: EvidenceArtifact[];
  error?: string;
  matchedLines?: string[];
}

interface VerifyOptions {
  criterionIndex: number;
  excerptPath?: string;
}

export class LogPatternVerifier {
  /**
   * Verify a session log against a pattern configuration
   *
   * @param sessionLogPath - Path to the JSONL session log
   * @param config - Log pattern verification configuration
   * @param options - Verification options including output paths
   * @returns Verification result with match count and artifacts
   */
  async verifyLogPattern(
    sessionLogPath: string,
    config: LogPatternVerification,
    options: VerifyOptions
  ): Promise<LogPatternVerificationResult> {
    try {
      const logContent = await readFile(sessionLogPath, 'utf-8');
      const lines = logContent.split('\n').filter((line) => line.trim());

      const pattern = new RegExp(config.pattern, 'gi');
      const matchedLines: string[] = [];

      for (const line of lines) {
        if (pattern.test(line)) {
          matchedLines.push(line);
          // Reset lastIndex for global regex
          pattern.lastIndex = 0;
        }
      }

      const matchCount = matchedLines.length;
      const success = matchCount >= config.minOccurrences;

      const artifacts: EvidenceArtifact[] = [];

      // Save log excerpt if matches found and path provided
      if (options.excerptPath && matchedLines.length > 0) {
        const excerptContent = this.formatExcerpt(config.pattern, matchedLines);
        await writeFile(options.excerptPath, excerptContent, 'utf-8');
        artifacts.push({
          type: 'log-excerpt',
          path: options.excerptPath,
          criterionIndex: options.criterionIndex,
          timestamp: new Date().toISOString(),
          metadata: {
            pattern: config.pattern,
            matchCount,
            minOccurrences: config.minOccurrences,
          },
        });
      }

      return {
        success,
        matchCount,
        artifacts,
        matchedLines: matchedLines.slice(0, 10), // Limit to first 10 for debugging
        error: success
          ? undefined
          : `Pattern '${config.pattern}' found ${matchCount} times, expected at least ${config.minOccurrences}`,
      };
    } catch (error) {
      return {
        success: false,
        matchCount: 0,
        artifacts: [],
        error: this.stringifyError(error),
      };
    }
  }

  /**
   * Search for multiple patterns in a session log
   *
   * @param sessionLogPath - Path to the JSONL session log
   * @param patterns - Array of patterns to search for
   * @returns Map of pattern to match count
   */
  async findPatterns(
    sessionLogPath: string,
    patterns: string[]
  ): Promise<Map<string, number>> {
    const results = new Map<string, number>();

    try {
      const logContent = await readFile(sessionLogPath, 'utf-8');
      const lines = logContent.split('\n').filter((line) => line.trim());

      for (const patternStr of patterns) {
        const pattern = new RegExp(patternStr, 'gi');
        let count = 0;

        for (const line of lines) {
          if (pattern.test(line)) {
            count++;
            pattern.lastIndex = 0;
          }
        }

        results.set(patternStr, count);
      }
    } catch {
      // Return empty results on error
    }

    return results;
  }

  private formatExcerpt(pattern: string, matchedLines: string[]): string {
    const header = `# Log Excerpt for Pattern: ${pattern}\n`;
    const timestamp = `# Generated: ${new Date().toISOString()}\n`;
    const separator = `# Matched ${matchedLines.length} line(s)\n\n`;

    return header + timestamp + separator + matchedLines.join('\n');
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
