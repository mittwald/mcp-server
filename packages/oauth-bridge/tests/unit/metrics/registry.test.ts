import { describe, it, expect } from 'vitest';
import { register } from '../../../src/metrics/registry.js';

describe('OAuth Bridge Metrics Registry', () => {
  it('should create a registry with service="oauth-bridge" default label', async () => {
    const metrics = await register.metrics();

    // Verify service label is present
    expect(metrics).toContain('service="oauth-bridge"');
  });

  it('should collect default Node.js metrics', async () => {
    const metrics = await register.metrics();

    // Verify default metrics are present
    expect(metrics).toContain('nodejs_version_info');
    expect(metrics).toContain('process_cpu_seconds_total');
    expect(metrics).toContain('nodejs_heap_size_total_bytes');
  });

  it('should return valid Prometheus text format', async () => {
    const metrics = await register.metrics();

    // Verify format includes HELP and TYPE comments
    expect(metrics).toMatch(/# HELP \w+ .+/);
    expect(metrics).toMatch(/# TYPE \w+ (counter|gauge|histogram|summary)/);
  });

  it('should have correct content type', () => {
    expect(register.contentType).toContain('text/plain');
  });
});
