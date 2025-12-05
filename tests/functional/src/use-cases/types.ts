import { z } from 'zod';

/**
 * Domain categories for use cases (aligned with data-model.md)
 */
export type UseCaseDomain =
  | 'identity'
  | 'organization'
  | 'project-foundation'
  | 'apps'
  | 'containers'
  | 'databases'
  | 'domains-mail'
  | 'access-users'
  | 'automation'
  | 'backups';

export const UseCaseDomainSchema = z.enum([
  'identity',
  'organization',
  'project-foundation',
  'apps',
  'containers',
  'databases',
  'domains-mail',
  'access-users',
  'automation',
  'backups',
]);

/**
 * Verification methods supported for success criteria
 */
export type VerificationMethod = 'playwright' | 'curl' | 'api' | 'log-pattern';

export const VerificationMethodSchema = z.enum(['playwright', 'curl', 'api', 'log-pattern']);

export interface PlaywrightVerification {
  /** URL to visit */
  url: string;
  /** Selector to wait for */
  waitForSelector?: string;
  /** Expected text content */
  expectedText?: string;
  /** Whether to capture a screenshot */
  captureScreenshot: boolean;
}

export const PlaywrightVerificationSchema: z.ZodType<PlaywrightVerification> = z.object({
  url: z.string().url(),
  waitForSelector: z.string().optional(),
  expectedText: z.string().optional(),
  captureScreenshot: z.boolean(),
});

export interface CurlVerification {
  /** URL to request */
  url: string;
  /** Expected HTTP status code */
  expectedStatus: number;
  /** Optional response body pattern */
  bodyPattern?: string;
}

export const CurlVerificationSchema: z.ZodType<CurlVerification> = z.object({
  url: z.string().url(),
  expectedStatus: z.number(),
  bodyPattern: z.string().optional(),
});

export interface ApiVerification {
  /** MCP tool to call for verification */
  tool: string;
  /** Parameters for the tool */
  params: Record<string, unknown>;
  /** Expected result pattern */
  expectedPattern: string;
}

export const ApiVerificationSchema: z.ZodType<ApiVerification> = z.object({
  tool: z.string(),
  params: z.record(z.unknown()),
  expectedPattern: z.string(),
});

export interface LogPatternVerification {
  /** Regex pattern to find in session log */
  pattern: string;
  /** Minimum occurrences required */
  minOccurrences: number;
}

export const LogPatternVerificationSchema: z.ZodType<LogPatternVerification> = z.object({
  pattern: z.string(),
  minOccurrences: z.number().int().nonnegative(),
});

export interface SuccessCriterion {
  /** Description of what to verify */
  description: string;
  /** Verification method */
  method: VerificationMethod;
  /** Method-specific configuration */
  config: PlaywrightVerification | CurlVerification | ApiVerification | LogPatternVerification;
}

const PlaywrightCriterionSchema = z.object({
  description: z.string(),
  method: z.literal('playwright'),
  config: PlaywrightVerificationSchema,
});

const CurlCriterionSchema = z.object({
  description: z.string(),
  method: z.literal('curl'),
  config: CurlVerificationSchema,
});

const ApiCriterionSchema = z.object({
  description: z.string(),
  method: z.literal('api'),
  config: ApiVerificationSchema,
});

const LogPatternCriterionSchema = z.object({
  description: z.string(),
  method: z.literal('log-pattern'),
  config: LogPatternVerificationSchema,
});

export const SuccessCriterionSchema: z.ZodType<SuccessCriterion> = z.discriminatedUnion('method', [
  PlaywrightCriterionSchema,
  CurlCriterionSchema,
  ApiCriterionSchema,
  LogPatternCriterionSchema,
]);

/**
 * Resource types that can be cleaned up after execution
 */
export type ResourceType =
  | 'project'
  | 'app'
  | 'database'
  | 'domain'
  | 'mailbox'
  | 'cronjob'
  | 'backup'
  | 'container'
  | 'ssh-key'
  | 'certificate';

export const ResourceTypeSchema = z.enum([
  'project',
  'app',
  'database',
  'domain',
  'mailbox',
  'cronjob',
  'backup',
  'container',
  'ssh-key',
  'certificate',
]);

export interface CleanupRequirement {
  /** Resource type to clean up */
  resourceType: ResourceType;
  /** How to identify the resource */
  identificationMethod: 'log-parse' | 'naming-pattern' | 'explicit-id';
  /** MCP tool to use for deletion */
  deletionTool: string;
  /** Deletion order (lower runs first) */
  order: number;
}

