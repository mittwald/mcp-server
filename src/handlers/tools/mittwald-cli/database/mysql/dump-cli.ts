import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { getMysqlConnection, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { buildSshCommand, SSH_USAGE_NOTE, shellQuote } from '../../../../../utils/ssh-command.js';
import { buildRemoteMysqlCommand, passwordNote } from '../../../../../utils/mysql-ssh-command.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseMysqlDumpArgs {
  databaseId?: string;
  output?: string;
  mysqlPassword?: string;
  mysqlCharset?: string;
  gzip?: boolean;
  sshUser?: string;
  sshIdentityFile?: string;
}

export const handleDatabaseMysqlDumpCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlDumpArgs> = async (
  args,
  sessionId
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required. Please provide the databaseId parameter.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getMysqlConnection({
      databaseId: args.databaseId,
      sshUser: args.sshUser,
      apiToken: session.mittwaldAccessToken,
    });

    const { database, hostname, databaseUser, characterSet, sshHost, sshUser } = result.data;
    const outputFile = args.output ?? `${database}.sql${args.gzip ? '.gz' : ''}`;

    const remoteCommand = buildRemoteMysqlCommand({
      binary: 'mysqldump',
      hostname,
      user: databaseUser,
      database,
      password: args.mysqlPassword,
      charset: args.mysqlCharset ?? characterSet,
      gzip: args.gzip,
    });

    const sshCommand = buildSshCommand({
      user: sshUser,
      host: sshHost,
      identityFile: args.sshIdentityFile,
      remoteCommand: args.gzip ? `bash -c ${shellQuote(remoteCommand)}` : remoteCommand,
    });

    const command = `${sshCommand} > ${shellQuote(outputFile)}`;

    return formatToolResponse(
      'success',
      `mysqldump instructions for database ${database}`,
      {
        databaseId: result.data.databaseId,
        database,
        databaseUser,
        hostname,
        characterSet: args.mysqlCharset ?? characterSet,
        sshHost,
        sshUser,
        outputFile,
        gzip: Boolean(args.gzip),
        command,
        instructions:
          'Run the command below on your own machine; this MCP server does not stream dumps.\n\n' +
          `${command}\n\n` +
          `mysqldump runs on the hosting environment and the dump is written to ${outputFile} locally.\n` +
          `${passwordNote(Boolean(args.mysqlPassword))}\n\n` +
          SSH_USAGE_NOTE,
      },
      { durationMs: result.durationMs }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('Unexpected error in MySQL dump handler', { error });
    return formatToolResponse(
      'error',
      `Failed to build mysqldump instructions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
