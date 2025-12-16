#!/usr/bin/env npx ts-node

/**
 * Self-Assessment Extractor
 *
 * Extracts structured self-assessment JSON from Claude Code session logs.
 *
 * Usage:
 *   npx ts-node extract-self-assessment.ts <session-log-path>
 *   npx ts-node extract-self-assessment.ts --dir <logs-directory>
 *   npx ts-node extract-self-assessment.ts --dir <logs-directory> --output <output-dir>
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

// Marker constants
const ASSESSMENT_START = '<!-- SELF_ASSESSMENT_START -->';
const ASSESSMENT_END = '<!-- SELF_ASSESSMENT_END -->';
const SCHEMA_PATH = path.resolve(
  process.cwd(),
  'kitty-specs/010-langfuse-mcp-eval/contracts/self-assessment.schema.json'
);

// Problem type enum from schema
type ProblemType =
  | 'auth_error'
  | 'resource_not_found'
  | 'validation_error'
  | 'timeout'
  | 'api_error'
  | 'permission_denied'
  | 'quota_exceeded'
  | 'dependency_missing'
  | 'other';

// Resource verification status
type VerificationStatus = 'exists' | 'not_found' | 'error';

interface Problem {
  type: ProblemType;
  description: string;
  recovery_attempted?: boolean;
  recovered?: boolean;
}

interface ResourceCreated {
  type: string;
  id: string;
  name?: string;
  verified?: boolean;
}

interface ResourceVerified {
  type: string;
  id: string;
  status: VerificationStatus;
}

interface SelfAssessment {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  tool_executed: string;
  timestamp: string;
  problems_encountered: Problem[];
  resources_created: ResourceCreated[];
  resources_verified: ResourceVerified[];
  tool_response_summary?: string;
  execution_notes?: string;
}

interface ExtractionResult {
  success: boolean;
  assessment: SelfAssessment | null;
  error?: string;
  metadata: {
    sourceFile: string;
    lineNumber?: number;
    extractedAt: string;
    rawContent?: string;
  };
}

let validateSelfAssessment: ValidateFunction | null = null;

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return 'Unknown schema validation error';

  return errors
    .map((err) => {
      const pathDisplay = err.instancePath && err.instancePath !== '' ? err.instancePath : '(root)';
      const additional = (err.params as { additionalProperty?: string }).additionalProperty;
      const additionalText = additional ? ` [${additional}]` : '';
      return `${pathDisplay}${additionalText} ${err.message ?? ''}`.trim();
    })
    .join('; ');
}

function getSchemaValidator(): { validate: ValidateFunction; schemaLoaded: boolean; error?: string } {
  if (validateSelfAssessment) {
    return { validate: validateSelfAssessment, schemaLoaded: true };
  }

  try {
    const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    const schemaJson = JSON.parse(schemaContent);
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    validateSelfAssessment = ajv.compile(schemaJson);
    return { validate: validateSelfAssessment, schemaLoaded: true };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return { validate: (() => false) as ValidateFunction, schemaLoaded: false, error: errorMessage };
  }
}

/**
 * Parse a session log file (JSONL format) and extract assistant messages
 */
async function parseSessionLog(filePath: string): Promise<string[]> {
  const assistantMessages: string[] = [];

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line);

      // Handle different session log formats
      if (entry.type === 'assistant' && entry.message?.content) {
        // Claude Code session log format
        const content = Array.isArray(entry.message.content)
          ? entry.message.content.map((c: any) => c.text || c.content || '').join('')
          : typeof entry.message.content === 'string'
            ? entry.message.content
            : '';
        if (content) {
          assistantMessages.push(content);
        }
      } else if (entry.role === 'assistant' && entry.content) {
        // Alternative format
        const content = Array.isArray(entry.content)
          ? entry.content.map((c: any) => c.text || c.content || '').join('')
          : typeof entry.content === 'string'
            ? entry.content
            : '';
        if (content) {
          assistantMessages.push(content);
        }
      }
    } catch (e) {
      // Skip malformed lines
      continue;
    }
  }

  return assistantMessages;
}

/**
 * Extract content between self-assessment markers
 */
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

/**
 * Validate problem type against schema enum
 */
