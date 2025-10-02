import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldContextSetArgs {
  projectId?: string;
  serverId?: string;
  orgId?: string;
  installationId?: string;
  stackId?: string;
}

interface ContextParameter {
  key: string;
  value: string;
  flag: string;
}

function buildCliArgs(args: MittwaldContextSetArgs): { argv: string[]; parameters: ContextParameter[] } {
  const argv: string[] = ['context', 'set'];
  const parameters: ContextParameter[] = [];

  if (args.projectId) {
    argv.push('--project-id', args.projectId);
    parameters.push({ key: 'project-id', value: args.projectId, flag: '--project-id' });
  }

  if (args.serverId) {
    argv.push('--server-id', args.serverId);
    parameters.push({ key: 'server-id', value: args.serverId, flag: '--server-id' });
  }

  if (args.orgId) {
    argv.push('--org-id', args.orgId);
    parameters.push({ key: 'org-id', value: args.orgId, flag: '--org-id' });
  }

  if (args.installationId) {
    argv.push('--installation-id', args.installationId);
    parameters.push({ key: 'installation-id', value: args.installationId, flag: '--installation-id' });
  }

  if (args.stackId) {
    argv.push('--stack-id', args.stackId);
    parameters.push({ key: 'stack-id', value: args.stackId, flag: '--stack-id' });
  }

  return { argv, parameters };
}

function mapCliError(error: CliToolError): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found')) {
    return `Invalid parameter value: ${error.stderr || error.stdout || error.message}`;
  }

  if (combined.includes('access denied')) {
    return `Access denied: ${error.stderr || error.stdout || error.message}`;
  }

  return error.message;
}

export const handleContextSetCli: MittwaldCliToolHandler<MittwaldContextSetArgs> = async (args) => {
  const { argv, parameters } = buildCliArgs(args);

  if (parameters.length === 0) {
    return formatToolResponse('error', 'At least one parameter must be provided to set context');
  }

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_context_set',
      argv,
      parser: (stdout) => stdout.trim(),
    });

    const parametersList = parameters.map((param) => `${param.key}: ${param.value}`).join(', ');
    const responseData = {
      message: 'Context parameters set successfully',
      parameters: Object.fromEntries(parameters.map((p) => [p.key, p.value])),
      output: result.result || null,
      timestamp: new Date().toISOString(),
    };

    return formatToolResponse(
      'success',
      `Context parameters set: ${parametersList}`,
      responseData,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
