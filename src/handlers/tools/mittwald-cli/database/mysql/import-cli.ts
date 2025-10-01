import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldDatabaseMysqlImportArgs {
  databaseId: string;
  input: string;
  quiet?: boolean;
  mysqlPassword?: string;
  mysqlCharset?: string;
  temporaryUser?: boolean;
  sshUser?: string;
  sshIdentityFile?: string;
  gzip?: boolean;
}

function buildCliArgs(args: MittwaldDatabaseMysqlImportArgs): string[] {
  const cliArgs: string[] = ['database', 'mysql', 'import', args.databaseId, '--input', args.input];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.mysqlPassword) cliArgs.push('--mysql-password', args.mysqlPassword);
  if (args.mysqlCharset) cliArgs.push('--mysql-charset', args.mysqlCharset);
  if (args.temporaryUser !== undefined) cliArgs.push(args.temporaryUser ? '--temporary-user' : '--no-temporary-user');
  if (args.sshUser) cliArgs.push('--ssh-user', args.sshUser);
  if (args.sshIdentityFile) cliArgs.push('--ssh-identity-file', args.sshIdentityFile);
  if (args.gzip) cliArgs.push('--gzip');

  return cliArgs;
}

function buildCliOptions(args: MittwaldDatabaseMysqlImportArgs) {
  const env: Record<string, string> = {};

  if (args.mysqlPassword) env.MYSQL_PWD = args.mysqlPassword;
  if (args.sshUser) env.MITTWALD_SSH_USER = args.sshUser;
  if (args.sshIdentityFile) env.MITTWALD_SSH_IDENTITY_FILE = args.sshIdentityFile;

  return {
    timeout: 300000,
    ...(Object.keys(env).length ? { env } : {}),
  };
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlImportArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const errorText = error.stderr || error.stdout || error.message;

  if (
    combined.includes('403') ||
    combined.includes('forbidden') ||
    combined.includes('permission denied')
  ) {
    return `Permission denied when importing to MySQL database. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorText}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    if (combined.includes('database')) {
      return `MySQL database not found. Please verify the database ID: ${args.databaseId}\nError: ${errorText}`;
    }
    return `Input file not found. Please verify the file path: ${args.input}\nError: ${errorText}`;
  }

  if (combined.includes('ssh') && combined.includes('connection')) {
    return `SSH connection failed. Check your SSH configuration and credentials.\nError: ${errorText}`;
  }

  if (combined.includes('password') && combined.includes('authentication')) {
    return `MySQL authentication failed. Check your password or enable temporary user option.\nError: ${errorText}`;
  }

  if (combined.includes('timeout') || combined.includes('timed out')) {
    return `Database import operation timed out. Try again or check file size and compression.\nError: ${errorText}`;
  }

  if (combined.includes('permission denied') && combined.includes('file')) {
    return `Cannot read input file. Check file permissions and path: ${args.input}\nError: ${errorText}`;
  }

  if (combined.includes('sql') && combined.includes('syntax')) {
    return `SQL syntax error in dump file. Please verify the dump file format and content.\nError: ${errorText}`;
  }

  if (combined.includes('disk') && combined.includes('space')) {
    return `Insufficient disk space for import operation. Please free up space or contact support.\nError: ${errorText}`;
  }

  return `Failed to import MySQL dump: ${errorText}`;
}

export const handleDatabaseMysqlImportCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlImportArgs> = async (args) => {
  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required.');
  }

  if (!args.input) {
    return formatToolResponse('error', 'Input path is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_import',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
      cliOptions: buildCliOptions(args),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;
    const inputSource = args.input === '-' || args.input === '/dev/stdin' ? 'stdin' : args.input;
    const message = args.quiet
      ? stdout || 'Import completed'
      : `Successfully imported MySQL dump from ${inputSource} to database '${args.databaseId}'`;

    return formatToolResponse(
      'success',
      message,
      {
        databaseId: args.databaseId,
        inputFile: args.input,
        compressed: args.gzip || false,
        temporaryUser: args.temporaryUser,
        success: true,
        output,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
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

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
