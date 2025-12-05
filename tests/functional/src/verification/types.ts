/**
 * Evidence collection types for real-world use cases.
 * Verification primitives reuse the canonical use-case types to stay aligned.
 */

import type {
  ApiVerification,
  CurlVerification,
  LogPatternVerification,
  PlaywrightVerification,
  SuccessCriterion,
  VerificationMethod,
} from '../use-cases/types.js';

export type {
  ApiVerification,
  CurlVerification,
  LogPatternVerification,
  PlaywrightVerification,
  SuccessCriterion,
  VerificationMethod,
} from '../use-cases/types.js';

export type PlaywrightVerificationConfig = PlaywrightVerification & {
  timeoutMs?: number;
};

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Maximum delay between retries in ms (default: 30000) */
  maxDelayMs?: number;
}

export type CurlVerificationConfig = CurlVerification & {
  timeoutMs?: number;
  headers?: Record<string, string>;
  method?: string;
  body?: string;
  /** Retry configuration for handling deployment propagation delays */
  retry?: RetryConfig;
};

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
