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

export type CurlVerificationConfig = CurlVerification & {
  timeoutMs?: number;
  headers?: Record<string, string>;
  method?: string;
  body?: string;
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