export const CleanupRequirementSchema: z.ZodType<CleanupRequirement> = z.object({
  resourceType: ResourceTypeSchema,
  identificationMethod: z.enum(['log-parse', 'naming-pattern', 'explicit-id']),
  deletionTool: z.string(),
  order: z.number().int().nonnegative(),
});

export interface QuestionAnswer {
  /** Pattern to match question text */
  questionPattern: string;
  /** Response to provide */
  answer: string;
  /** Whether to skip answering */
  skip?: boolean;
  /** Whether to escalate (stop execution) */
  escalate?: boolean;
}

export const QuestionAnswerSchema: z.ZodType<QuestionAnswer> = z.object({
  questionPattern: z.string(),
  answer: z.string(),
  skip: z.boolean().optional(),
  escalate: z.boolean().optional(),
});

export interface QuestionLogEntry {
  /** When the question was detected */
  timestamp: Date;
  /** Question text */
  question: string;
  /** How it was handled */
  action: 'answered' | 'skipped' | 'escalated';
  /** Response provided (if answered) */
  response?: string;
}

export const QuestionLogEntrySchema: z.ZodType<QuestionLogEntry> = z.object({
  timestamp: z.coerce.date(),
  question: z.string(),
  action: z.enum(['answered', 'skipped', 'escalated']),
  response: z.string().optional(),
});

export interface EvidenceArtifact {
  /** Artifact type */
  type: 'screenshot' | 'response' | 'log-excerpt';
  /** Path to artifact file */
  path: string;
  /** Which success criterion this verifies */
  criterionIndex: number;
  /** Timestamp of capture */
  timestamp: Date;
  /** Additional metadata */
  metadata: Record<string, unknown>;
}

export const EvidenceArtifactSchema: z.ZodType<EvidenceArtifact> = z.object({
  type: z.enum(['screenshot', 'response', 'log-excerpt']),
  path: z.string(),
  criterionIndex: z.number().int().nonnegative(),
  timestamp: z.coerce.date(),
  metadata: z.record(z.unknown()),
});

export interface CleanupStatus {
  /** Overall cleanup result */
  status: 'complete' | 'partial' | 'failed' | 'skipped';
  /** Resources successfully deleted */
  deleted: DeletedResource[];
  /** Resources that failed to delete */
  failed: FailedResource[];
}

export const CleanupStatusSchema: z.ZodType<CleanupStatus> = z.object({
  status: z.enum(['complete', 'partial', 'failed', 'skipped']),
  deleted: z.array(
    z.object({
      type: ResourceTypeSchema,
      id: z.string(),
      tool: z.string(),
    }),
  ),
  failed: z.array(
    z.object({
      type: ResourceTypeSchema,
      id: z.string(),
      tool: z.string(),
      error: z.string(),
    }),
  ),
});

export interface DeletedResource {
  /** Resource type */
  type: ResourceType;
  /** Resource identifier */
  id: string;
  /** Tool used for deletion */
  tool: string;
}

export interface FailedResource {
  /** Resource type */
  type: ResourceType;
  /** Resource identifier */
  id: string;
  /** Tool used for deletion */
  tool: string;
  /** Error message */
  error: string;
}

export type ExecutionStatus = 'pending' | 'running' | 'success' | 'failure' | 'timeout' | 'cleanup-failed';

export const ExecutionStatusSchema = z.enum(['pending', 'running', 'success', 'failure', 'timeout', 'cleanup-failed']);

export interface UseCaseExecution {
  /** Unique execution ID */
  id: string;
  /** Reference to use case definition */
  useCaseId: string;
  /** When execution started */
  startTime: Date;
  /** When execution ended */
  endTime?: Date;
  /** Current/final status */
  status: ExecutionStatus;
  /** Path to JSONL session log */
  sessionLogPath: string;
  /** Tools invoked during execution */
  toolsInvoked: string[];
  /** Evidence artifacts collected */
  evidenceArtifacts: EvidenceArtifact[];
  /** Cleanup results */
  cleanupStatus: CleanupStatus;
  /** Error message if failed */
  errorMessage?: string;
  /** Questions asked and answers provided */
  questionLog: QuestionLogEntry[];
}

