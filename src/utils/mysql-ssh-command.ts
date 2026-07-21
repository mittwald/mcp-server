/**
 * @file Helpers for building mysqldump/mysql commands that run over SSH
 * @module utils/mysql-ssh-command
 *
 * @remarks
 * The MCP server does not stream database dumps. Instead it resolves the MySQL
 * and SSH connection data and returns a command the agent runs locally, piping
 * the dump to/from its own filesystem.
 */

import { shellQuote } from './ssh-command.js';

/** Placeholder used when the caller did not supply the MySQL password. */
export const MYSQL_PASSWORD_PLACEHOLDER = '<mysql-password>';

/**
 * Builds the `MYSQL_PWD=... <binary> ...` part that is executed on the remote host.
 *
 * The password is passed via `MYSQL_PWD` rather than `-p<password>` so that it does
 * not show up in the remote process list.
 */
export function buildRemoteMysqlCommand(options: {
  binary: 'mysqldump' | 'mysql';
  hostname: string;
  user: string;
  database: string;
  password?: string;
  charset?: string;
  /** Pipe the output through gzip (dump) or read it through gunzip (import) */
  gzip?: boolean;
}): string {
  const args = ['-h', options.hostname, '-u', options.user];

  if (options.charset) {
    args.push(`--default-character-set=${options.charset}`);
  }

  args.push(options.database);

  const password = options.password ?? MYSQL_PASSWORD_PLACEHOLDER;
  const invocation = [options.binary, ...args.map(shellQuote)].join(' ');
  const prefix = `MYSQL_PWD=${options.password ? shellQuote(password) : `'${password}'`}`;

  if (!options.gzip) {
    return `${prefix} ${invocation}`;
  }

  return options.binary === 'mysqldump'
    ? `set -o pipefail; ${prefix} ${invocation} | gzip`
    : `set -o pipefail; gunzip | ${prefix} ${invocation}`;
}

/**
 * Note appended to dump/import instructions explaining the password handling.
 */
export function passwordNote(passwordProvided: boolean): string {
  return passwordProvided
    ? 'The MySQL password you supplied is embedded in the command via MYSQL_PWD. Treat the command as a credential.'
    : `Replace ${MYSQL_PASSWORD_PLACEHOLDER} with the password of the MySQL user before running the command. ` +
        'The MCP server cannot read existing passwords; reset it with mittwald_database_mysql_user_update if needed.';
}
