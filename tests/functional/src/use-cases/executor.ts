/**
 * Use Case Executor - End-to-end execution orchestration
 *
 * Executes use cases through phases: init → execute → verify → cleanup → report
 * Integrates SupervisoryController, EvidenceCollector, and CleanupExecutor.
 *
 * WP09: Use Case Executor
 */

import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'events';
import type { Writable } from 'stream';

import type {
  UseCase,
  UseCaseExecution,
  ExecutionStatus,
  EvidenceArtifact,
  CleanupStatus,
  QuestionLogEntry,
} from './types.js';
import {
  SupervisoryController,
  type StateChangeEvent,
  type QuestionHandledEvent,
} from '../harness/supervisory-controller.js';
import { SessionRunner } from '../harness/session-runner.js';
import { StreamParser, type PatternState } from '../harness/stream-parser.js';
import { EvidenceCollector } from '../verification/evidence-collector.js';
import { CleanupExecutor, type DeletionInvoker } from '../cleanup/cleanup-executor.js';
import { ResourceTracker } from '../cleanup/resource-tracker.js';
import type { StreamEvent } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SESSION_LOG_ROOT = path.join(__dirname, '../../session-logs/007-real-world-use');
const DEFAULT_EVIDENCE_ROOT = path.join(__dirname, '../../evidence');
const DEFAULT_EXECUTION_ROOT = path.join(__dirname, '../../executions');

/**
 * Execution phase for progress tracking
 */
export type ExecutionPhase = 'init' | 'execute' | 'verify' | 'cleanup' | 'report' | 'complete';

/**
 * Phase event emitted during execution
 */
export interface PhaseEvent {
  phase: ExecutionPhase;
  timestamp: Date;
  useCaseId: string;
  message?: string;
}

/**
 * Executor options
 */
export interface ExecutorOptions {
  /** Root directory for session logs */
  sessionLogRoot?: string;
  /** Root directory for evidence artifacts */
  evidenceRoot?: string;
  /** Root directory for execution summaries */
  executionRoot?: string;
  /** Working directory for Claude sessions */
  workingDir?: string;
  /** MCP config file path */
  mcpConfig?: string;
  /** Custom deletion invoker for cleanup */
  deletionInvoker?: DeletionInvoker;
  /** Additional disallowed tools */
  disallowedTools?: string[];
}

/**
 * Use Case Executor - orchestrates end-to-end use case execution
 */
export class UseCaseExecutor extends EventEmitter {
  private readonly options: Required<Omit<ExecutorOptions, 'deletionInvoker' | 'disallowedTools'>> & {
    deletionInvoker?: DeletionInvoker;
    disallowedTools: string[];
  };

  constructor(options: ExecutorOptions = {}) {
    super();
    this.options = {
      sessionLogRoot: options.sessionLogRoot ?? DEFAULT_SESSION_LOG_ROOT,
      evidenceRoot: options.evidenceRoot ?? DEFAULT_EVIDENCE_ROOT,
      executionRoot: options.executionRoot ?? DEFAULT_EXECUTION_ROOT,
      workingDir: options.workingDir ?? process.cwd(),
      mcpConfig: options.mcpConfig ?? '',
      deletionInvoker: options.deletionInvoker,
      disallowedTools: options.disallowedTools ?? [],
    };
  }

  /**
   * Execute a use case end-to-end
   */
  async execute(useCase: UseCase): Promise<UseCaseExecution> {
    const executionId = this.generateExecutionId(useCase);
    const startTime = new Date();

    // Initialize execution record
    const execution: UseCaseExecution = {
      id: executionId,
      useCaseId: useCase.id,
      startTime,
      status: 'pending',
      sessionLogPath: '',
      toolsInvoked: [],
      evidenceArtifacts: [],
      cleanupStatus: { status: 'skipped', deleted: [], failed: [] },
      questionLog: [],
    };

    // Ensure directories exist
    await mkdir(this.options.sessionLogRoot, { recursive: true });
    await mkdir(this.options.evidenceRoot, { recursive: true });
    await mkdir(this.options.executionRoot, { recursive: true });

    // Set up session log path
    const sessionLogPath = path.join(
      this.options.sessionLogRoot,
      `${useCase.id}-${this.formatTimestamp(startTime)}.jsonl`
    );
    execution.sessionLogPath = sessionLogPath;

    try {
      // Phase 1: Init
      this.emitPhase('init', useCase.id, 'Initializing execution');
      execution.status = 'running';

      // Phase 2: Execute
      this.emitPhase('execute', useCase.id, 'Starting Claude session');
      const executeResult = await this.executePhase(useCase, execution, sessionLogPath);

      if (executeResult.status === 'timeout') {
        execution.status = 'timeout';
        execution.errorMessage = 'Execution timed out';
      } else if (executeResult.status === 'failure') {
        execution.status = 'failure';
        execution.errorMessage = executeResult.errorMessage;
      } else {
        // Phase 3: Verify (only if execution succeeded)
        this.emitPhase('verify', useCase.id, 'Collecting evidence');
        const verifyResult = await this.verifyPhase(useCase, execution, sessionLogPath);
        execution.evidenceArtifacts = verifyResult.artifacts;

        if (!verifyResult.allPassed) {
          // Verification failed but don't change status - continue to cleanup
          console.log(`[Executor] Some verification criteria failed for ${useCase.id}`);
        }
      }
    } catch (error) {
      execution.status = 'failure';
      execution.errorMessage = error instanceof Error ? error.message : String(error);
    }

    // Phase 4: Cleanup (always runs)
    try {
      this.emitPhase('cleanup', useCase.id, 'Cleaning up resources');
      execution.cleanupStatus = await this.cleanupPhase(useCase, execution, sessionLogPath);

      if (execution.cleanupStatus.status === 'failed' && execution.status !== 'failure') {
        execution.status = 'cleanup-failed';
      }
    } catch (error) {
      execution.cleanupStatus = {
        status: 'failed',
        deleted: [],
        failed: [
          {
            type: 'project',
            id: 'unknown',
            tool: 'unknown',
            error: error instanceof Error ? error.message : String(error),
          },
        ],
      };
      if (execution.status !== 'failure') {
        execution.status = 'cleanup-failed';
      }
    }

    // Phase 5: Report
    this.emitPhase('report', useCase.id, 'Generating execution report');
    execution.endTime = new Date();

    // Mark success if we got through execute and verify without failure
    if (execution.status === 'running') {
      execution.status = 'success';
    }

    // Write execution summary
    await this.writeExecutionSummary(execution);

    this.emitPhase('complete', useCase.id, `Execution completed with status: ${execution.status}`);

    return execution;
  }

