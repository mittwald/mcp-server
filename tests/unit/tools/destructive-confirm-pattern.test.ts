import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleBackupDeleteCli } from '../../../src/handlers/tools/mittwald-cli/backup/delete-cli.js';
import { handleBackupScheduleDeleteCli } from '../../../src/handlers/tools/mittwald-cli/backup/schedule-delete-cli.js';
import { handleCronjobDeleteCli } from '../../../src/handlers/tools/mittwald-cli/cronjob/delete-cli.js';
import { handleMittwaldMailAddressDeleteCli } from '../../../src/handlers/tools/mittwald-cli/mail/address/delete-cli.js';
import { handleMittwaldMailDeliveryboxDeleteCli } from '../../../src/handlers/tools/mittwald-cli/mail/deliverybox/delete-cli.js';
import { handleDomainVirtualhostDeleteCli } from '../../../src/handlers/tools/mittwald-cli/domain/virtualhost-delete-cli.js';
import { handleSftpUserDeleteCli } from '../../../src/handlers/tools/mittwald-cli/sftp/user-delete-cli.js';
import { handleSshUserDeleteCli } from '../../../src/handlers/tools/mittwald-cli/ssh/user-delete-cli.js';
import { handleUserSshKeyDeleteCli } from '../../../src/handlers/tools/mittwald-cli/user/ssh-key/delete-cli.js';
import { handleOrgInviteRevokeCli } from '../../../src/handlers/tools/mittwald-cli/org/invite-revoke-cli.js';
import { handleContainerDeleteCli } from '../../../src/handlers/tools/mittwald-cli/container/delete-cli.js';
import { handleRegistryDeleteCli } from '../../../src/handlers/tools/mittwald-cli/registry/delete-cli.js';
import { handleStackDeleteCli } from '../../../src/handlers/tools/mittwald-cli/stack/delete-cli.js';
import { handleDatabaseMysqlDeleteCli } from '../../../src/handlers/tools/mittwald-cli/database/mysql/delete-cli.js';
import { handleDatabaseMysqlUserDeleteCli } from '../../../src/handlers/tools/mittwald-cli/database/mysql/user-delete-cli.js';
import { handleProjectDeleteCli } from '../../../src/handlers/tools/mittwald-cli/project/delete-cli.js';
import { logger } from '../../../src/utils/logger.js';

vi.mock('../../../src/tools/index.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/tools/index.js')>(
    '../../../src/tools/index.js'
  );

  return {
    ...actual,
    invokeCliTool: vi.fn(),
  };
});

const { invokeCliTool } = await import('../../../src/tools/index.js');
const mockInvokeCliTool = invokeCliTool as unknown as vi.MockInstance<any, any>;

const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

function parseResponse(payload: { content?: Array<{ text?: string }> }) {
  const content = payload.content?.[0]?.text ?? '{}';
  return JSON.parse(content);
}

beforeEach(() => {
  mockInvokeCliTool.mockReset();
  warnSpy.mockClear();
});

afterAll(() => {
  warnSpy.mockRestore();
});

describe('backup/delete-cli confirm guard', () => {
  it('rejects deletion without confirm flag', async () => {
    const response = await handleBackupDeleteCli({ backupId: 'b-123' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'Backup deleted', stderr: '' },
      meta: { command: 'mw backup delete', durationMs: 12 },
    });

    const response = await handleBackupDeleteCli({ backupId: 'b-123', confirm: true });
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_backup_delete',
      argv: ['backup', 'delete', 'b-123'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[BackupDelete] Destructive operation attempted', expect.objectContaining({
      backupId: 'b-123',
      force: false,
    }));
  });
});

