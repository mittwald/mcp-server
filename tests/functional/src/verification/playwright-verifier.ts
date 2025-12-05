import { chromium, type Browser, type Page } from 'playwright';
import type { EvidenceArtifact, PlaywrightVerificationConfig } from './types.js';

const DEFAULT_TIMEOUT_MS = 30000;

export interface PlaywrightVerificationResult {
  success: boolean;
  artifacts: EvidenceArtifact[];
  error?: string;
}

interface VerifyOptions {
  criterionIndex: number;
  screenshotPath?: string;
}

export class PlaywrightVerifier {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  private async createPage(): Promise<Page> {
    const browser = await this.ensureBrowser();
    return browser.newPage();
  }

  async captureScreenshot(
    url: string,
    outputPath: string,
    options: Omit<VerifyOptions, 'screenshotPath'>
  ): Promise<PlaywrightVerificationResult> {
    const page = await this.createPage();
    const artifacts: EvidenceArtifact[] = [];
    try {
      await this.navigate(page, url, undefined, DEFAULT_TIMEOUT_MS);
      await page.screenshot({ path: outputPath, fullPage: true });
      artifacts.push(this.buildScreenshotArtifact(outputPath, options.criterionIndex, { url }));
      return { success: true, artifacts };
    } catch (error) {
      return { success: false, artifacts, error: this.stringifyError(error) };
    } finally {
      await page.close();
    }
  }

  async verifyPageContent(
    config: PlaywrightVerificationConfig,
    options: VerifyOptions
  ): Promise<PlaywrightVerificationResult> {
    const page = await this.createPage();
    const artifacts: EvidenceArtifact[] = [];
    const timeout = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    try {
      await this.navigate(page, config.url, config.waitForSelector, timeout);

      if (config.expectedText) {
        const content = await page.textContent('body');
        if (!content || !content.includes(config.expectedText)) {
          return {
            success: false,
            artifacts: await this.captureIfNeeded(
              page,
              options,
              artifacts,
              config.url,
              config.captureScreenshot ?? true
            ),
            error: `Expected text not found: ${config.expectedText}`,
          };
        }
      }

      const artifactsWithScreenshot = await this.captureIfNeeded(page, options, artifacts, config.url, config.captureScreenshot ?? true);
      return { success: true, artifacts: artifactsWithScreenshot };
    } catch (error) {
      const artifactsWithScreenshot = await this.captureIfNeeded(page, options, artifacts, config.url, config.captureScreenshot ?? true);
      return { success: false, artifacts: artifactsWithScreenshot, error: this.stringifyError(error) };
    } finally {
      await page.close();
    }
  }

  private async navigate(
    page: Page,
    url: string,
    waitForSelector: string | undefined,
    timeout: number
  ): Promise<void> {
    await page.goto(url, { waitUntil: 'networkidle', timeout });
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout });
    }
    // Record navigation for debugging via metadata on screenshot artifacts
    page.setDefaultTimeout(timeout);
  }

  private async captureIfNeeded(
    page: Page,
    options: VerifyOptions,
    artifacts: EvidenceArtifact[],
    url: string,
    captureScreenshot = true
  ): Promise<EvidenceArtifact[]> {
    if (!captureScreenshot || !options.screenshotPath) {
      return artifacts;
    }

    try {
      await page.screenshot({ path: options.screenshotPath, fullPage: true });
      artifacts.push(this.buildScreenshotArtifact(options.screenshotPath, options.criterionIndex, { url }));
    } catch {
      // Ignore screenshot failures; verification result will still include prior error
    }

    return artifacts;
  }

  private buildScreenshotArtifact(
    path: string,
    criterionIndex: number,
    metadata?: Record<string, unknown>
  ): EvidenceArtifact {
    return {
      type: 'screenshot',
      path,
      criterionIndex,
      timestamp: new Date().toISOString(),
      metadata,
    };
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
