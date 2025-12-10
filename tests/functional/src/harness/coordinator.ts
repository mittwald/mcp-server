/**
 * Coordinator - Haiku Meta-Agent for Stuck Detection
 *
 * Uses Claude Haiku to analyze session state and decide on intervention.
 * Implements FR-005a intervention triggers.
 */

import Anthropic from '@anthropic-ai/sdk';
import { appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { CoordinatorDecision, CoordinatorInput, CoordinatorStatus, ICoordinator } from '../types/index.js';

/**
 * Intervention thresholds from FR-005a
 */
const THRESHOLDS = {
  MAX_CONSECUTIVE_ERRORS: 3,
  MAX_IDLE_TIME_MS: 60000, // 60 seconds
  MAX_SAME_TOOL_REPEATS: 5,
};

/**
 * Haiku model for cost-effective coordination
 */
const COORDINATOR_MODEL = 'claude-3-haiku-20240307';

/**
 * System prompt for the coordinator (T018)
 */
const COORDINATOR_SYSTEM_PROMPT = `You are a test coordinator monitoring Claude Code agents that are testing MCP tools.
Your job is to analyze the session state and decide whether to:
- continue: Let the agent proceed normally
- intervene: The agent might be stuck, provide guidance or retry
- terminate: The session is unrecoverable, kill it

Guidelines:
- Bias towards "continue" if there's reasonable progress
- "intervene" when you see patterns like repeated failures or long idle periods
- "terminate" only for clearly unrecoverable situations (auth failures, resource not found, etc.)

Respond with valid JSON only:
{
  "action": "continue" | "intervene" | "terminate",
  "reason": "brief explanation",
  "suggestion": "optional guidance for the agent"
}`;

/**
 * Build user prompt from coordinator input (T018)
 */
function buildUserPrompt(input: CoordinatorInput): string {
  const recentOutputText = input.recentOutput.slice(-20).join('\n') || '(no recent output)';

  return `Session: ${input.sessionId}
Test ID: ${input.testId}
Tool under test: ${input.toolUnderTest}

Recent activity (last 20 lines):
${recentOutputText}

Current metrics:
- Consecutive errors: ${input.patterns.consecutiveErrors}
- Idle time: ${input.idleTimeMs}ms (${(input.idleTimeMs / 1000).toFixed(1)}s)
- Same tool repeated: ${input.patterns.sameToolRepeated} times

Threshold alerts:
${input.patterns.consecutiveErrors > THRESHOLDS.MAX_CONSECUTIVE_ERRORS ? '⚠️ EXCEEDED: Consecutive errors > ' + THRESHOLDS.MAX_CONSECUTIVE_ERRORS : '✓ Errors within threshold'}
${input.idleTimeMs > THRESHOLDS.MAX_IDLE_TIME_MS ? '⚠️ EXCEEDED: Idle time > ' + THRESHOLDS.MAX_IDLE_TIME_MS + 'ms' : '✓ Activity within threshold'}
${input.patterns.sameToolRepeated > THRESHOLDS.MAX_SAME_TOOL_REPEATS ? '⚠️ EXCEEDED: Same tool repeated > ' + THRESHOLDS.MAX_SAME_TOOL_REPEATS + ' times' : '✓ No excessive repetition'}

What action should we take?`;
}

/**
 * Parse Haiku response into CoordinatorDecision
 */
function parseDecision(response: string): CoordinatorDecision {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { action: 'continue', reason: 'Failed to parse coordinator response' };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate action
    const validActions = ['continue', 'intervene', 'terminate'];
    const action = validActions.includes(parsed.action) ? parsed.action : 'continue';

    return {
      action: action as 'continue' | 'intervene' | 'terminate',
      reason: parsed.reason || undefined,
      suggestion: parsed.suggestion || undefined,
    };
  } catch {
    return { action: 'continue', reason: 'Failed to parse coordinator response' };
  }
}

/**
 * Log file path for coordinator decisions
 */
const LOG_FILE = 'output/coordinator.log';

/**
 * Coordinator implementation using Haiku (T017, T019, T020)
 */
export class Coordinator implements ICoordinator {
  private anthropic: Anthropic;
  private activeSessions = 0;
  private queuedTests = 0;
  private completedTests = 0;
  private failedTests = 0;
  private currentPhase = 'idle';

  constructor() {
    this.anthropic = new Anthropic();
    this.ensureLogDirectory();
  }