describe('backup/schedule-delete-cli confirm guard', () => {
  it('rejects schedule deletion without confirm flag', async () => {
    const response = await handleBackupScheduleDeleteCli({ backupScheduleId: 'bs-123' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'Schedule deleted', stderr: '' },
      meta: { command: 'mw backup schedule delete', durationMs: 18 },
    });

    const response = await handleBackupScheduleDeleteCli({ backupScheduleId: 'bs-123', confirm: true });
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_backup_schedule_delete',
      argv: ['backup', 'schedule', 'delete', 'bs-123'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[BackupScheduleDelete] Destructive operation attempted', expect.objectContaining({
      backupScheduleId: 'bs-123',
    }));
  });
});

describe('cronjob/delete-cli confirm guard', () => {
  it('rejects cronjob deletion without confirm flag', async () => {
    const response = await handleCronjobDeleteCli({ cronjobId: 'cron-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'Cronjob deleted', stderr: '' },
      meta: { command: 'mw cronjob delete', durationMs: 9 },
    });

    const response = await handleCronjobDeleteCli({ cronjobId: 'cron-1', confirm: true, quiet: true });
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_cronjob_delete',
      argv: ['cronjob', 'delete', 'cron-1', '--quiet'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[CronjobDelete] Destructive operation attempted', expect.objectContaining({
      cronjobId: 'cron-1',
    }));
  });
});

describe('mail/address/delete-cli confirm guard', () => {
  it('rejects mail address deletion without confirm flag', async () => {
    const response = await handleMittwaldMailAddressDeleteCli({ id: 'addr-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'deleted', stderr: '' },
      meta: { command: 'mw mail address delete', durationMs: 15 },
    });

    const response = await handleMittwaldMailAddressDeleteCli({ id: 'addr-1', confirm: true });
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_mail_address_delete',
      argv: ['mail', 'address', 'delete', 'addr-1'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[MailAddressDelete] Destructive operation attempted', expect.objectContaining({
      addressId: 'addr-1',
    }));
  });
});

describe('mail/deliverybox/delete-cli confirm guard', () => {
  it('rejects delivery box deletion without confirm flag', async () => {
    const response = await handleMittwaldMailDeliveryboxDeleteCli({ id: 'box-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'deleted', stderr: '' },
      meta: { command: 'mw mail deliverybox delete', durationMs: 21 },
    });

    const response = await handleMittwaldMailDeliveryboxDeleteCli({ id: 'box-1', confirm: true, quiet: true });
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_mail_deliverybox_delete',
      argv: ['mail', 'deliverybox', 'delete', 'box-1', '--quiet'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[MailDeliveryboxDelete] Destructive operation attempted', expect.objectContaining({
      deliveryboxId: 'box-1',
    }));
  });
});

describe('domain/virtualhost/delete-cli confirm guard', () => {
  it('rejects virtualhost deletion without confirm flag', async () => {
    const response = await handleDomainVirtualhostDeleteCli({ virtualhostId: 'vh-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: '', stderr: '' },
      meta: { command: 'mw domain virtualhost delete', durationMs: 17 },
    });

    const response = await handleDomainVirtualhostDeleteCli({ virtualhostId: 'vh-1', confirm: true });
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_domain_virtualhost_delete',
      argv: ['domain', 'virtualhost', 'delete', 'vh-1'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[DomainVirtualhostDelete] Destructive operation attempted', expect.objectContaining({
      virtualhostId: 'vh-1',
    }));
  });
});

describe('sftp/user-delete-cli confirm guard', () => {
  it('rejects SFTP user deletion without confirm flag', async () => {
    const response = await handleSftpUserDeleteCli({ sftpUserId: 'sftp-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: 'SFTP deleted',
      meta: { command: 'mw sftp-user delete', durationMs: 11 },
    });

    const response = await handleSftpUserDeleteCli({ sftpUserId: 'sftp-1', confirm: true, quiet: true }, { sessionId: 'session', userId: 'user' } as any);
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_sftp_user_delete',
      argv: ['sftp-user', 'delete', 'sftp-1', '--quiet'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[SftpUserDelete] Destructive operation attempted', expect.objectContaining({
      sftpUserId: 'sftp-1',
      sessionId: 'session',
      userId: 'user',
    }));
  });
});

