import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getAppVersions, listAllApps, resolveAppNameToUuid, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';
import { validate as validateUuid } from 'uuid';

interface MittwaldAppVersionsArgs {
  app?: string;
}

/**
 * Checks if a string is a valid UUID format.
 */
function isUuid(str: string): boolean {
  return validateUuid(str);
}

export const handleAppVersionsCli: MittwaldCliToolHandler<MittwaldAppVersionsArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    let appUuidsToQuery: string[] = [];

    if (args.app) {
      // App parameter provided: resolve to UUID if it's a name
      const appUuid = isUuid(args.app)
        ? args.app
        : (await resolveAppNameToUuid({ appName: args.app, apiToken: session.mittwaldAccessToken })).data;
      appUuidsToQuery = [appUuid];
    } else {
      // No app parameter: list all available apps
      const allApps = await listAllApps({ apiToken: session.mittwaldAccessToken });
      appUuidsToQuery = allApps.data.map((app: any) => app.id);
    }

    // Fetch versions for each app
    const allVersions: any[] = [];
    let totalDuration = 0;

    for (const appUuid of appUuidsToQuery) {
      const versionsResult = await getAppVersions({
        appId: appUuid,
        apiToken: session.mittwaldAccessToken,
      });

      totalDuration += versionsResult.durationMs || 0;

      // Extract externalVersion from each version object
      const versions = versionsResult.data.map((v: any) => ({
        appId: appUuid,
        versionId: v.id,
        version: v.externalVersion,
        internalVersion: v.internalVersion,
      }));

      allVersions.push(...versions);
    }

    const message = args.app
      ? `Found ${allVersions.length} version(s) for ${args.app}`
      : `Found ${allVersions.length} version(s) across ${appUuidsToQuery.length} apps`;

    return formatToolResponse(
      'success',
      message,
      allVersions,
      {
        durationMs: totalDuration,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      const message = error.message.toLowerCase().includes('not found') || error.message.includes('Access Denied')
        ? `App not found. Please verify the app name: ${args.app ?? 'not specified'}.`
        : error.message;

      return formatToolResponse('error', message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in app versions handler', { error });
    return formatToolResponse('error', `Failed to get app versions: ${error instanceof Error ? error.message : String(error)}`);
  }
};
