import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { assertStatus } from '@mittwald/api-client';
import { DDEVConfigBuilder } from '@mittwald/cli/dist/lib/ddev/config_builder.js';
import { dump as yamlDump } from 'js-yaml';
import { getMittwaldClient } from '../services/mittwald/mittwald-client.js';

function renderYAML(config: Record<string, unknown>): string {
  return yamlDump(config, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  });
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
  if (!resolvedDatabaseId) {
    const linked = app.linkedDatabases ?? [];
    if (Array.isArray(linked) && linked.length > 0) {
      const primary = linked.find((entry) => entry?.purpose === 'primary');
      if (primary?.databaseId) {
        resolvedDatabaseId = primary.databaseId;
      }
    }
  }

  if (!resolvedDatabaseId) {
    const fallbackLinked = app.linkedDatabases as unknown;
    if (Array.isArray(fallbackLinked) && fallbackLinked.length > 0) {
      const coerce = (value: unknown): string | undefined => {
        if (typeof value === 'string') {
          return value;
        }

        if (value && typeof value === 'object') {
          const candidate = value as Record<string, unknown>;
          const mysqlId = candidate.mysqlDatabaseId;
          if (typeof mysqlId === 'string') {
            return mysqlId;
          }

          const genericId = candidate.databaseId;
          if (typeof genericId === 'string') {
            return genericId;
          }
        }

        return undefined;
      };

      const primaryCandidate = fallbackLinked.find((value) => {
        if (value && typeof value === 'object' && 'purpose' in (value as Record<string, unknown>)) {
          const purpose = (value as Record<string, unknown>).purpose;
          return purpose === 'primary';
        }

        return false;
      });

      resolvedDatabaseId = coerce(primaryCandidate) ?? coerce(fallbackLinked[0]);
    }
  }

  const builder = new DDEVConfigBuilder(apiClient);
  const config = await builder.build(appInstallationId, resolvedDatabaseId, projectType ?? 'auto');

  return renderYAML(config as Record<string, unknown>);
}