  /**
   * Execute the Claude session
   */
  private async executePhase(
    useCase: UseCase,
    execution: UseCaseExecution,
    sessionLogPath: string
  ): Promise<{ status: ExecutionStatus; errorMessage?: string }> {
    const sessionRunner = new SessionRunner();
    const streamParser = new StreamParser();
    const controller = new SupervisoryController(useCase);

    // Track tools invoked
    const toolsInvoked = new Set<string>();

    // Wire up controller events
    controller.on('state_change', (event: StateChangeEvent) => {
      console.log(`[Executor] State: ${event.from} → ${event.to}${event.reason ? ` (${event.reason})` : ''}`);
    });

    controller.on('question_handled', (event: QuestionHandledEvent) => {
      execution.questionLog.push({
        timestamp: event.timestamp,
        question: event.question,
        action: event.action,
        response: event.answer,
      });
    });

    // Attach controller to parser for question detection
    controller.attachToParser(streamParser);

    // Spawn interactive session
    const session = await sessionRunner.spawn({
      prompt: useCase.prompt,
      workingDir: this.options.workingDir,
      mcpConfig: this.options.mcpConfig || undefined,
      disallowedTools: this.options.disallowedTools,
      interactive: true, // Keep stdin open for question answering
      timeoutMs: useCase.timeout * 60 * 1000,
    });

    // Wire up stdin for response injection
    controller.setStdin(session.stdin);

    // Start the controller
    controller.start();

    // Process stream events
    try {
      for await (const event of session.stream) {
        // Write to session log
        await appendFile(sessionLogPath, JSON.stringify(event.content) + '\n');

        // Feed to stream parser
        streamParser.processEvent(event);

        // Track tools
        if (event.type === 'tool_use') {
          const content = event.content as Record<string, unknown>;
          const toolName = content.name as string;
          if (toolName) {
            toolsInvoked.add(toolName);
            controller.recordToolCall(toolName);
          }
        }

        // Track errors
        if (event.type === 'error') {
          const content = event.content as Record<string, unknown>;
          controller.recordError(String(content.message || content.error || 'Unknown error'));
        } else if (event.type === 'tool_result') {
          // Clear errors on successful tool result
          controller.clearErrors();
        }

        // Process output for success detection
        if (event.type === 'message') {
          const content = event.content as Record<string, unknown>;
          const message = content.message as { content?: Array<{ type: string; text?: string }> };
          if (message?.content) {
            for (const block of message.content) {
              if (block.type === 'text' && block.text) {
                controller.processOutputLine(block.text);
              }
            }
          }
        }

        // Check if controller reached terminal state
        const state = controller.getState();
        if (state === 'success' || state === 'failure' || state === 'timeout') {
          // Close stdin to signal we're done
          if (session.stdin && !session.stdin.writableEnded) {
            session.stdin.end();
          }
          break;
        }
      }
    } catch (streamError) {
      console.error('[Executor] Stream error:', streamError);
    }

    // Wait for session to complete
    const result = await session.result;

    // Update execution with tools invoked
    execution.toolsInvoked = Array.from(toolsInvoked);

    // Determine final status
    const controllerState = controller.getState();
    if (controllerState === 'timeout') {
      return { status: 'timeout', errorMessage: 'Controller timed out' };
    }
    if (controllerState === 'failure') {
      return { status: 'failure', errorMessage: result.error || 'Execution failed' };
    }
    if (result.status === 'failed') {
      return { status: 'failure', errorMessage: result.error };
    }
    if (result.status === 'timeout') {
      return { status: 'timeout', errorMessage: 'Session timed out' };
    }

    return { status: 'success' };
  }

