import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Import the functions to test
import {
  extractBetweenMarkers,
  parseAssessmentJson,
  extractSelfAssessment,
  processDirectory,
} from '../extract-self-assessment';

describe('extractBetweenMarkers', () => {
  it('extracts JSON between markers', () => {
    const input = `Some text before
<!-- SELF_ASSESSMENT_START -->
{"success": true, "confidence": "high"}
<!-- SELF_ASSESSMENT_END -->
More text after`;

    const result = extractBetweenMarkers(input);
    expect(result).toBe('{"success": true, "confidence": "high"}');
  });

  it('handles markdown code blocks', () => {
    const input = `<!-- SELF_ASSESSMENT_START -->
\`\`\`json
{"success": true, "confidence": "high"}
\`\`\`
<!-- SELF_ASSESSMENT_END -->`;

    const result = extractBetweenMarkers(input);
    expect(result).toBe('{"success": true, "confidence": "high"}');
  });

  it('handles markdown code blocks without language specifier', () => {
    const input = `<!-- SELF_ASSESSMENT_START -->
\`\`\`
{"success": false}
\`\`\`
<!-- SELF_ASSESSMENT_END -->`;

    const result = extractBetweenMarkers(input);
    expect(result).toBe('{"success": false}');
  });

  it('returns null when markers are missing', () => {
    expect(extractBetweenMarkers('no markers here')).toBeNull();
  });

  it('returns null when only start marker present', () => {
    const input = `<!-- SELF_ASSESSMENT_START -->
{"success": true}`;
    expect(extractBetweenMarkers(input)).toBeNull();
  });

  it('returns null when only end marker present', () => {
    const input = `{"success": true}
<!-- SELF_ASSESSMENT_END -->`;
    expect(extractBetweenMarkers(input)).toBeNull();
  });

  it('returns null when markers are in wrong order', () => {
    const input = `<!-- SELF_ASSESSMENT_END -->
{"success": true}
<!-- SELF_ASSESSMENT_START -->`;
    expect(extractBetweenMarkers(input)).toBeNull();
  });

  it('handles whitespace around content', () => {
    const input = `<!-- SELF_ASSESSMENT_START -->

  {"success": true}

<!-- SELF_ASSESSMENT_END -->`;

    const result = extractBetweenMarkers(input);
    expect(result).toBe('{"success": true}');
  });
});

