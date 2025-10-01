import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldDatabaseMysqlCreateArgs {
  description: string;
  version: string;
  projectId?: string;
  quiet?: boolean;
  collation?: string;
  characterSet?: string;
  userPassword?: string;
  userExternal?: boolean;
  userAccessLevel?: "full" | "readonly";
}

function buildCliArgs(args: MittwaldDatabaseMysqlCreateArgs): string[] {
  const cliArgs: string[] = ['database', 'mysql', 'create'];

  cliArgs.push('--description', args.description);
  cliArgs.push('--version', args.version);

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.collation) cliArgs.push('--collation', args.collation);
  if (args.characterSet) cliArgs.push('--character-set', args.characterSet);
  if (args.userPassword) cliArgs.push('--user-password', args.userPassword);
  if (args.userExternal) cliArgs.push('--user-external');
  if (args.userAccessLevel) cliArgs.push('--user-access-level', args.userAccessLevel);
  if (args.timeout) cliArgs.push('--timeout', args.timeout);

  if (args.enable && args.disable) {
    // CLI only accepts either enable or disable
    cliArgs.push('--enable');
  } else if (args.enable) {
    cliArgs.push('--enable');
  } else if (args.disable) {
    cliArgs.push('--disable');
  }

  if (args.email) cliArgs.push('--email', args.email);
  if (args.url) cliArgs.push('--url', args.url);
  if (args.command) cliArgs.push('--command', args.command);
  if (args.interpreter) cliArgs.push('--interpreter', args.interpreter);

  return cliArgs;
}

function parseQuietIdentifier(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function extractDatabaseId(output: string): string | undefined {
  const match = output.match(/ID\s+([a-f0-9-]+)/i);
  return match ? match[1] : undefined;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlCreateArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('403')) {
    return `Permission denied when creating MySQL database. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${message}`;
  }

  if (combined.includes('version') && combined.includes('not supported')) {
    return `MySQL version '${args.version}' is not supported. Use 'database mysql versions' to list available versions.\nError: ${message}`;
  }

  if (combined.includes('invalid') && combined.includes('password')) {
    return `Invalid password provided. Please check password requirements.\nError: ${message}`;
  }

  if (combined.includes('400') || combined.includes('request failed with status code 400')) {
    return `Invalid request parameters for database creation. Please check:\n• Project ID: ${args.projectId ?? 'not specified'}\n• Password provided: ${args.userPassword ? 'yes' : 'no'}\n• MySQL version: ${args.version}\n\nError: ${message}`;
  }

  if (combined.includes('404') || combined.includes('request failed with status code 404')) {
    return `Database creation failed - resource not found. This might be due to project limitations or unavailable MySQL version.\nError: ${message}`;
  }

  return `Failed to create MySQL database: ${message}`;
}

function mapInteractiveOutput(stdout: string, stderr: string): string | undefined {
  const output = `${stdout}\n${stderr}`.toLowerCase();
  if (output.includes('interactive input required') || output.includes('enter password')) {
    return 'Command requires interactive input, but running in non-interactive mode. Provide --user-password or use a non-interactive authentication method.';
  }
  return undefined;
}

export const handleDatabaseMysqlCreateCli: MittwaldToolHandler<MittwaldDatabaseMysqlCreateArgs> = async (args) => {
  if (!args.projectId) {
    return formatToolResponse(
      'error',
      "Project ID is required for database creation. Please provide --project-id or set a default project context via 'mw context set --project-id=<PROJECT_ID>'."
    );
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_create',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
      cliOptions: {
        env: args.userPassword ? { MYSQL_PWD: args.userPassword } : undefined,
      },
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const interactiveMessage = mapInteractiveOutput(stdout, stderr);
    if (interactiveMessage) {
      return formatToolResponse('error', `${interactiveMessage}\nOutput: ${stdout}\n${stderr}`);
    }

    if (args.quiet) {
      const databaseId = parseQuietIdentifier(stdout) ?? parseQuietIdentifier(stderr);
      if (databaseId) {
        return formatToolResponse(
          'success',
          'Successfully created MySQL database',
          {
            id: databaseId,
            description: args.description,
            version: args.version,
            projectId: args.projectId,
            collation: args.collation,
            characterSet: args.characterSet,
            userAccessLevel: args.userAccessLevel,
            userExternal: args.userExternal,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      return formatToolResponse(
        'success',
        'Successfully created MySQL database',
        {
          description: args.description,
          version: args.version,
          projectId: args.projectId,
          output: stdout || stderr,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const databaseId = extractDatabaseId(stdout) ?? extractDatabaseId(stderr);

    const responseData = {
      id: databaseId,
      description: args.description,
      version: args.version,
      projectId: args.projectId,
      collation: args.collation,
      characterSet: args.characterSet,
      userAccessLevel: args.userAccessLevel,
      userExternal: args.userExternal,
      output: stdout || stderr,
    };

    const message = databaseId
      ? `Successfully created MySQL database '${args.description}' with ID ${databaseId}`
      : `Successfully created MySQL database '${args.description}'`;

    return formatToolResponse('success', message, responseData, {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    });
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
