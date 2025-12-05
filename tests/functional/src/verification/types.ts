/**
 * Evidence collection types for real-world use cases.
 * Mirrors the data-model definitions so future executors can consume outputs directly.
 */

export type VerificationMethod = 'playwright' | 'curl' | 'api' | 'log-pattern';

export interface PlaywrightVerification {
  url: string;
  waitForSelector?: string;
  expectedText?: string;
  captureScreenshot?: boolean;
  timeoutMs?: number;
}

export interface CurlVerification {
  url: string;
  expectedStatus: number;
  bodyPattern?: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  method?: string;
  body?: string;
}

export interface ApiVerification {
  tool: string;
  params: Record<string, unknown>;
  expectedPattern: string;
}

export interface LogPatternVerification {
  pattern: string;
  minOccurrences: number;
}

export interface SuccessCriterion {
  description: string;
  method: VerificationMethod;
  config: PlaywrightVerification | CurlVerification | ApiVerification | LogPatternVerification;
}

export type EvidenceArtifactType = 'screenshot' | 'response' | 'log-excerpt';

export interface EvidenceArtifact {
  type: EvidenceArtifactType;
  path: string;
  criterionIndex: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CriterionResult {
  index: number;
  description: string;
  method: VerificationMethod;
  passed: boolean;
  artifacts: EvidenceArtifact[];
  error?: string;
}

export interface EvidenceManifest {
  executionId: string;
  useCaseId: string;
  generatedAt: string;
  evidenceDir: string;
  criteria: CriterionResult[];
  allPassed: boolean;
}

export interface EvidenceCollectionResult {
  manifest: EvidenceManifest;
  manifestPath: string;
  evidenceDir: string;
}
