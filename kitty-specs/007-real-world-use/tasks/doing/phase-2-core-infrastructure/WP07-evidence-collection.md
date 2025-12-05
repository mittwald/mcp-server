---
work_package_id: "WP07"
subtasks:
  - "T042"
  - "T043"
  - "T044"
  - "T045"
  - "T046"
  - "T047"
  - "T048"
title: "Evidence Collection with Playwright"
phase: "Phase 2 - Core Infrastructure"
lane: "doing"
assignee: "codex"
agent: "codex"
shell_pid: "8766"
history:
  - timestamp: "2025-12-05T10:15:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-05T09:40:04Z"
    lane: "doing"
    agent: "codex"
    shell_pid: "8766"
    action: "Started implementation"
---

# Work Package Prompt: WP07 – Evidence Collection with Playwright

## Objectives & Success Criteria

- Capture verification evidence for completed use cases
- Implement Playwright-based screenshot and response capture
- Implement curl-based HTTP verification for non-browser scenarios
- Generate evidence manifest linking artifacts to success criteria

**Success Metric**: Can capture screenshots and verify HTTP responses for test URLs

## Context & Constraints

### Prerequisites
- None (parallel track, integrates with WP09)
- Playwright installed: `npx playwright install chromium`

### Key References
- `kitty-specs/007-real-world-use/data-model.md` - EvidenceArtifact, SuccessCriterion
- `kitty-specs/007-real-world-use/spec.md` - FR-021, FR-022

### Constraints
- Screenshots stored as PNG
- Evidence organized by execution ID
- Handle deployment propagation delays

## Subtasks & Detailed Guidance

### Subtask T042 – Create playwright-verifier.ts with screenshot capture

- **Purpose**: Capture visual evidence of deployed resources.

- **Steps**:
  1. Create `tests/functional/src/verification/playwright-verifier.ts`
  2. Install playwright if not present
  3. Implement `captureScreenshot(url: string, outputPath: string): Promise<void>`
  4. Handle browser launch and page navigation
  5. Save screenshot as PNG

- **Files**:
  - Create: `tests/functional/src/verification/playwright-verifier.ts`

- **Parallel?**: Yes (different verifier)

- **Example**:
```typescript
import { chromium, Browser, Page } from 'playwright';

export class PlaywrightVerifier {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch();
  }

  async captureScreenshot(url: string, outputPath: string): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.screenshot({ path: outputPath, fullPage: true });
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
  }
}
```

### Subtask T043 – Implement waitForSelector and expectedText verification

- **Purpose**: Verify specific elements and content on page.

- **Steps**:
  1. Add `verifyPageContent(url, config: PlaywrightVerification): Promise<boolean>`
  2. Navigate to URL
  3. Wait for selector if specified
  4. Check for expected text content
  5. Return pass/fail result

- **Files**:
  - Modify: `tests/functional/src/verification/playwright-verifier.ts`

- **Parallel?**: Yes

