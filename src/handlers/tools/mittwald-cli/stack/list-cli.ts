import type { MittwaldAPIV2 } from '@mittwald/api-client';
import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listStacks, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldStackListCliArgs {
  projectId?: string;
  revealEnvironmentVariables?: boolean;
}

type ContainerStackResponse = MittwaldAPIV2.Components.Schemas.ContainerStackResponse;
type ContainerServiceResponse = MittwaldAPIV2.Components.Schemas.ContainerServiceResponse;
type ContainerServiceState = MittwaldAPIV2.Components.Schemas.ContainerServiceState;

const REDACTED = '[REDACTED]';

function redactEnvs(envs: ContainerServiceState['envs']): ContainerServiceState['envs'] {
  if (!envs) {
    return envs;
  }

  return Object.fromEntries(Object.keys(envs).map((key) => [key, REDACTED]));
}

function redactServiceState(state: ContainerServiceState): ContainerServiceState {
  return { ...state, envs: redactEnvs(state.envs) };
}

function redactServiceEnvironment(service: ContainerServiceResponse): ContainerServiceResponse {
  return {
    ...service,
    deployedState: redactServiceState(service.deployedState),
    pendingState: redactServiceState(service.pendingState),
  };
}

function formatStacks(stacks: ContainerStackResponse[], revealEnvironmentVariables: boolean) {
  return stacks.map((stack) => ({
    id: stack.id,
    description: stack.description,
    prefix: stack.prefix,
    services: revealEnvironmentVariables
      ? (stack.services ?? [])
      : (stack.services ?? []).map(redactServiceEnvironment),
    volumes: stack.volumes ?? [],
    disabled: stack.disabled,
    projectId: stack.projectId,
  }));
}

export const handleStackListCli: MittwaldCliToolHandler<MittwaldStackListCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  // Validate required parameters
  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  try {
    const result = await listStacks({
      apiToken: session.mittwaldAccessToken,
      projectId: args.projectId,
    });

    const stacks = result.data as ContainerStackResponse[];
    const revealEnvironmentVariables = args.revealEnvironmentVariables === true;

    if (!stacks || stacks.length === 0) {
      return formatToolResponse(
        'success',
        'No container stacks found',
        []
      );
    }

    const redactionNotice = revealEnvironmentVariables
      ? ''
      : ' (environment variable values redacted; pass revealEnvironmentVariables=true to include them)';

    return formatToolResponse(
      'success',
      `Found ${stacks.length} container stack${stacks.length === 1 ? '' : 's'}${redactionNotice}`,
      formatStacks(stacks, revealEnvironmentVariables)
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      // Provide helpful error messages
      if (error.message.includes('not found') || error.code === 404) {
        return formatToolResponse('error', `Project not found. Please verify the project ID: ${args.projectId}`, {
          code: error.code,
          details: error.details,
        });
      }

      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    return formatToolResponse('error', `Failed to list container stacks: ${error instanceof Error ? error.message : String(error)}`);
  }
};