describe('ssh/user-delete-cli confirm guard', () => {
  it('rejects SSH user deletion without confirm flag', async () => {
    const response = await handleSshUserDeleteCli({ sshUserId: 'ssh-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'deleted', stderr: '' },
      meta: { command: 'mw ssh-user delete', durationMs: 13 },
    });

    const response = await handleSshUserDeleteCli({ sshUserId: 'ssh-1', confirm: true }, { sessionId: 'sess', userId: 'user' } as any);
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_ssh_user_delete',
      argv: ['ssh-user', 'delete', 'ssh-1'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[SshUserDelete] Destructive operation attempted', expect.objectContaining({
      sshUserId: 'ssh-1',
      sessionId: 'sess',
      userId: 'user',
    }));
  });
});

describe('user/ssh-key/delete-cli confirm guard', () => {
  it('rejects SSH key deletion without confirm flag', async () => {
    const response = await handleUserSshKeyDeleteCli({ keyId: 'key-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'deleted', stderr: '' },
      meta: { command: 'mw user ssh-key delete', durationMs: 14 },
    });

    const response = await handleUserSshKeyDeleteCli({ keyId: 'key-1', confirm: true, quiet: true }, { sessionId: 'sess', userId: 'usr' } as any);
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_user_ssh_key_delete',
      argv: ['user', 'ssh-key', 'delete', 'key-1', '--quiet'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[UserSshKeyDelete] Destructive operation attempted', expect.objectContaining({
      keyId: 'key-1',
      sessionId: 'sess',
      userId: 'usr',
    }));
  });
});

describe('org/invite-revoke-cli confirm guard', () => {
  it('rejects invite revocation without confirm flag', async () => {
    const response = await handleOrgInviteRevokeCli({ inviteId: 'inv-1' }, { sessionId: 'sess', userId: 'usr' } as any);
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'Invite revoked', stderr: '' },
      meta: { command: 'mw org invite revoke', durationMs: 8 },
    });

    const response = await handleOrgInviteRevokeCli({ inviteId: 'inv-1', confirm: true }, { sessionId: 'sess', userId: 'usr' } as any);
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_org_invite_revoke',
      argv: ['org', 'invite', 'revoke', 'inv-1'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[OrgInviteRevoke] Destructive operation attempted', expect.objectContaining({
      inviteId: 'inv-1',
      sessionId: 'sess',
      userId: 'usr',
    }));
  });
});

describe('container/delete-cli confirm guard', () => {
  it('rejects container deletion without confirm flag', async () => {
    const response = await handleContainerDeleteCli({ containerId: 'ctr-1', projectId: 'p-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'ctr-1\n', stderr: '' },
      meta: { command: 'mw container delete', durationMs: 20 },
    });

    const response = await handleContainerDeleteCli(
      { containerId: 'ctr-1', projectId: 'p-1', confirm: true, quiet: true },
      { sessionId: 'sess', userId: 'usr' } as any
    );
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_container_delete',
      argv: ['container', 'delete', 'ctr-1', '--project-id', 'p-1', '--quiet'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[ContainerDelete] Destructive operation attempted', expect.objectContaining({
      containerId: 'ctr-1',
      projectId: 'p-1',
      sessionId: 'sess',
      userId: 'usr',
    }));
  });
});

describe('registry/delete-cli confirm guard', () => {
  it('rejects registry deletion without confirm flag', async () => {
    const response = await handleRegistryDeleteCli({ registryId: 'reg-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: '', stderr: '' },
      meta: { command: 'mw registry delete', durationMs: 16 },
    });

    const response = await handleRegistryDeleteCli(
      { registryId: 'reg-1', confirm: true, force: true },
      { sessionId: 'sess', userId: 'usr' } as any
    );
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_registry_delete',
      argv: ['registry', 'delete', 'reg-1', '--force'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[RegistryDelete] Destructive operation attempted', expect.objectContaining({
      registryId: 'reg-1',
      sessionId: 'sess',
      userId: 'usr',
      force: true,
    }));
  });
});

