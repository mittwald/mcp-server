import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { assertStatus } from '@mittwald/api-client';
import { DDEVConfigBuilder } from '@mittwald/cli/dist/lib/ddev/config_builder.js';
import { getMittwaldClient } from '../services/mittwald/mittwald-client.js';

// Temporary YAML renderer; replaced with js-yaml in later task.
function renderYAML(config: Record<string, unknown>): string {
  const lines: string[] = [];

  const serializeValue = (key: string | null, value: unknown, indent = ''): void => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      const prefix = key ? `${indent}${key}:` : indent;
      lines.push(prefix);
      if (value.length === 0) {
        lines.push(`${indent}  -`);
        return;
      }
      value.forEach(item => {
        if (item && typeof item === 'object') {
          lines.push(`${indent}  -`);
          serializeValue(null, item, `${indent}    `);
        } else {
          lines.push(`${indent}  - ${item}`);
        }
      });
      return;
    }

    if (value && typeof value === 'object') {
      if (key) {
        lines.push(`${indent}${key}:`);
      }
      Object.entries(value).forEach(([childKey, childValue]) => {
        serializeValue(childKey, childValue, `${indent}${key ? '  ' : ''}`);
      });
      return;
    }

    if (key) {
      lines.push(`${indent}${key}: ${value}`);
    } else {
      lines.push(`${indent}${value}`);
    }
  };

  Object.entries(config).forEach(([key, value]) => {
    serializeValue(key, value);
  });

  return `${lines.join('\n')}\n`;
}

export const ddevConfigResource: Resource = {
  uri: 'mittwald://ddev/config/{appInstallationId}',
  name: 'DDEV Configuration Generator',
  description: 'Generates DDEV configuration YAML for a Mittwald app installation. Usage: mittwald://ddev/config/a-abc123',
  mimeType: 'application/x-yaml'
};

const APP_INSTALLATION_ID_PATTERN = /^a-[a-z0-9]+$/i;

type DdevProjectType = 'auto' | string;

type DdevConfigOptions = {
  appInstallationId: string;
  accessToken: string;
  databaseId?: string;
  projectType?: DdevProjectType;
};

function validateParameters({ appInstallationId }: DdevConfigOptions): void {
  if (!APP_INSTALLATION_ID_PATTERN.test(appInstallationId)) {
    throw new Error('Invalid app installation ID. Expected format: a-abc123');
  }
}

export async function generateDdevConfig(
  appInstallationId: string,
  accessToken: string,
  databaseId?: string,
  projectType: DdevProjectType = 'auto'
): Promise<string> {
  const options: DdevConfigOptions = { appInstallationId, accessToken, databaseId, projectType };
  validateParameters(options);

  const mittwaldClient = getMittwaldClient(accessToken);
  const apiClient = mittwaldClient.api;

  const appRes = await apiClient.app.getAppinstallation({ appInstallationId });
  assertStatus(appRes, 200);
  const app = appRes.data;

  let resolvedDatabaseId = databaseId;
  if (!resolvedDatabaseId && Array.isArray(app.linkedDatabases) && app.linkedDatabases.length > 0) {
    resolvedDatabaseId = app.linkedDatabases[0];
  }

  const builder = new DDEVConfigBuilder(apiClient);
  const config = await builder.build(appInstallationId, resolvedDatabaseId, projectType ?? 'auto');

  return renderYAML(config as Record<string, unknown>);
}
