import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listStacks, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldStackListCliArgs {
  projectId?: string;
  revealEnvironmentVariables?: boolean;
}

const REDACTED = '[REDACTED]';

type RawServiceState = {
  envs?: Record<string, string>;
  [key: string]: unknown;
};

type RawService = {
  deployedState?: RawServiceState;
  pendingState?: RawServiceState;
  [key: string]: unknown;
};

type RawStack = {
  id?: string;
  description?: string;
  prefix?: string;
  services?: RawService[];
  volumes?: unknown;
  disabled?: boolean;
  projectId?: string;
};

function redactEnvs(envs: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!envs) {
    return envs;
  }

  return Object.fromEntries(Object.keys(envs).map((key) => [key, REDACTED]));
}

function redactServiceState(state: RawServiceState | undefined): RawServiceState | undefined {
  if (!state) {
    return state;
  }

  return { ...state, envs: redactEnvs(state.envs) };
}

function redactServiceEnvironment(service: RawService): RawService {
  return {
    ...service,
    deployedState: redactServiceState(service.deployedState),
    pendingState: redactServiceState(service.pendingState),
  };
}

function formatStacks(stacks: RawStack[], revealEnvironmentVariables: boolean) {
  return stacks.map((stack) => ({
    id: stack.id,
    description: stack.description,
    prefix: stack.prefix,
    services: revealEnvironmentVariables
      ? (stack.services ?? [])
      : (stack.services ?? []).map(redactServiceEnvironment),
    volumes: stack.volumes ?? [],
    disabled: stack.disabled ?? false,
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

    const stacks = result.data as RawStack[];
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
