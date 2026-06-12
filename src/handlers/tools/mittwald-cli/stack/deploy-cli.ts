import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { declareStack, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { convertComposeToMittwald } from '../../../../utils/compose-to-mittwald.js';

interface MittwaldStackDeployCliArgs {
  stackId?: string;
  composeYaml?: string;
  envOverrides?: Record<string, string>;
}

export const handleStackDeployCli: MittwaldCliToolHandler<MittwaldStackDeployCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.stackId) {
    return formatToolResponse('error', 'Stack ID is required. Please provide the stackId parameter.');
  }

  if (!args.composeYaml) {
    return formatToolResponse('error', 'composeYaml is required. Please provide docker-compose YAML content as a string.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  // Convert docker-compose YAML to Mittwald format
  const conversion = convertComposeToMittwald(args.composeYaml, args.envOverrides);

  if (!conversion.success || !conversion.declaration) {
    return formatToolResponse('error', 'Failed to convert docker-compose YAML', {
      errors: conversion.errors,
      warnings: conversion.warnings,
    });
  }

  // Log warnings if any
  const warnings = conversion.warnings;

  try {
    const result = await declareStack({
      stackId: args.stackId,
      services: conversion.declaration.services,
      volumes: conversion.declaration.volumes,
      apiToken: session.mittwaldAccessToken,
    });

    const serviceNames = Object.keys(conversion.declaration.services);
    const volumeNames = Object.keys(conversion.declaration.volumes);

    return formatToolResponse(
      'success',
      `Stack declared successfully with ${serviceNames.length} service(s) and ${volumeNames.length} volume(s)`,
      {
        stackId: args.stackId,
        services: serviceNames,
        volumes: volumeNames,
        warnings: warnings.length > 0 ? warnings : undefined,
        result: result.data,
      },
      {
        durationMs: result.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
        conversionWarnings: warnings.length > 0 ? warnings : undefined,
      });
    }

    return formatToolResponse('error', `Failed to deploy stack: ${error instanceof Error ? error.message : String(error)}`);
  }
};