describe('parseAssessmentJson', () => {
  it('parses valid self-assessment JSON', () => {
    const json = JSON.stringify({
      success: true,
      confidence: 'high',
      tool_executed: 'mcp__mittwald__mittwald_user_get',
      timestamp: '2025-12-16T12:00:00Z',
      problems_encountered: [],
      resources_created: [],
      resources_verified: [],
    });

    const { assessment, error } = parseAssessmentJson(json);
    expect(error).toBeUndefined();
    expect(assessment).not.toBeNull();
    expect(assessment?.success).toBe(true);
    expect(assessment?.confidence).toBe('high');
    expect(assessment?.tool_executed).toBe('mcp__mittwald__mittwald_user_get');
  });

  it('validates required success field', () => {
    const json = JSON.stringify({
      confidence: 'high',
      tool_executed: 'test',
      timestamp: '2025-12-16T12:00:00Z',
    });

    const { assessment, error } = parseAssessmentJson(json);
    expect(assessment).toBeNull();
    expect(error).toContain('success');
  });

  it('validates confidence enum values', () => {
    const json = JSON.stringify({
      success: true,
      confidence: 'very_high', // Invalid
      tool_executed: 'test',
      timestamp: '2025-12-16T12:00:00Z',
    });

    const { assessment, error } = parseAssessmentJson(json);
    expect(assessment).toBeNull();
    expect(error).toContain('confidence');
  });

  it('validates tool_executed field', () => {
    const json = JSON.stringify({
      success: true,
      confidence: 'high',
      tool_executed: '', // Empty string
      timestamp: '2025-12-16T12:00:00Z',
    });

    const { assessment, error } = parseAssessmentJson(json);
    expect(assessment).toBeNull();
    expect(error).toContain('tool_executed');
  });

  it('validates timestamp field', () => {
    const json = JSON.stringify({
      success: true,
      confidence: 'high',
      tool_executed: 'test',
      timestamp: '', // Empty string
    });

    const { assessment, error } = parseAssessmentJson(json);
    expect(assessment).toBeNull();
    expect(error).toContain('timestamp');
  });

  it('handles malformed JSON', () => {
    const { assessment, error } = parseAssessmentJson('not valid json {');
    expect(assessment).toBeNull();
    expect(error).toContain('JSON parse error');
  });

  it('normalizes problem types to valid enum', () => {
    const json = JSON.stringify({
      success: false,
      confidence: 'medium',
      tool_executed: 'test',
      timestamp: '2025-12-16T12:00:00Z',
      problems_encountered: [
        { type: 'auth_error', description: 'Auth failed' },
        { type: 'invalid_type', description: 'Unknown' }, // Should normalize to 'other'
      ],
    });

    const { assessment, error } = parseAssessmentJson(json);
    expect(error).toBeUndefined();
    expect(assessment?.problems_encountered).toHaveLength(2);
    expect(assessment?.problems_encountered[0].type).toBe('auth_error');
    expect(assessment?.problems_encountered[1].type).toBe('other');
  });

  it('handles optional fields', () => {
    const json = JSON.stringify({
      success: true,
      confidence: 'high',
      tool_executed: 'test',
      timestamp: '2025-12-16T12:00:00Z',
      tool_response_summary: 'User data returned',
      execution_notes: 'All good',
    });

    const { assessment, error } = parseAssessmentJson(json);
    expect(error).toBeUndefined();
    expect(assessment?.tool_response_summary).toBe('User data returned');
    expect(assessment?.execution_notes).toBe('All good');
  });

  it('validates resources_created structure', () => {
    const json = JSON.stringify({
      success: true,
      confidence: 'high',
      tool_executed: 'test',
      timestamp: '2025-12-16T12:00:00Z',
      resources_created: [
        { type: 'project', id: 'p-123', name: 'Test Project', verified: true },
        { type: 'app', id: 'a-456' },
        { invalid: 'object' }, // Should be filtered out
      ],
    });

    const { assessment } = parseAssessmentJson(json);
    expect(assessment?.resources_created).toHaveLength(2);
    expect(assessment?.resources_created[0].name).toBe('Test Project');
    expect(assessment?.resources_created[0].verified).toBe(true);
    expect(assessment?.resources_created[1].name).toBeUndefined();
  });

  it('validates resources_verified structure', () => {
    const json = JSON.stringify({
      success: true,
      confidence: 'high',
      tool_executed: 'test',
      timestamp: '2025-12-16T12:00:00Z',
      resources_verified: [
        { type: 'project', id: 'p-123', status: 'exists' },
        { type: 'app', id: 'a-456', status: 'not_found' },
        { type: 'db', id: 'd-789', status: 'invalid_status' }, // Should normalize to 'error'
      ],
    });

    const { assessment } = parseAssessmentJson(json);
    expect(assessment?.resources_verified).toHaveLength(3);
    expect(assessment?.resources_verified[0].status).toBe('exists');
    expect(assessment?.resources_verified[1].status).toBe('not_found');
    expect(assessment?.resources_verified[2].status).toBe('error');
  });

  it('fails schema validation for invalid tool pattern', () => {
    const json = JSON.stringify({
      success: true,
      confidence: 'high',
      tool_executed: 'invalid_tool',
      timestamp: '2025-12-16T12:00:00Z',
      problems_encountered: [],
      resources_created: [],
      resources_verified: [],
    });

    const { assessment, error } = parseAssessmentJson(json);
    expect(assessment).toBeNull();
    expect(error).toContain('Schema validation failed');
  });
});

