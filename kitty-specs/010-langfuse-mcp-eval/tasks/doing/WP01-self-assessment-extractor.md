---
work_package_id: "WP01"
subtasks:
  - "T001"
title: "Self-Assessment Extractor Script"
phase: "Phase 1 - Infrastructure & Schemas"
lane: "planned"
assignee: ""
agent: "claude"
shell_pid: "78380"
review_status: "has_feedback"
reviewed_by: "codex"
history:
  - timestamp: "2025-12-16T13:01:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T16:20:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "78380"
    action: "Started implementation"
  - timestamp: "2025-12-16T16:24:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "78380"
    action: "Implementation complete - all 27 unit tests pass"
  - timestamp: "2025-12-16T15:27:55Z"
    lane: "planned"
    agent: "codex"
    shell_pid: "82955"
    action: "Code review: needs schema validation and marker handling fixes"
---

## Review Feedback

**Status**: ❌ **Needs Changes**

**Key Issues**:
1. Missing schema validation: extraction reports success without enforcing `contracts/self-assessment.schema.json` (no `tool_executed` pattern or ISO timestamp checks, additionalProperties ignored), so invalid assessments slip through and acceptance criteria on schema validation are unmet.
2. Marker edge case handling: when markers are present but content is empty/whitespace, the extractor returns “No self-assessment markers found” instead of flagging a malformed assessment with useful context, making it hard to distinguish missing output from broken output.

**What Was Done Well**:
- Streamed JSONL parsing supports assistant role variants and array-based content.
- Directory mode provides per-file outputs and a summary to inspect batch results quickly.

**Action Items** (must complete before re-review):
- [ ] Integrate validation against `contracts/self-assessment.schema.json` (e.g., Ajv + formats) so schema violations (pattern, timestamp format, additionalProperties) surface as explicit errors instead of successes.
- [ ] Detect empty/whitespace content between markers and return a clear error with the relevant message index/line metadata.
- [ ] Add tests covering schema validation failures and empty-content marker scenarios.

# Work Package Prompt: WP01 – Self-Assessment Extractor Script

## Objective

Create a TypeScript script to extract self-assessment JSON blocks from Claude Code session logs. This script is critical for processing eval results and must handle various edge cases reliably.

## Context

During eval execution, Claude Code agents output self-assessments in this format:

```
<!-- SELF_ASSESSMENT_START -->
{
  "success": true,
  "confidence": "high",
  ...
}
<!-- SELF_ASSESSMENT_END -->
```

The session logs are JSONL files where each line is a JSON object with a `type` field. Self-assessments appear in `assistant` type messages.

## Technical Requirements

### Input
- Session log file path (JSONL format)
- Or directory path to process multiple logs

### Output
- Extracted self-assessment JSON object
- Validation result against schema
- Extraction metadata (line number, context)

### Schema Reference
Use the schema defined in: `kitty-specs/010-langfuse-mcp-eval/contracts/self-assessment.schema.json`

## Implementation Steps

### Step 1: Create Script Scaffold

Create `evals/scripts/extract-self-assessment.ts`:

```typescript
#!/usr/bin/env npx ts-node

/**
 * Self-Assessment Extractor
 *
 * Extracts structured self-assessment JSON from Claude Code session logs.
 *
 * Usage:
 *   npx ts-node extract-self-assessment.ts <session-log-path>
 *   npx ts-node extract-self-assessment.ts --dir <logs-directory>
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Marker constants
const ASSESSMENT_START = '<!-- SELF_ASSESSMENT_START -->';
const ASSESSMENT_END = '<!-- SELF_ASSESSMENT_END -->';

interface ExtractionResult {
  success: boolean;
  assessment: SelfAssessment | null;
  error?: string;
  metadata: {
    sourceFile: string;
    lineNumber?: number;
    extractedAt: string;
  };
}

interface SelfAssessment {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  tool_executed: string;
  timestamp: string;
  problems_encountered: Problem[];
  resources_created: Resource[];
  resources_verified: Verification[];
  tool_response_summary?: string;
  execution_notes?: string;
}

// ... implementation
```

### Step 2: Implement JSONL Parser

Parse session log line by line, extracting `assistant` type messages:

```typescript
async function parseSessionLog(filePath: string): Promise<string[]> {
  const assistantMessages: string[] = [];

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'assistant' && entry.message?.content) {
        // Handle both string and array content
        const content = Array.isArray(entry.message.content)
          ? entry.message.content.map((c: any) => c.text || '').join('')
          : entry.message.content;
        assistantMessages.push(content);
      }
    } catch (e) {
      // Skip malformed lines
      continue;
    }
  }

  return assistantMessages;
}
```

### Step 3: Implement Marker Extraction

Extract JSON between markers:

```typescript
function extractBetweenMarkers(text: string): string | null {
  const startIdx = text.indexOf(ASSESSMENT_START);
  const endIdx = text.indexOf(ASSESSMENT_END);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return null;
  }

  const startContent = startIdx + ASSESSMENT_START.length;
  let content = text.substring(startContent, endIdx).trim();

  // Handle markdown code blocks
  if (content.startsWith('```json')) {
    content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (content.startsWith('```')) {
    content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  return content.trim();
}
```

### Step 4: Implement JSON Parsing with Error Handling

```typescript
function parseAssessmentJson(jsonString: string): SelfAssessment | null {
  try {
    const parsed = JSON.parse(jsonString);

    // Validate required fields
    if (typeof parsed.success !== 'boolean') {
      throw new Error('Missing or invalid "success" field');
    }
    if (!['high', 'medium', 'low'].includes(parsed.confidence)) {
      throw new Error('Invalid "confidence" value');
    }
    if (typeof parsed.tool_executed !== 'string') {
      throw new Error('Missing or invalid "tool_executed" field');
    }
    if (typeof parsed.timestamp !== 'string') {
      throw new Error('Missing or invalid "timestamp" field');
    }

    // Ensure arrays exist
    parsed.problems_encountered = parsed.problems_encountered || [];
    parsed.resources_created = parsed.resources_created || [];
    parsed.resources_verified = parsed.resources_verified || [];

    return parsed as SelfAssessment;
  } catch (e) {
    console.error(`JSON parse error: ${e}`);
    return null;
  }
}
```

### Step 5: Implement Main Extraction Function

```typescript
async function extractSelfAssessment(logPath: string): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    success: false,
    assessment: null,
    metadata: {
      sourceFile: logPath,
      extractedAt: new Date().toISOString()
    }
  };

  try {
    const messages = await parseSessionLog(logPath);

    // Search backwards (assessment usually at end)
    for (let i = messages.length - 1; i >= 0; i--) {
      const extracted = extractBetweenMarkers(messages[i]);
      if (extracted) {
        const assessment = parseAssessmentJson(extracted);
        if (assessment) {
          result.success = true;
          result.assessment = assessment;
          result.metadata.lineNumber = i;
          return result;
        }
      }
    }

    result.error = 'No valid self-assessment found in session log';
    return result;
  } catch (e) {
    result.error = `Extraction failed: ${e}`;
    return result;
  }
}
```

### Step 6: Implement Batch Processing

```typescript
async function processDirectory(dirPath: string): Promise<Map<string, ExtractionResult>> {
  const results = new Map<string, ExtractionResult>();
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.jsonl'));

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const result = await extractSelfAssessment(filePath);
    results.set(file, result);
  }

  return results;
}
```

### Step 7: Implement CLI Interface

```typescript
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: extract-self-assessment.ts <log-path> | --dir <directory>');
    process.exit(1);
  }

  if (args[0] === '--dir') {
    const dirPath = args[1];
    const results = await processDirectory(dirPath);

    let successCount = 0;
    let failureCount = 0;

    for (const [file, result] of results) {
      if (result.success) {
        successCount++;
        console.log(`✓ ${file}`);
      } else {
        failureCount++;
        console.log(`✗ ${file}: ${result.error}`);
      }
    }

    console.log(`\nExtracted: ${successCount}/${results.size}`);

    // Output results as JSON
    const outputPath = path.join(dirPath, 'extraction-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(Object.fromEntries(results), null, 2));
    console.log(`Results written to: ${outputPath}`);
  } else {
    const result = await extractSelfAssessment(args[0]);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }
}

main().catch(console.error);
```

## Edge Cases to Handle

1. **No markers present**: Return error with clear message
2. **Malformed JSON between markers**: Log the raw content and return error
3. **Multiple assessments in one log**: Use the last one (most recent)
4. **Markers present but empty content**: Return error
5. **JSON with extra fields**: Accept but log warning
6. **Missing required fields**: Validate and return specific error
7. **Unicode/encoding issues**: Use UTF-8 consistently
8. **Very large log files**: Stream processing, not full load
9. **Nested JSON with escaped markers**: Handle properly

## Testing

Create unit tests in `evals/scripts/__tests__/extract-self-assessment.test.ts`:

```typescript
describe('extractBetweenMarkers', () => {
  it('extracts JSON between markers', () => {
    const input = `Some text
<!-- SELF_ASSESSMENT_START -->
{"success": true}
<!-- SELF_ASSESSMENT_END -->
More text`;
    expect(extractBetweenMarkers(input)).toBe('{"success": true}');
  });

  it('handles markdown code blocks', () => {
    const input = `<!-- SELF_ASSESSMENT_START -->
\`\`\`json
{"success": true}
\`\`\`
<!-- SELF_ASSESSMENT_END -->`;
    expect(extractBetweenMarkers(input)).toBe('{"success": true}');
  });

  it('returns null when markers missing', () => {
    expect(extractBetweenMarkers('no markers here')).toBeNull();
  });
});
```

## Deliverables

- [ ] `evals/scripts/extract-self-assessment.ts` - Main extraction script
- [ ] `evals/scripts/__tests__/extract-self-assessment.test.ts` - Unit tests
- [ ] Script is executable via `npx ts-node`
- [ ] Handles all edge cases documented above
- [ ] Outputs valid JSON matching schema

## Acceptance Criteria

1. Script successfully extracts valid self-assessments from session logs
2. Returns proper error messages for invalid/missing assessments
3. Validates extracted JSON against self-assessment schema
4. Supports both single file and directory batch processing
5. All unit tests pass
6. Can process 175+ log files without crashing

## Dependencies

- Node.js 18+
- TypeScript
- `kitty-specs/010-langfuse-mcp-eval/contracts/self-assessment.schema.json`

## Notes

- This script is a prerequisite for Phase 5 aggregation
- Keep extraction logic simple and testable
- Log detailed errors for debugging failed extractions