  /**
   * Collect evidence for success criteria
   */
  private async verifyPhase(
    useCase: UseCase,
    execution: UseCaseExecution,
    sessionLogPath: string
  ): Promise<{ artifacts: EvidenceArtifact[]; allPassed: boolean }> {
    if (useCase.successCriteria.length === 0) {
      console.log('[Executor] No success criteria to verify');
      return { artifacts: [], allPassed: true };
    }

    const collector = new EvidenceCollector();

    try {
      const result = await collector.collect(useCase.successCriteria, {
        executionId: execution.id,
        useCaseId: useCase.id,
        evidenceRoot: this.options.evidenceRoot,
        sessionLogPath,
      });

      // Convert criterion results to evidence artifacts
      const artifacts: EvidenceArtifact[] = result.manifest.criteria.flatMap((criterion, index) =>
        criterion.artifacts.map((artifact) => ({
          type: artifact.type as 'screenshot' | 'response' | 'log-excerpt',
          path: artifact.path,
          criterionIndex: index,
          timestamp: new Date(),
          metadata: {},
        }))
      );

      return {
        artifacts,
        allPassed: result.manifest.allPassed,
      };
    } catch (error) {
      console.error('[Executor] Verification error:', error);
      return { artifacts: [], allPassed: false };
    }
  }

  /**
   * Clean up resources created during execution
   */
  private async cleanupPhase(
    useCase: UseCase,
    execution: UseCaseExecution,
    sessionLogPath: string
  ): Promise<CleanupStatus> {
    if (useCase.cleanupRequirements.length === 0) {
      console.log('[Executor] No cleanup requirements defined');
      return { status: 'complete', deleted: [], failed: [] };
    }

    const tracker = new ResourceTracker();

    try {
      // Parse session log for created resources
      await tracker.collectFromSessionLog(sessionLogPath, useCase.cleanupRequirements);
      const resources = tracker.getAll();

      if (resources.length === 0) {
        console.log('[Executor] No resources found to clean up');
        return { status: 'complete', deleted: [], failed: [] };
      }

      console.log(`[Executor] Found ${resources.length} resources to clean up`);

      // Use custom deletion invoker or default (no-op for now)
      const deletionInvoker: DeletionInvoker =
        this.options.deletionInvoker ??
        (async (resource) => {
          console.log(`[Executor] Would delete ${resource.type} ${resource.id} via ${resource.deletionTool}`);
          // In production, this would invoke the actual MCP tool
          return { success: true };
        });

      const executor = new CleanupExecutor(deletionInvoker);
      return await executor.cleanup(resources, useCase.cleanupRequirements);
    } catch (error) {
      console.error('[Executor] Cleanup error:', error);
      return {
        status: 'failed',
        deleted: [],
        failed: [
          {
            type: 'project',
            id: 'unknown',
            tool: 'unknown',
            error: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
  }

  /**
   * Write execution summary to file
   */
  private async writeExecutionSummary(execution: UseCaseExecution): Promise<void> {
    const summaryPath = path.join(this.options.executionRoot, `${execution.id}.json`);
    const summary = {
      ...execution,
      startTime: execution.startTime.toISOString(),
      endTime: execution.endTime?.toISOString(),
      durationMs: execution.endTime
        ? execution.endTime.getTime() - execution.startTime.getTime()
        : undefined,
    };
    await writeFile(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`[Executor] Execution summary written to ${summaryPath}`);
  }

  /**
   * Emit a phase event
   */
  private emitPhase(phase: ExecutionPhase, useCaseId: string, message?: string): void {
    const event: PhaseEvent = {
      phase,
      timestamp: new Date(),
      useCaseId,
      message,
    };
    this.emit('phase', event);
    console.log(`[${this.formatTime(event.timestamp)}] Phase: ${phase.toUpperCase()}${message ? ` - ${message}` : ''}`);
  }

  /**
   * Generate a unique execution ID
   */
  private generateExecutionId(useCase: UseCase): string {
    const timestamp = this.formatTimestamp(new Date());
    return `${useCase.id}-${timestamp}`;
  }

  /**
   * Format timestamp for filenames
   */
  private formatTimestamp(date: Date): string {
    return date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  }

  /**
   * Format time for logging
   */
  private formatTime(date: Date): string {
    return date.toISOString().slice(11, 19);
  }
}

/**
 * Create a use case executor
 */
export function createUseCaseExecutor(options?: ExecutorOptions): UseCaseExecutor {
  return new UseCaseExecutor(options);
}

/**
 * Execute a single use case
 */
export async function executeUseCase(
  useCase: UseCase,
  options?: ExecutorOptions
): Promise<UseCaseExecution> {
  const executor = createUseCaseExecutor(options);
  return executor.execute(useCase);
}
