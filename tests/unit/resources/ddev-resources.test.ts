import { describe, expect, it, beforeEach, vi } from 'vitest';

const getAppinstallationMock = vi.fn();
const builderBuildMock = vi.fn();

vi.mock('../../../src/services/mittwald/mittwald-client.js', () => ({
  getMittwaldClient: vi.fn(() => ({
    api: {
      app: {
        getAppinstallation: getAppinstallationMock
      }
    }
  }))
}));

vi.mock('@mittwald/cli/dist/lib/ddev/config_builder.js', () => ({
  DDEVConfigBuilder: vi.fn().mockImplementation(() => ({
    build: builderBuildMock
  }))
}));

import { generateDdevConfig } from '../../../src/resources/ddev-config-generator.js';
import { generateDdevSetupInstructions } from '../../../src/resources/ddev-setup-instructions.js';

const APP_INSTALLATION_ID = 'a-test123';
const ACCESS_TOKEN = 'test-token';

beforeEach(() => {
  vi.clearAllMocks();

  getAppinstallationMock.mockResolvedValue({
    status: 200,
    data: {
      appInstallationId: APP_INSTALLATION_ID,
      shortId: 'a-test123',
      description: 'Demo Mittwald App',
      linkedDatabases: ['db-123'],
      systemSoftware: [],
    }
  });

  builderBuildMock.mockResolvedValue({
    type: 'auto',
    webserver_type: 'apache-fpm',
    php_version: '8.2',
    database: { type: 'mysql', version: '8.0' },
    docroot: 'web',
    web_environment: [
      'MITTWALD_APP_INSTALLATION_ID=a-test123',
      'MITTWALD_DATABASE_ID=db-123'
    ],
    hooks: {
      'post-pull': [
        { 'exec-host': 'ddev config --project-name $DDEV_PROJECT' }
      ]
    }
  });
});

describe('DDEV Resources', () => {
  it('should match config URI pattern', () => {
    const uri = 'mittwald://ddev/config/a-abc123';
    const match = uri.match(/^mittwald:\/\/ddev\/config\/([a-z0-9-]+)$/i);
    expect(match).toBeTruthy();
    expect(match?.[1]).toBe('a-abc123');
  });

  it('should generate valid YAML config', async () => {
    const yaml = await generateDdevConfig(APP_INSTALLATION_ID, ACCESS_TOKEN);
    expect(yaml).toContain('type: auto');
    expect(yaml).toContain("php_version: '8.2'");
    expect(yaml).toContain('MITTWALD_APP_INSTALLATION_ID=a-test123');
  });

  it('should generate setup instructions with resource links', async () => {
    const markdown = await generateDdevSetupInstructions(APP_INSTALLATION_ID, ACCESS_TOKEN);
    expect(markdown).toContain('mittwald://ddev/config/a-test123');
    expect(markdown).toContain('ddev start');
  });
});
