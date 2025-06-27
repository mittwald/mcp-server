/**
 * @file Type definitions for Mittwald SSH/SFTP and Backup APIs
 * @module types/mittwald/ssh-backup
 */

// SSH Key Types
export interface SshKey {
  id: string;
  label: string;
  publicKey: string;
  fingerprint: string;
  createdAt: string;
  expiresAt?: string;
}

export interface CreateSshKeyRequest {
  label: string;
  publicKey: string;
  expiresAt?: string;
}

export interface UpdateSshKeyRequest {
  label?: string;
  expiresAt?: string;
}

// SSH User Types
export interface SshUser {
  id: string;
  username: string;
  description?: string;
  homeDirectory: string;
  publicKeys: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSshUserRequest {
  username: string;
  description?: string;
  publicKeys?: string[];
}

export interface UpdateSshUserRequest {
  description?: string;
  publicKeys?: string[];
  status?: 'active' | 'inactive';
}

// SFTP User Types
export interface SftpUser {
  id: string;
  username: string;
  description?: string;
  homeDirectory: string;
  password?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSftpUserRequest {
  username: string;
  description?: string;
  password?: string;
}

export interface UpdateSftpUserRequest {
  description?: string;
  password?: string;
  status?: 'active' | 'inactive';
}

// Backup Types
export interface ProjectBackup {
  id: string;
  projectId: string;
  description?: string;
  status: 'Pending' | 'Creating' | 'Completed' | 'Failed' | 'Cancelled';
  deletable: boolean;
  requestedAt: string;
  createdAt?: string;
  expiresAt?: string;
  parentId?: string;
  export?: ProjectBackupExport;
}

export interface ProjectBackupExport {
  format: string;
  withPassword: boolean;
  phase?: 'Pending' | 'Exporting' | 'Failed' | 'Completed' | 'Expired';
  downloadURL?: string;
  expiresAt?: string;
  sha256Checksum?: string;
}

export interface CreateBackupRequest {
  description?: string;
  expirationTime?: string;
  ignoredSources?: IgnoredSources;
}

export interface IgnoredSources {
  files: boolean;
  databases?: DatabaseReference[];
}

export interface DatabaseReference {
  kind: string;
  name: string;
}

export interface UpdateBackupDescriptionRequest {
  description: string;
}

export interface CreateBackupExportRequest {
  format?: string;
  withPassword?: boolean;
  password?: string;
}

// Backup Schedule Types
export interface ProjectBackupSchedule {
  id: string;
  projectId: string;
  description?: string;
  schedule: string; // crontab format
  ttl?: string; // time string like "7d"
  isSystemBackup: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBackupScheduleRequest {
  description?: string;
  schedule: string;
  ttl?: string;
}

export interface UpdateBackupScheduleRequest {
  description?: string;
  schedule?: string;
  ttl?: string;
}

// Tool Argument Types
export interface ListSshKeysArgs {
  // No additional parameters for listing user's SSH keys
}

export interface CreateSshKeyArgs {
  label: string;
  publicKey: string;
  expiresAt?: string;
}

export interface GetSshKeyArgs {
  sshKeyId: string;
}

export interface UpdateSshKeyArgs {
  sshKeyId: string;
  label?: string;
  expiresAt?: string;
}

export interface DeleteSshKeyArgs {
  sshKeyId: string;
}

export interface ListSshUsersArgs {
  projectId: string;
}

export interface CreateSshUserArgs {
  projectId: string;
  username: string;
  description?: string;
  publicKeys?: string[];
}

export interface GetSshUserArgs {
  sshUserId: string;
}

export interface UpdateSshUserArgs {
  sshUserId: string;
  description?: string;
  publicKeys?: string[];
  status?: 'active' | 'inactive';
}

export interface DeleteSshUserArgs {
  sshUserId: string;
}

export interface ListSftpUsersArgs {
  projectId: string;
}

export interface CreateSftpUserArgs {
  projectId: string;
  username: string;
  description?: string;
  password?: string;
}

export interface GetSftpUserArgs {
  sftpUserId: string;
}

export interface UpdateSftpUserArgs {
  sftpUserId: string;
  description?: string;
  password?: string;
  status?: 'active' | 'inactive';
}

export interface DeleteSftpUserArgs {
  sftpUserId: string;
}

export interface ListBackupsArgs {
  projectId: string;
  sort?: 'oldestFirst' | 'newestFirst';
  limit?: number;
  offset?: number;
}

export interface CreateBackupArgs {
  projectId: string;
  description?: string;
  expirationTime?: string;
  ignoredSources?: IgnoredSources;
}

export interface GetBackupArgs {
  projectBackupId: string;
}

export interface DeleteBackupArgs {
  projectBackupId: string;
}

export interface UpdateBackupDescriptionArgs {
  projectBackupId: string;
  description: string;
}

export interface CreateBackupExportArgs {
  projectBackupId: string;
  format?: string;
  withPassword?: boolean;
  password?: string;
}

export interface DeleteBackupExportArgs {
  projectBackupId: string;
}

export interface ListBackupSchedulesArgs {
  projectId: string;
}

export interface CreateBackupScheduleArgs {
  projectId: string;
  description?: string;
  schedule: string;
  ttl?: string;
}

export interface GetBackupScheduleArgs {
  projectBackupScheduleId: string;
}

export interface UpdateBackupScheduleArgs {
  projectBackupScheduleId: string;
  description?: string;
  schedule?: string;
  ttl?: string;
}

export interface DeleteBackupScheduleArgs {
  projectBackupScheduleId: string;
}