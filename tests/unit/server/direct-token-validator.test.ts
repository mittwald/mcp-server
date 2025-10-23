import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { executeCli } from '../../../src/utils/cli-wrapper.js';
import { directTokenValidator, DirectTokenValidationError } from '../../../src/server/direct-token-validator.js';

vi.mock('../../../src/utils/cli-wrapper.js', () => ({
  executeCli: vi.fn(),
}));
vi.mock('../../../src/server/config.js', () => ({
  CONFIG: {
    DIRECT_TOKENS: {
      ENABLED: true,
      CACHE_TTL_MS: 5_000,
      SESSION_TTL_SECONDS: 1_800,
      VALIDATION_TIMEOUT_MS: 5_000,
    },
  },
}));

const mockExecuteCli = vi.mocked(executeCli);

describe('DirectTokenValidator', () => {
  beforeEach(() => {
    mockExecuteCli.mockReset();
    directTokenValidator.clear();
  });

  afterEach(() => {
    directTokenValidator.clear();
  });

  it('validates token via CLI and returns parsed info', async () => {
    const output = `
Login status

User identification    Id      0f452bff-81b5-496f-957f-ac30e4f37f9d
                       Email   rob@robshouse.net
Name                   Robert Douglass
Last password change   5 months ago
`.trim();

    mockExecuteCli.mockResolvedValue({
      stdout: output,
      stderr: '',
      exitCode: 0,
      durationMs: 10,
    });

    const result = await directTokenValidator.validate('mwat_token');

    expect(result).toMatchObject({
      userId: '0f452bff-81b5-496f-957f-ac30e4f37f9d',
      email: 'rob@robshouse.net',
      name: 'Robert Douglass',
      rawOutput: output,
    });
    expect(mockExecuteCli).toHaveBeenCalledWith(
      'mw',
      ['login', 'status', '--token', 'mwat_token'],
      expect.objectContaining({ timeout: 5_000 }),
    );
  });

  it('caches validation results for subsequent calls', async () => {
    const output = `
Login status

User identification    Id      0f452bff-81b5-496f-957f-ac30e4f37f9d
Name                   Robert Douglass
`.trim();

    mockExecuteCli.mockResolvedValue({
      stdout: output,
      stderr: '',
      exitCode: 0,
      durationMs: 10,
    });

    await directTokenValidator.validate('token-123');
    await directTokenValidator.validate('token-123');

    expect(mockExecuteCli).toHaveBeenCalledTimes(1);
  });

  it('throws DirectTokenValidationError when CLI exits non-zero', async () => {
    mockExecuteCli.mockResolvedValue({
      stdout: '',
      stderr: 'Unauthorized',
      exitCode: 1,
      durationMs: 5,
    });

    await expect(directTokenValidator.validate('invalid-token')).rejects.toBeInstanceOf(
      DirectTokenValidationError,
    );
  });

  it('throws DirectTokenValidationError when CLI output is missing user id', async () => {
    mockExecuteCli.mockResolvedValue({
      stdout: 'Login status\nName Someone',
      stderr: '',
      exitCode: 0,
      durationMs: 5,
    });

    await expect(directTokenValidator.validate('token-without-id')).rejects.toBeInstanceOf(
      DirectTokenValidationError,
    );
  });
});
