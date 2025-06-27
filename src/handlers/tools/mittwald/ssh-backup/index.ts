/**
 * @file Export all Mittwald SSH/SFTP and Backup API handlers
 * @module handlers/tools/mittwald/ssh-backup
 */

// SSH Key handlers
export {
  handleListSshKeys,
  handleCreateSshKey,
  handleGetSshKey,
  handleUpdateSshKey,
  handleDeleteSshKey,
} from './ssh-keys.js';

// SSH User handlers
export {
  handleListSshUsers,
  handleCreateSshUser,
  handleGetSshUser,
  handleUpdateSshUser,
  handleDeleteSshUser,
} from './ssh-users.js';

// SFTP User handlers
export {
  handleListSftpUsers,
  handleCreateSftpUser,
  handleGetSftpUser,
  handleUpdateSftpUser,
  handleDeleteSftpUser,
} from './sftp-users.js';

// Backup handlers
export {
  handleListBackups,
  handleCreateBackup,
  handleGetBackup,
  handleDeleteBackup,
  handleUpdateBackupDescription,
  handleCreateBackupExport,
  handleDeleteBackupExport,
} from './backups.js';

// Backup Schedule handlers
export {
  handleListBackupSchedules,
  handleCreateBackupSchedule,
  handleGetBackupSchedule,
  handleUpdateBackupSchedule,
  handleDeleteBackupSchedule,
} from './backup-schedules.js';