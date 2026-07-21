import { describe, expect, it } from 'vitest';
import { buildSshCommand, shellQuote } from '../../../src/utils/ssh-command.js';
import {
  buildRemoteMysqlCommand,
  MYSQL_PASSWORD_PLACEHOLDER,
} from '../../../src/utils/mysql-ssh-command.js';

describe('shellQuote', () => {
  it('leaves safe values unquoted', () => {
    expect(shellQuote('mysqldump')).toBe('mysqldump');
    expect(shellQuote('user@p-abc123')).toBe('user@p-abc123');
    expect(shellQuote('/html/app')).toBe('/html/app');
  });

  it('quotes values containing whitespace or shell metacharacters', () => {
    expect(shellQuote('my db')).toBe("'my db'");
    expect(shellQuote('a;rm -rf /')).toBe("'a;rm -rf /'");
    expect(shellQuote('$(whoami)')).toBe("'$(whoami)'");
  });

  it('escapes embedded single quotes', () => {
    expect(shellQuote("pa'ss")).toBe(`'pa'\\''ss'`);
  });
});

describe('buildSshCommand', () => {
  const base = { user: 'user@p-abc123', host: 'ssh.cluster.example' };

  it('builds a plain interactive connection', () => {
    expect(buildSshCommand(base)).toBe('ssh -l user@p-abc123 ssh.cluster.example');
  });

  it('includes an identity file when given', () => {
    expect(buildSshCommand({ ...base, identityFile: '~/.ssh/id_ed25519' })).toContain(
      '-i ~/.ssh/id_ed25519'
    );
  });

  it('appends the remote command as a single quoted argument', () => {
    const command = buildSshCommand({ ...base, remoteCommand: 'cd /html && ls -la' });

    expect(command).toBe("ssh -l user@p-abc123 ssh.cluster.example 'cd /html && ls -la'");
  });

  it('supports port forwarding flags', () => {
    const command = buildSshCommand({
      ...base,
      flags: ['-N', '-L', '3307:mysql.example:3306'],
    });

    expect(command).toBe('ssh -l user@p-abc123 -N -L 3307:mysql.example:3306 ssh.cluster.example');
  });
});

describe('buildRemoteMysqlCommand', () => {
  const base = {
    hostname: 'mysql-abc.example',
    user: 'dbuser',
    database: 'mydb',
    charset: 'utf8mb4',
  } as const;

  it('passes the password via MYSQL_PWD instead of -p', () => {
    const command = buildRemoteMysqlCommand({ ...base, binary: 'mysqldump', password: 's3cret' });

    expect(command).toBe(
      'MYSQL_PWD=s3cret mysqldump -h mysql-abc.example -u dbuser --default-character-set=utf8mb4 mydb'
    );
    expect(command).not.toContain('-ps3cret');
  });

  it('uses a placeholder when no password was supplied', () => {
    const command = buildRemoteMysqlCommand({ ...base, binary: 'mysqldump' });

    expect(command).toContain(`MYSQL_PWD='${MYSQL_PASSWORD_PLACEHOLDER}'`);
  });

  it('quotes passwords containing shell metacharacters', () => {
    const command = buildRemoteMysqlCommand({ ...base, binary: 'mysql', password: "pa'ss word" });

    expect(command.startsWith(`MYSQL_PWD='pa'\\''ss word'`)).toBe(true);
  });

  it('pipes through gzip when dumping compressed', () => {
    const command = buildRemoteMysqlCommand({
      ...base,
      binary: 'mysqldump',
      password: 'pw',
      gzip: true,
    });

    expect(command).toContain('set -o pipefail;');
    expect(command.endsWith('| gzip')).toBe(true);
  });

  it('reads through gunzip when importing compressed', () => {
    const command = buildRemoteMysqlCommand({
      ...base,
      binary: 'mysql',
      password: 'pw',
      gzip: true,
    });

    expect(command).toContain('gunzip | MYSQL_PWD=pw mysql ');
  });
});
