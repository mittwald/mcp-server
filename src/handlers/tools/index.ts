export * from './types.js';
export * from './get-channel.js';
export * from './get-post.js';
export * from './get-notifications.js';
export * from './get-comment.js';
export * from './elicitation-example.js';
export * from './logging.js';
export * from './mittwald/types.js';
export * from './mittwald/mail/index.js';

export type {
  ToolHandler,
  ToolHandlerContext,
  GetChannelArgs,
  GetPostArgs,
  GetNotificationsArgs,
  GetCommentArgs,
  RedditPreferences,
  RedditSubredditConfig,
  FetchRedditContentArgs,
} from './types.js';

export type {
  PageInsightsPerformanceDataArgs,
  PageInsightsListPerformanceDataForProjectArgs,
  ServiceTokenAuthenticateArgs,
  VerificationVerifyAddressArgs,
  VerificationVerifyCompanyArgs,
  RelocationCreateRelocationArgs,
  RelocationCreateLegacyTariffChangeArgs,
  ArticleGetArticleArgs,
  ArticleListArticlesArgs,
  MiscellaneousApiArgs
} from '../../types/mittwald/miscellaneous.js';

export { handleGetChannel } from './get-channel.js';
export { handleGetPost } from './get-post.js';
export { handleGetNotifications } from './get-notifications.js';
export { handleGetComment } from './get-comment.js';
export { handleElicitationExample } from './elicitation-example.js';
export { handleLogging } from './logging.js';

// Export Mittwald mail handlers
export {
  handleListMailAddresses,
  handleCreateMailAddress,
  handleGetMailAddress,
  handleDeleteMailAddress,
  handleUpdateMailAddressAddress,
  handleUpdateMailAddressPassword,
  handleUpdateMailAddressQuota,
  handleUpdateMailAddressForwardAddresses,
  handleUpdateMailAddressAutoresponder,
  handleUpdateMailAddressSpamProtection,
  handleUpdateMailAddressCatchAll,
  handleListDeliveryBoxes,
  handleCreateDeliveryBox,
  handleGetDeliveryBox,
  handleDeleteDeliveryBox,
  handleUpdateDeliveryBoxDescription,
  handleUpdateDeliveryBoxPassword,
  handleListProjectMailSettings,
  handleUpdateProjectMailSetting,
} from './mittwald/mail/index.js';

// Export all Mittwald SSH/SFTP and Backup handlers
export {
  handleListSshKeys,
  handleCreateSshKey,
  handleGetSshKey,
  handleUpdateSshKey,
  handleDeleteSshKey,
  handleListSshUsers,
  handleCreateSshUser,
  handleGetSshUser,
  handleUpdateSshUser,
  handleDeleteSshUser,
  handleListSftpUsers,
  handleCreateSftpUser,
  handleGetSftpUser,
  handleUpdateSftpUser,
  handleDeleteSftpUser,
  handleListBackups,
  handleCreateBackup,
  handleGetBackup,
  handleDeleteBackup,
  handleUpdateBackupDescription,
  handleCreateBackupExport,
  handleDeleteBackupExport,
  handleListBackupSchedules,
  handleCreateBackupSchedule,
  handleGetBackupSchedule,
  handleUpdateBackupSchedule,
  handleDeleteBackupSchedule,
} from './mittwald/ssh-backup/index.js';

// Export SSH/Backup types
export type {
  ListSshKeysArgs,
  CreateSshKeyArgs,
  GetSshKeyArgs,
  UpdateSshKeyArgs,
  DeleteSshKeyArgs,
  ListSshUsersArgs,
  CreateSshUserArgs,
  GetSshUserArgs,
  UpdateSshUserArgs,
  DeleteSshUserArgs,
  ListSftpUsersArgs,
  CreateSftpUserArgs,
  GetSftpUserArgs,
  UpdateSftpUserArgs,
  DeleteSftpUserArgs,
  ListBackupsArgs,
  CreateBackupArgs,
  GetBackupArgs,
  DeleteBackupArgs,
  UpdateBackupDescriptionArgs,
  CreateBackupExportArgs,
  DeleteBackupExportArgs,
  ListBackupSchedulesArgs,
  CreateBackupScheduleArgs,
  GetBackupScheduleArgs,
  UpdateBackupScheduleArgs,
  DeleteBackupScheduleArgs,
} from './mittwald/ssh-backup/index.js';
