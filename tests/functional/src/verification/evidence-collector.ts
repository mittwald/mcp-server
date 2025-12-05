import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PlaywrightVerifier } from './playwright-verifier.js';
import { CurlVerifier } from './curl-verifier.js';
import type {
  CriterionResult,
  CurlVerificationConfig,
  EvidenceCollectionResult,
  EvidenceManifest,
  PlaywrightVerificationConfig,
  SuccessCriterion,
} from './types.js';

const DEFAULT_EVIDENCE_ROOT = fileURLToPath(new URL('../../evidence', import.meta.url));

export interface EvidenceCollectorOptions {
  executionId: string;
  useCaseId: string;
  evidenceRoot?: string;
  timestamp?: Date;
}

export class EvidenceCollector {
  private readonly playwrightVerifier: PlaywrightVerifier;
  private readonly curlVerifier: CurlVerifier;

  constructor(
    playwrightVerifier?: PlaywrightVerifier,
    curlVerifier?: CurlVerifier
  ) {
    this.playwrightVerifier = playwrightVerifier ?? new PlaywrightVerifier();
    this.curlVerifier = curlVerifier ?? new CurlVerifier();
  }

  async collect(
    criteria: SuccessCriterion[],
    options: EvidenceCollectorOptions
  ): Promise<EvidenceCollectionResult> {
    const generatedAt = options.timestamp ?? new Date();
    const evidenceRoot = options.evidenceRoot ?? DEFAULT_EVIDENCE_ROOT;
    const evidenceDir = path.join(evidenceRoot, this.buildExecutionDir(options.useCaseId, generatedAt));
    await mkdir(evidenceDir, { recursive: true });

    const criterionResults: CriterionResult[] = [];
    for (let index = 0; index < criteria.length; index++) {
      const result = await this.evaluateCriterion(criteria[index], index, evidenceDir);
      criterionResults.push(result);
    }

    const manifest: EvidenceManifest = {
      executionId: options.executionId,
      useCaseId: options.useCaseId,
      generatedAt: generatedAt.toISOString(),
      evidenceDir,
      criteria: criterionResults,
      allPassed: criterionResults.every((criterion) => criterion.passed),
    };

    const manifestPath = path.join(evidenceDir, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    await this.playwrightVerifier.close();

    return { manifest, manifestPath, evidenceDir };
  }

  private async evaluateCriterion(
    criterion: SuccessCriterion,
    index: number,
    evidenceDir: string
  ): Promise<CriterionResult> {
    try {
      if (criterion.method === 'playwright') {
        return this.handlePlaywright(
          criterion.config as PlaywrightVerificationConfig,
          criterion,
          index,
          evidenceDir
        );
      }

      if (criterion.method === 'curl') {
        return this.handleCurl(
          criterion.config as CurlVerificationConfig,
          criterion,
          index,
          evidenceDir
        );
      }

      return {
        index,
        description: criterion.description,
        method: criterion.method,
        passed: false,
        artifacts: [],
        error: `Unsupported verification method: ${criterion.method}`,
      };
    } catch (error) {
      return {
        index,
        description: criterion.description,
        method: criterion.method,
        passed: false,
        artifacts: [],
        error: this.stringifyError(error),
      };
    }
  }

  private async handlePlaywright(
    config: PlaywrightVerificationConfig,
    criterion: SuccessCriterion,
    index: number,
    evidenceDir: string
  ): Promise<CriterionResult> {
    await this.playwrightVerifier.init();

    const screenshotPath = path.join(evidenceDir, this.buildArtifactName(index, 'screenshot', 'png'));
    const result = await this.playwrightVerifier.verifyPageContent(config, {
      criterionIndex: index,
      screenshotPath,
    });

    return {
      index,
      description: criterion.description,
      method: criterion.method,
      passed: result.success,
      artifacts: result.artifacts,
      error: result.error,
    };
  }

  private async handleCurl(
    config: CurlVerificationConfig,
    criterion: SuccessCriterion,
    index: number,
    evidenceDir: string
  ): Promise<CriterionResult> {
    const responsePath = path.join(evidenceDir, this.buildArtifactName(index, 'response', 'txt'));
    const result = await this.curlVerifier.verifyHttp(config, {
      criterionIndex: index,
      responsePath,
    });

    return {
      index,
      description: criterion.description,
      method: criterion.method,
      passed: result.success,
      artifacts: result.artifacts,
      error: result.error,
    };
  }

  private buildExecutionDir(useCaseId: string, timestamp: Date): string {
    const safeTimestamp = timestamp.toISOString().replace(/[:]/g, '-');
    return `${useCaseId}-${safeTimestamp}`;
  }

  private buildArtifactName(index: number, stem: string, extension: string): string {
    return `criterion-${index}-${stem}.${extension}`;
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
