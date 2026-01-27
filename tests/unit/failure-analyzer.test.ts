import { describe, it, expect } from 'vitest';
import {
  normalizeError,
  classifyErrorType,
  extractSignature,
  generatePatternId,
} from '../../evals/scripts/failure-analyzer.js';

describe('Failure Analyzer', () => {
  it('should normalize UUIDs', () => {
    const error = 'Resource abc123e4-5678-90ab-cdef-1234567890ab not found';
    const normalized = normalizeError(error);
    expect(normalized).toBe('resource <UUID> not found');
  });

  it('should normalize resource IDs', () => {
    const error = 'Project p-abc123 already exists';
    const normalized = normalizeError(error);
    expect(normalized).toBe('project <PROJECT_ID> already exists');
  });

  it('should normalize numbers', () => {
    const error = 'Quota exceeded: 100 of 50 allowed';
    const normalized = normalizeError(error);
    expect(normalized).toBe('quota exceeded: <NUM> of <NUM> allowed');
  });

  it('should classify OAuth scope errors', () => {
    const error = 'Required scope "project:write" not granted';
    const type = classifyErrorType(error);
    expect(type).toBe('oauth_scope_missing');
  });

  it('should classify resource not found errors', () => {
    const error = 'Project p-123 does not exist';
    const type = classifyErrorType(error);
    expect(type).toBe('resource_not_found');
  });

  it('should classify timeout errors', () => {
    const error = 'Request timed out after 30s';
    const type = classifyErrorType(error);
    expect(type).toBe('timeout');
  });

  it('should generate stable pattern IDs', () => {
    const sig1 = extractSignature('Missing scope: project:write', 'mittwald_project_create', 403);
    const sig2 = extractSignature('Missing scope: app:write', 'mittwald_project_create', 403);

    const id1 = generatePatternId(sig1);
    const id2 = generatePatternId(sig2);

    // Same tool + error type + status → same pattern ID
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^oauth-scope-missing-[a-f0-9]{6}$/);
  });
});