describe('extractSelfAssessment', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'self-assessment-test-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('extracts assessment from valid JSONL session log', async () => {
    const logContent = [
      JSON.stringify({ type: 'user', message: { content: 'Test the user/get tool' } }),
      JSON.stringify({
        type: 'assistant',
        message: {
          content: `I'll test the tool now.

<!-- SELF_ASSESSMENT_START -->
{
  "success": true,
  "confidence": "high",
  "tool_executed": "mcp__mittwald__mittwald_user_get",
  "timestamp": "2025-12-16T12:00:00Z",
  "problems_encountered": [],
  "resources_created": [],
  "resources_verified": [],
  "tool_response_summary": "User profile returned successfully"
}
<!-- SELF_ASSESSMENT_END -->`,
        },
      }),
    ].join('\n');

    const logPath = path.join(tempDir, 'valid-session.jsonl');
    fs.writeFileSync(logPath, logContent);

    const result = await extractSelfAssessment(logPath);

    expect(result.success).toBe(true);
    expect(result.assessment).not.toBeNull();
    expect(result.assessment?.success).toBe(true);
    expect(result.assessment?.tool_executed).toBe('mcp__mittwald__mittwald_user_get');
    expect(result.error).toBeUndefined();
  });

  it('handles array content format', async () => {
    const logContent = [
      JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            { type: 'text', text: 'First part. ' },
            {
              type: 'text',
              text: `<!-- SELF_ASSESSMENT_START -->
{"success": true, "confidence": "high", "tool_executed": "test", "timestamp": "2025-12-16T12:00:00Z"}
<!-- SELF_ASSESSMENT_END -->`,
            },
          ],
        },
      }),
    ].join('\n');

    const logPath = path.join(tempDir, 'array-content.jsonl');
    fs.writeFileSync(logPath, logContent);

    const result = await extractSelfAssessment(logPath);
    expect(result.success).toBe(true);
  });

  it('returns error for missing file', async () => {
    const result = await extractSelfAssessment('/nonexistent/path/file.jsonl');
    expect(result.success).toBe(false);
    expect(result.error).toContain('File not found');
  });

  it('returns error for empty log file', async () => {
    const logPath = path.join(tempDir, 'empty.jsonl');
    fs.writeFileSync(logPath, '');

    const result = await extractSelfAssessment(logPath);
    expect(result.success).toBe(false);
    expect(result.error).toContain('No assistant messages');
  });

  it('returns error when no markers found', async () => {
    const logContent = JSON.stringify({
      type: 'assistant',
      message: { content: 'No assessment here' },
    });

    const logPath = path.join(tempDir, 'no-markers.jsonl');
    fs.writeFileSync(logPath, logContent);

    const result = await extractSelfAssessment(logPath);
    expect(result.success).toBe(false);
    expect(result.error).toContain('No self-assessment markers');
  });

  it('handles malformed JSON lines gracefully', async () => {
    const logContent = [
      'not valid json',
      '{ broken json',
      JSON.stringify({
        type: 'assistant',
        message: {
          content: `<!-- SELF_ASSESSMENT_START -->
{"success": true, "confidence": "high", "tool_executed": "test", "timestamp": "2025-12-16T12:00:00Z"}
<!-- SELF_ASSESSMENT_END -->`,
        },
      }),
    ].join('\n');

    const logPath = path.join(tempDir, 'malformed-lines.jsonl');
    fs.writeFileSync(logPath, logContent);

    const result = await extractSelfAssessment(logPath);
    expect(result.success).toBe(true);
  });

  it('finds assessment in last message when multiple messages exist', async () => {
    const logContent = [
      JSON.stringify({
        type: 'assistant',
        message: {
          content: `<!-- SELF_ASSESSMENT_START -->
{"success": false, "confidence": "low", "tool_executed": "old_tool", "timestamp": "2025-12-16T11:00:00Z"}
<!-- SELF_ASSESSMENT_END -->`,
        },
      }),
      JSON.stringify({
        type: 'assistant',
        message: {
          content: `<!-- SELF_ASSESSMENT_START -->
{"success": true, "confidence": "high", "tool_executed": "new_tool", "timestamp": "2025-12-16T12:00:00Z"}
<!-- SELF_ASSESSMENT_END -->`,
        },
      }),
    ].join('\n');

    const logPath = path.join(tempDir, 'multiple-messages.jsonl');
    fs.writeFileSync(logPath, logContent);

    const result = await extractSelfAssessment(logPath);
    expect(result.success).toBe(true);
    expect(result.assessment?.tool_executed).toBe('new_tool');
  });

  it('returns explicit error when markers are present but empty', async () => {
    const logContent = JSON.stringify({
      type: 'assistant',
      message: {
        content: `<!-- SELF_ASSESSMENT_START -->

<!-- SELF_ASSESSMENT_END -->`,
      },
    });

    const logPath = path.join(tempDir, 'empty-markers.jsonl');
    fs.writeFileSync(logPath, logContent);

    const result = await extractSelfAssessment(logPath);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Empty self-assessment content');
  });
});

describe('processDirectory', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'batch-test-'));

    // Create valid session log
    const validLog = JSON.stringify({
      type: 'assistant',
      message: {
        content: `<!-- SELF_ASSESSMENT_START -->
{"success": true, "confidence": "high", "tool_executed": "tool1", "timestamp": "2025-12-16T12:00:00Z"}
<!-- SELF_ASSESSMENT_END -->`,
      },
    });
    fs.writeFileSync(path.join(tempDir, 'valid.jsonl'), validLog);

    // Create invalid session log
    fs.writeFileSync(path.join(tempDir, 'invalid.jsonl'), 'no assessment here');

    // Create non-jsonl file (should be ignored)
    fs.writeFileSync(path.join(tempDir, 'readme.txt'), 'ignore me');
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('processes multiple files in directory', async () => {
    const results = await processDirectory(tempDir);

    expect(results.size).toBe(2); // Only .jsonl files
    expect(results.get('valid.jsonl')?.success).toBe(true);
    expect(results.get('invalid.jsonl')?.success).toBe(false);
    expect(results.has('readme.txt')).toBe(false);
  });

  it('returns empty map for non-existent directory', async () => {
    const results = await processDirectory('/nonexistent/directory');
    expect(results.size).toBe(0);
  });
});
