import { writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import type { CurlVerificationConfig, EvidenceArtifact } from './types.js';

const DEFAULT_TIMEOUT_MS = 15000;

export interface CurlVerificationResult {
  success: boolean;
  status?: number;
  artifacts: EvidenceArtifact[];
  error?: string;
}

interface VerifyOptions {
  criterionIndex: number;
  responsePath?: string;
}

export class CurlVerifier {
  async verifyHttp(
    config: CurlVerificationConfig,
    options: VerifyOptions
  ): Promise<CurlVerificationResult> {
    const controller = new AbortController();
    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(config.url, {
        method: config.method ?? 'GET',
        headers: config.headers,
        body: config.body,
        signal: controller.signal,
      });

      const artifacts: EvidenceArtifact[] = [];
      let responseText: string | undefined;

      const statusMatches = response.status === config.expectedStatus;
      const shouldReadBody =
        Boolean(config.bodyPattern) || Boolean(options.responsePath) || !statusMatches;

      if (shouldReadBody) {
        responseText = await response.text();
      }

      let patternMatches = true;
      if (config.bodyPattern) {
        patternMatches = this.testPattern(config.bodyPattern, responseText ?? '');
      }

      if (options.responsePath && responseText !== undefined) {
        await this.writeResponseArtifact(
          options.responsePath,
          responseText,
          options.criterionIndex,
          response.status,
          artifacts
        );
      }

      return {
        success: statusMatches && patternMatches,
        status: response.status,
        artifacts,
        error: statusMatches && patternMatches
          ? undefined
          : this.buildErrorMessage(config, response.status, patternMatches),
      };
    } catch (error) {
      const errorMessage = this.stringifyError(error);
      return { success: false, artifacts: [], error: errorMessage };
    } finally {
      clearTimeout(timeout);
      // Small delay to give the abort controller a chance to settle in case of timeout
      await delay(0);
    }
  }

  private async writeResponseArtifact(
    path: string,
    body: string,
    criterionIndex: number,
    status: number,
    artifacts: EvidenceArtifact[]
  ): Promise<void> {
    await writeFile(path, body, 'utf-8');
    artifacts.push({
      type: 'response',
      path,
      criterionIndex,
      timestamp: new Date().toISOString(),
      metadata: { status },
    });
  }

  private testPattern(pattern: string, text: string): boolean {
    try {
      const regex = new RegExp(pattern);
      return regex.test(text);
    } catch {
      return false;
    }
  }

  private buildErrorMessage(config: CurlVerificationConfig, actualStatus: number, patternMatched: boolean): string {
    if (actualStatus !== config.expectedStatus && !patternMatched) {
      return `Status ${actualStatus} != ${config.expectedStatus} and pattern '${config.bodyPattern}' not found`;
    }
    if (actualStatus !== config.expectedStatus) {
      return `Status ${actualStatus} != ${config.expectedStatus}`;
    }
    return `Pattern '${config.bodyPattern}' not found`;
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