export const UseCaseExecutionSchema: z.ZodType<UseCaseExecution> = z.object({
  id: z.string(),
  useCaseId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  status: ExecutionStatusSchema,
  sessionLogPath: z.string(),
  toolsInvoked: z.array(z.string()),
  evidenceArtifacts: z.array(EvidenceArtifactSchema),
  cleanupStatus: CleanupStatusSchema,
  errorMessage: z.string().optional(),
  questionLog: z.array(QuestionLogEntrySchema),
});

export type Priority = 'P1' | 'P2' | 'P3';

export const PrioritySchema = z.enum(['P1', 'P2', 'P3']);

export interface UseCase {
  /** Unique identifier (e.g., "apps-001-deploy-php") */
  id: string;
  /** Human-readable title */
  title: string;
  /** Detailed description of the scenario */
  description: string;
  /** Primary domain category */
  domain: UseCaseDomain;
  /** The naive prompt given to Claude (no tool hints) */
  prompt: string;
  /** Tool domains expected to be used */
  expectedDomains: UseCaseDomain[];
  /** Specific MCP tools expected (for coverage mapping) */
  expectedTools: string[];
  /** Observable criteria to verify success */
  successCriteria: SuccessCriterion[];
  /** Resources that need cleanup */
  cleanupRequirements: CleanupRequirement[];
  /** Predefined answers for common questions */
  questionAnswers: QuestionAnswer[];
  /** Estimated duration in minutes */
  estimatedDuration: number;
  /** Maximum allowed duration in minutes */
  timeout: number;
  /** Priority level */
  priority: Priority;
  /** Tags for filtering */
  tags: string[];
}

export const UseCaseSchema: z.ZodType<UseCase> = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  domain: UseCaseDomainSchema,
  prompt: z.string(),
  expectedDomains: z.array(UseCaseDomainSchema),
  expectedTools: z.array(z.string()),
  successCriteria: z.array(SuccessCriterionSchema),
  cleanupRequirements: z.array(CleanupRequirementSchema),
  questionAnswers: z.array(QuestionAnswerSchema),
  estimatedDuration: z.number().int().positive(),
  timeout: z.number().int().positive(),
  priority: PrioritySchema,
  tags: z.array(z.string()),
});

export interface ToolStat {
  /** Tool name */
  tool: string;
  /** Domain for the tool */
  domain: UseCaseDomain;
  /** Number of invocations */
  invocationCount: number;
  /** Use cases that hit this tool */
  useCases: string[];
}

export const ToolStatSchema: z.ZodType<ToolStat> = z.object({
  tool: z.string(),
  domain: UseCaseDomainSchema,
  invocationCount: z.number().int().nonnegative(),
  useCases: z.array(z.string()),
});

export interface CoverageRecommendation {
  /** Tool needing coverage */
  tool: string;
  /** Suggested scenario to cover it */
  suggestedScenario: string;
  /** Priority for closing the gap */
  priority: 'high' | 'medium' | 'low';
}

export const CoverageRecommendationSchema: z.ZodType<CoverageRecommendation> = z.object({
  tool: z.string(),
  suggestedScenario: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
});

export interface CoverageReport {
  /** When the report was generated */
  generatedAt: Date;
  /** Executions included in this report */
  executionIds: string[];
  /** Total tools in inventory */
  totalTools: number;
  /** Tools invoked at least once */
  coveredTools: number;
  /** Coverage percentage */
  coveragePercent: number;
  /** Per-tool statistics */
  toolStats: ToolStat[];
  /** Tools never invoked */
  uncoveredTools: string[];
  /** Recommendations for closing gaps */
  recommendations: CoverageRecommendation[];
}

export const CoverageReportSchema: z.ZodType<CoverageReport> = z.object({
  generatedAt: z.coerce.date(),
  executionIds: z.array(z.string()),
  totalTools: z.number().int().nonnegative(),
  coveredTools: z.number().int().nonnegative(),
  coveragePercent: z.number().min(0).max(100),
  toolStats: z.array(ToolStatSchema),
  uncoveredTools: z.array(z.string()),
  recommendations: z.array(CoverageRecommendationSchema),
});

/**
 * Parse a raw JSON object into a UseCase with validation
 */
export function parseUseCase(json: unknown): UseCase {
  return UseCaseSchema.parse(json);
}

/**
 * Parse a raw JSON object into a UseCaseExecution with validation
 */
export function parseUseCaseExecution(json: unknown): UseCaseExecution {
  return UseCaseExecutionSchema.parse(json);
}

/**
 * Parse a raw JSON object into a CoverageReport with validation
 */
export function parseCoverageReport(json: unknown): CoverageReport {
  return CoverageReportSchema.parse(json);
}