describe('stack/delete-cli confirm guard', () => {
  it('rejects stack deletion without confirm flag', async () => {
    const response = await handleStackDeleteCli({ stackId: 'stack-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'stack-1\n', stderr: '' },
      meta: { command: 'mw stack delete', durationMs: 19 },
    });

    const response = await handleStackDeleteCli(
      { stackId: 'stack-1', confirm: true, withVolumes: true, quiet: true },
      { sessionId: 'sess', userId: 'usr' } as any
    );
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_stack_delete',
      argv: ['stack', 'delete', 'stack-1', '--quiet', '--with-volumes'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[StackDelete] Destructive operation attempted', expect.objectContaining({
      stackId: 'stack-1',
      withVolumes: true,
      sessionId: 'sess',
      userId: 'usr',
    }));
  });
});

describe('database/mysql/delete-cli confirm guard', () => {
  it('rejects database deletion without confirm flag', async () => {
    const response = await handleDatabaseMysqlDeleteCli({ databaseId: 'db-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'deleted', stderr: '' },
      meta: { command: 'mw database mysql delete', durationMs: 22 },
    });

    const response = await handleDatabaseMysqlDeleteCli(
      { databaseId: 'db-1', confirm: true, quiet: true },
      { sessionId: 'sess', userId: 'usr' } as any
    );
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_database_mysql_delete',
      argv: ['database', 'mysql', 'delete', 'db-1', '--quiet'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[DatabaseMysqlDelete] Destructive operation attempted', expect.objectContaining({
      databaseId: 'db-1',
      sessionId: 'sess',
      userId: 'usr',
    }));
  });
});

describe('database/mysql/user-delete-cli confirm guard', () => {
  it('rejects MySQL user deletion without confirm flag', async () => {
    const response = await handleDatabaseMysqlUserDeleteCli({ userId: 'mysql-user-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: 'deleted', stderr: '' },
      meta: { command: 'mw database mysql user delete', durationMs: 17 },
    });

    const response = await handleDatabaseMysqlUserDeleteCli(
      { userId: 'mysql-user-1', confirm: true },
      { sessionId: 'sess', userId: 'usr' } as any
    );
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_database_mysql_user_delete',
      argv: ['database', 'mysql', 'user', 'delete', 'mysql-user-1', '--quiet'],
      sessionId: 'sess',
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[DatabaseMysqlUserDelete] Destructive operation attempted', expect.objectContaining({
      mysqlUserId: 'mysql-user-1',
      sessionId: 'sess',
      userId: 'usr',
    }));
  });
});

describe('project/delete-cli confirm guard', () => {
  it('rejects project deletion without confirm flag', async () => {
    const response = await handleProjectDeleteCli({ projectId: 'p-1' });
    const payload = parseResponse(response);

    expect(payload.status).toBe('error');
    expect(payload.message).toContain('confirm=true');
    expect(mockInvokeCliTool).not.toHaveBeenCalled();
  });

  it('executes CLI when confirm=true', async () => {
    mockInvokeCliTool.mockResolvedValueOnce({
      ok: true,
      result: { stdout: '', stderr: '' },
      meta: { command: 'mw project delete', durationMs: 30 },
    });

    const response = await handleProjectDeleteCli(
      { projectId: 'p-1', confirm: true, quiet: true },
      { sessionId: 'sess', userId: 'usr' } as any
    );
    const payload = parseResponse(response);

    expect(payload.status).toBe('success');
    expect(mockInvokeCliTool).toHaveBeenCalledWith({
      toolName: 'mittwald_project_delete',
      argv: ['project', 'delete', 'p-1', '--quiet'],
      parser: expect.any(Function),
    });
    expect(warnSpy).toHaveBeenCalledWith('[ProjectDelete] Destructive operation attempted', expect.objectContaining({
      projectId: 'p-1',
      sessionId: 'sess',
      userId: 'usr',
    }));
  });
});