  /**
   * Ensure output directory exists
   */
  private ensureLogDirectory(): void {
    const dir = dirname(LOG_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Analyze session state and decide on action (T017, T019)
   */
  async analyze(input: CoordinatorInput): Promise<CoordinatorDecision> {
    const startTime = Date.now();

    // Check hard thresholds first (T019)
    const thresholdDecision = this.checkThresholds(input);

    try {
      // Call Haiku for analysis
      const message = await this.anthropic.messages.create({
        model: COORDINATOR_MODEL,
        max_tokens: 256,
        system: COORDINATOR_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildUserPrompt(input),
          },
        ],
      });

      // Extract text from response
      const responseText = message.content
        .filter((block: unknown): block is Anthropic.TextBlock => {
          const b = block as Record<string, unknown>;
          return b.type === 'text';
        })
        .map((block: Anthropic.TextBlock) => block.text)
        .join('');

      const decision = parseDecision(responseText);

      // If threshold suggests terminate but Haiku says continue, override
      if (thresholdDecision.action === 'terminate' && decision.action === 'continue') {
        decision.action = 'terminate';
        decision.reason = `${thresholdDecision.reason}. Haiku suggested continue but threshold override applied.`;
      }

      // Log the decision (T020)
      this.logDecision(input, decision, Date.now() - startTime);

      return decision;
    } catch (error) {
      // On API error, fall back to threshold-based decision
      const fallbackDecision = thresholdDecision;
      fallbackDecision.reason = `API error: ${error instanceof Error ? error.message : 'unknown'}. Using threshold fallback.`;

      this.logDecision(input, fallbackDecision, Date.now() - startTime);

      return fallbackDecision;
    }
  }

  /**
   * Check hard thresholds (T019)
   */
  private checkThresholds(input: CoordinatorInput): CoordinatorDecision {
    // Check consecutive errors
    if (input.patterns.consecutiveErrors > THRESHOLDS.MAX_CONSECUTIVE_ERRORS) {
      return {
        action: 'terminate',
        reason: `Exceeded max consecutive errors (${input.patterns.consecutiveErrors} > ${THRESHOLDS.MAX_CONSECUTIVE_ERRORS})`,
      };
    }

    // Check idle time
    if (input.idleTimeMs > THRESHOLDS.MAX_IDLE_TIME_MS) {
      return {
        action: 'intervene',
        reason: `Session idle too long (${(input.idleTimeMs / 1000).toFixed(1)}s > ${THRESHOLDS.MAX_IDLE_TIME_MS / 1000}s)`,
        suggestion: 'Consider retry or alternative approach',
      };
    }

    // Check repeated tool calls
    if (input.patterns.sameToolRepeated > THRESHOLDS.MAX_SAME_TOOL_REPEATS) {
      return {
        action: 'intervene',
        reason: `Same tool called too many times (${input.patterns.sameToolRepeated} > ${THRESHOLDS.MAX_SAME_TOOL_REPEATS})`,
        suggestion: 'Try a different approach or check arguments',
      };
    }

    return { action: 'continue' };
  }

  /**
   * Log coordinator decision (T020)
   */
  private logDecision(input: CoordinatorInput, decision: CoordinatorDecision, latencyMs: number): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId: input.sessionId,
      testId: input.testId,
      toolUnderTest: input.toolUnderTest,
      input: {
        consecutiveErrors: input.patterns.consecutiveErrors,
        idleTimeMs: input.idleTimeMs,
        sameToolRepeated: input.patterns.sameToolRepeated,
        retryAttempts: input.patterns.retryAttempts,
      },
      decision,
      latencyMs,
    };

    try {
      appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n', { encoding: 'utf-8' });
    } catch (error) {
      console.error('[coordinator] Failed to write log:', error);
    }
  }

  /**
   * Get coordinator status summary
   */
  getStatus(): CoordinatorStatus {
    return {
      activeSessions: this.activeSessions,
      queuedTests: this.queuedTests,
      completedTests: this.completedTests,
      failedTests: this.failedTests,
      currentPhase: this.currentPhase,
    };
  }

  /**
   * Update coordinator status
   */
  updateStatus(updates: Partial<CoordinatorStatus>): void {
    if (updates.activeSessions !== undefined) this.activeSessions = updates.activeSessions;
    if (updates.queuedTests !== undefined) this.queuedTests = updates.queuedTests;
    if (updates.completedTests !== undefined) this.completedTests = updates.completedTests;
    if (updates.failedTests !== undefined) this.failedTests = updates.failedTests;
    if (updates.currentPhase !== undefined) this.currentPhase = updates.currentPhase;
  }
}

/**
 * Create a coordinator instance
 */
export function createCoordinator(): Coordinator {
  return new Coordinator();
}

/**
 * Export thresholds for testing
 */
export { THRESHOLDS };
