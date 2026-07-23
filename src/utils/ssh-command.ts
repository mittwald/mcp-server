/**
 * @file Helpers for building SSH commands that the agent runs on its own machine
 * @module utils/ssh-command
 *
 * @remarks
 * The MCP server never opens SSH sessions, tunnels or interactive shells itself.
 * Tools that used to do so now resolve the connection data and return a
 * ready-to-run command instead.
 */

/**
 * Quotes a value for safe use inside a POSIX shell command.
 */
export function shellQuote(value: string): string {
  // "~" is left unquoted on purpose so that paths like ~/.ssh/id_ed25519 still expand.
  if (/^~?[A-Za-z0-9_@%+=:,./-]+$/.test(value)) {
    return value;
  }

  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export interface SshCommandOptions {
  /** SSH user (`<mStudio user>@<short id>`) */
  user: string;
  /** SSH host */
  host: string;
  /** Optional identity file (private key) */
  identityFile?: string;
  /** Extra ssh client flags, e.g. `['-L', '3306:host:3306']` */
  flags?: string[];
  /** Remote command to execute; omit for an interactive session */
  remoteCommand?: string;
}

/**
 * Builds an `ssh` invocation as a copy-pasteable command string.
 */
export function buildSshCommand(options: SshCommandOptions): string {
  const parts = ['ssh', '-l', shellQuote(options.user)];

  if (options.identityFile) {
    parts.push('-i', shellQuote(options.identityFile));
  }

  parts.push(...(options.flags ?? []).map(shellQuote));
  parts.push(shellQuote(options.host));

  if (options.remoteCommand) {
    parts.push(shellQuote(options.remoteCommand));
  }

  return parts.join(' ');
}

/**
 * Documentation shared by all tools that hand an SSH command back to the agent.
 */
export const SSH_USAGE_NOTE =
  'The command uses your local SSH client and respects your ~/.ssh/config, except for the ' +
  '"User" setting, which is overridden with the user shown above. SSH access requires an SSH ' +
  'key registered for your mStudio user (see mittwald_user_ssh_key_list / mittwald_ssh_user_list).';