function isValidProblemType(type: string): type is ProblemType {
  const validTypes: ProblemType[] = [
    'auth_error',
    'resource_not_found',
    'validation_error',
    'timeout',
    'api_error',
    'permission_denied',
    'quota_exceeded',
    'dependency_missing',
    'other',
  ];
  return validTypes.includes(type as ProblemType);
}

/**
 * Validate and normalize problem objects
 */
function validateProblems(problems: any[]): Problem[] {
  if (!Array.isArray(problems)) return [];

  return problems
    .filter((p) => p && typeof p === 'object')
    .map((p) => ({
      type: isValidProblemType(p.type) ? p.type : 'other',
      description: typeof p.description === 'string' ? p.description : String(p.description || 'Unknown problem'),
      recovery_attempted: typeof p.recovery_attempted === 'boolean' ? p.recovery_attempted : undefined,
      recovered: typeof p.recovered === 'boolean' ? p.recovered : undefined,
    }));
}

/**
 * Validate and normalize resource objects
 */
function validateResourcesCreated(resources: any[]): ResourceCreated[] {
  if (!Array.isArray(resources)) return [];

  return resources
    .filter((r) => r && typeof r === 'object' && r.type && r.id)
    .map((r) => ({
      type: String(r.type),
      id: String(r.id),
      name: r.name ? String(r.name) : undefined,
      verified: typeof r.verified === 'boolean' ? r.verified : undefined,
    }));
}

/**
 * Validate and normalize verified resource objects
 */
function validateResourcesVerified(resources: any[]): ResourceVerified[] {
  if (!Array.isArray(resources)) return [];

  const validStatuses: VerificationStatus[] = ['exists', 'not_found', 'error'];

  return resources
    .filter((r) => r && typeof r === 'object' && r.type && r.id)
    .map((r) => ({
      type: String(r.type),
      id: String(r.id),
      status: validStatuses.includes(r.status) ? r.status : 'error',
    }));
}

/**
 * Parse and validate self-assessment JSON
 */