- **Example**:
```typescript
import { PlaywrightVerification } from '../use-cases/types';

async verifyPageContent(
  url: string,
  config: PlaywrightVerification
): Promise<{ success: boolean; screenshotPath?: string; error?: string }> {
  const page = await this.browser!.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    if (config.waitForSelector) {
      await page.waitForSelector(config.waitForSelector, { timeout: 10000 });
    }

    if (config.expectedText) {
      const content = await page.textContent('body');
      if (!content?.includes(config.expectedText)) {
        return { success: false, error: `Expected text not found: ${config.expectedText}` };
      }
    }

    let screenshotPath: string | undefined;
    if (config.captureScreenshot) {
      screenshotPath = `${Date.now()}-screenshot.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    return { success: true, screenshotPath };
  } catch (error) {
    return { success: false, error: String(error) };
  } finally {
    await page.close();
  }
}
```

### Subtask T044 – Create curl-verifier.ts for HTTP status checks

- **Purpose**: Simple HTTP verification without browser overhead.

- **Steps**:
  1. Create `tests/functional/src/verification/curl-verifier.ts`
  2. Use native fetch or child_process curl
  3. Implement `verifyHttpStatus(url, expectedStatus): Promise<boolean>`
  4. Return status code and success flag

- **Files**:
  - Create: `tests/functional/src/verification/curl-verifier.ts`

- **Parallel?**: Yes

- **Example**:
```typescript
export class CurlVerifier {
  async verifyHttpStatus(
    url: string,
    expectedStatus: number
  ): Promise<{ success: boolean; actualStatus: number; error?: string }> {
    try {
      const response = await fetch(url, { method: 'GET' });
      return {
        success: response.status === expectedStatus,
        actualStatus: response.status
      };
    } catch (error) {
      return {
        success: false,
        actualStatus: 0,
        error: String(error)
      };
    }
  }
}
```

### Subtask T045 – Implement response body pattern matching

- **Purpose**: Verify response content matches expected patterns.

- **Steps**:
  1. Add `verifyResponseBody(url, pattern): Promise<boolean>`
  2. Fetch response body
  3. Test against regex pattern
  4. Return match result

- **Files**:
  - Modify: `tests/functional/src/verification/curl-verifier.ts`

- **Parallel?**: Yes

- **Example**:
```typescript
async verifyResponseBody(
  url: string,
  config: CurlVerification
): Promise<{ success: boolean; matched?: boolean; error?: string }> {
  try {
    const response = await fetch(url);

    if (response.status !== config.expectedStatus) {
      return { success: false, error: `Status ${response.status} != ${config.expectedStatus}` };
    }

    if (config.bodyPattern) {
      const body = await response.text();
      const pattern = new RegExp(config.bodyPattern);
      return { success: pattern.test(body), matched: pattern.test(body) };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

### Subtask T046 – Create evidence-collector.ts to aggregate artifacts

- **Purpose**: Coordinate verification and collect all evidence.

- **Steps**:
  1. Create `tests/functional/src/verification/evidence-collector.ts`
  2. Accept success criteria array
  3. Run appropriate verifier for each criterion
  4. Collect artifacts and results
  5. Return aggregated evidence

- **Files**:
  - Create: `tests/functional/src/verification/evidence-collector.ts`

- **Parallel?**: No (orchestrates others)

- **Example**:
```typescript
import { SuccessCriterion, EvidenceArtifact } from '../use-cases/types';
import { PlaywrightVerifier } from './playwright-verifier';
import { CurlVerifier } from './curl-verifier';

export class EvidenceCollector {
  private playwrightVerifier: PlaywrightVerifier;
  private curlVerifier: CurlVerifier;

  async collectEvidence(
    criteria: SuccessCriterion[],
    evidenceDir: string
  ): Promise<{ artifacts: EvidenceArtifact[]; allPassed: boolean }> {
    const artifacts: EvidenceArtifact[] = [];
    let allPassed = true;

    for (let i = 0; i < criteria.length; i++) {
      const criterion = criteria[i];
      const result = await this.verifyCriterion(criterion, evidenceDir, i);
      artifacts.push(...result.artifacts);
      if (!result.passed) allPassed = false;
    }

    return { artifacts, allPassed };
  }
}
```

### Subtask T047 – Implement evidence manifest generation per execution

- **Purpose**: Document all evidence in machine-readable format.

- **Steps**:
  1. Create manifest.json in evidence directory
  2. Include all artifacts with metadata
  3. Link each artifact to success criterion
  4. Include pass/fail status per criterion

- **Files**:
  - Modify: `tests/functional/src/verification/evidence-collector.ts`

- **Parallel?**: No

- **Example Manifest**:
```json
{
  "executionId": "exec-001-2025-12-05T10-30-00",
  "useCaseId": "apps-001-deploy-php-app",
  "generatedAt": "2025-12-05T10:35:00Z",
  "criteria": [
    {
      "index": 0,
      "description": "Website responds with 200 OK",
      "passed": true,
      "artifacts": [
        {
          "type": "screenshot",
          "path": "criterion-0-screenshot.png",
          "timestamp": "2025-12-05T10:35:00Z"
        }
      ]
    }
  ],
  "allPassed": true
}
```

### Subtask T048 – Create evidence/ directory structure with timestamped folders

- **Purpose**: Organize evidence by execution.

- **Steps**:
  1. Create base directory: `tests/functional/evidence/`
  2. Create subdirectory per execution: `{usecase-id}-{timestamp}/`
  3. Store screenshots, responses, manifest in subdirectory
  4. Add .gitignore to exclude evidence from commits

- **Files**:
  - Create: `tests/functional/evidence/.gitignore`

- **Parallel?**: No (setup)

- **Structure**:
```
tests/functional/evidence/
├── .gitignore
├── apps-001-deploy-php-app-2025-12-05T10-30-00/
│   ├── manifest.json
│   ├── criterion-0-screenshot.png
│   └── criterion-1-response.json
└── databases-001-provision-mysql-2025-12-05T10-45-00/
    └── ...
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Playwright install fails in CI | Document required dependencies |
| Deployment not ready when verifying | Add retry with exponential backoff |
| Screenshots too large | Compress or use viewport-only capture |
| Network timeouts | Configurable timeout per criterion |

## Definition of Done Checklist

- [ ] T042: PlaywrightVerifier captures screenshots
- [ ] T043: Page content verification works
- [ ] T044: CurlVerifier checks HTTP status
- [ ] T045: Response body pattern matching works
- [ ] T046: EvidenceCollector aggregates results
- [ ] T047: Manifest generation working
- [ ] T048: Directory structure created
- [ ] Can verify a test URL and generate evidence

## Review Guidance

- **Key Checkpoint**: Run against a real URL and check evidence output
- **Verify**: Screenshots are readable and correctly named
- **Verify**: Manifest accurately reflects verification results
- **Look For**: Error handling for network failures

## Activity Log

- 2025-12-05T10:15:00Z – system – lane=planned – Prompt created.
- 2025-12-05T09:40:04Z – codex – shell_pid=8766 – lane=doing – Started implementation