function parseAssessmentJson(jsonString: string): { assessment: SelfAssessment | null; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);

    const { validate, schemaLoaded, error: schemaError } = getSchemaValidator();
    if (!schemaLoaded) {
      return { assessment: null, error: `Schema validation unavailable: ${schemaError}` };
    }

    const isValid = validate(parsed);
    if (!isValid) {
      return { assessment: null, error: `Schema validation failed: ${formatAjvErrors(validate.errors)}` };
    }

    // Validate required fields
    if (typeof parsed.success !== 'boolean') {
      return { assessment: null, error: 'Missing or invalid "success" field (must be boolean)' };
    }

    if (!['high', 'medium', 'low'].includes(parsed.confidence)) {
      return { assessment: null, error: 'Invalid "confidence" value (must be high, medium, or low)' };
    }

    if (typeof parsed.tool_executed !== 'string' || !parsed.tool_executed) {
      return { assessment: null, error: 'Missing or invalid "tool_executed" field (must be non-empty string)' };
    }

    if (typeof parsed.timestamp !== 'string' || !parsed.timestamp) {
      return { assessment: null, error: 'Missing or invalid "timestamp" field (must be ISO 8601 string)' };
    }

    // Build validated assessment object
    const assessment: SelfAssessment = {
      success: parsed.success,
      confidence: parsed.confidence,
      tool_executed: parsed.tool_executed,
      timestamp: parsed.timestamp,
      problems_encountered: validateProblems(parsed.problems_encountered),
      resources_created: validateResourcesCreated(parsed.resources_created),
      resources_verified: validateResourcesVerified(parsed.resources_verified),
    };

    // Optional fields
    if (typeof parsed.tool_response_summary === 'string') {
      assessment.tool_response_summary = parsed.tool_response_summary;
    }
    if (typeof parsed.execution_notes === 'string') {
      assessment.execution_notes = parsed.execution_notes;
    }

    return { assessment };
  } catch (e) {
    return { assessment: null, error: `JSON parse error: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/**
 * Main extraction function for a single session log
 */
export async function extractSelfAssessment(logPath: string): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    success: false,
    assessment: null,
    metadata: {
      sourceFile: logPath,
      extractedAt: new Date().toISOString(),
    },
  };

  // Check if file exists
  if (!fs.existsSync(logPath)) {
    result.error = `File not found: ${logPath}`;
    return result;
  }

  try {
    const messages = await parseSessionLog(logPath);

    if (messages.length === 0) {
      result.error = 'No assistant messages found in session log';
      return result;
    }

    // Search backwards (assessment usually at end of session)
    for (let i = messages.length - 1; i >= 0; i--) {
      const extracted = extractBetweenMarkers(messages[i]);
      if (extracted !== null) {
        result.metadata.rawContent = extracted;
        result.metadata.lineNumber = i;

        if (extracted.trim() === '') {
          result.error = 'Empty self-assessment content between markers';
          continue;
        }

        const { assessment, error } = parseAssessmentJson(extracted);
        if (assessment) {
          result.success = true;
          result.assessment = assessment;
          return result;
        } else if (error) {
          // Found markers but JSON was invalid - keep looking
          result.error = error;
        }
      }
    }

    if (!result.error) {
      result.error = 'No self-assessment markers found in session log';
    }
    return result;
  } catch (e) {
    result.error = `Extraction failed: ${e instanceof Error ? e.message : String(e)}`;
    return result;
  }
}

/**
 * Process a directory of session logs
 */
export async function processDirectory(
  dirPath: string,
  outputDir?: string
): Promise<Map<string, ExtractionResult>> {
  const results = new Map<string, ExtractionResult>();

  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    return results;
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.jsonl') || f.endsWith('.json'));

  console.log(`Processing ${files.length} session log files...`);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const result = await extractSelfAssessment(filePath);
    results.set(file, result);

    // If output dir specified and extraction successful, write individual result
    if (outputDir && result.success && result.assessment) {
      fs.mkdirSync(outputDir, { recursive: true });
      const outputFile = path.join(outputDir, file.replace(/\.(jsonl|json)$/, '.assessment.json'));
      fs.writeFileSync(
        outputFile,
        JSON.stringify(
          {
            extraction: result,
            assessment: result.assessment,
          },
          null,
          2
        )
      );
    }
  }

  return results;
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage:');
    console.error('  npx ts-node extract-self-assessment.ts <log-path>');
    console.error('  npx ts-node extract-self-assessment.ts --dir <directory> [--output <output-dir>]');
    process.exit(1);
  }

  if (args[0] === '--dir') {
    const dirPath = args[1];
    if (!dirPath) {
      console.error('Error: --dir requires a directory path');
      process.exit(1);
    }

    let outputDir: string | undefined;
    const outputIdx = args.indexOf('--output');
    if (outputIdx !== -1 && args[outputIdx + 1]) {
      outputDir = args[outputIdx + 1];
    }

    const results = await processDirectory(dirPath, outputDir);

    let successCount = 0;
    let failureCount = 0;

    console.log('\n--- Extraction Results ---\n');

    for (const [file, result] of results) {
      if (result.success) {
        successCount++;
        console.log(`\u2713 ${file}`);
        if (result.assessment) {
          console.log(`    Tool: ${result.assessment.tool_executed}`);
          console.log(`    Success: ${result.assessment.success} (${result.assessment.confidence} confidence)`);
        }
      } else {
        failureCount++;
        console.log(`\u2717 ${file}: ${result.error}`);
      }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Extracted: ${successCount}/${results.size}`);
    console.log(`Failed: ${failureCount}/${results.size}`);

    // Output results as JSON
    const summaryPath = path.join(dirPath, 'extraction-summary.json');
    const summary = {
      generated_at: new Date().toISOString(),
      total_files: results.size,
      success_count: successCount,
      failure_count: failureCount,
      results: Object.fromEntries(
        Array.from(results.entries()).map(([file, result]) => [
          file,
          {
            success: result.success,
            tool: result.assessment?.tool_executed,
            error: result.error,
          },
        ])
      ),
    };
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\nSummary written to: ${summaryPath}`);

    process.exit(failureCount > 0 && successCount === 0 ? 1 : 0);
  } else {
    // Single file mode
    const result = await extractSelfAssessment(args[0]);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }
}

// Export for testing
export { extractBetweenMarkers, parseAssessmentJson, parseSessionLog };

// Run if executed directly
if (require.main === module) {
  main().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}
