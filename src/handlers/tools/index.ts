export * from './types.js';
export * from './get-channel.js';
export * from './get-post.js';
export * from './get-notifications.js';
export * from './search-reddit.js';
export * from './get-comment.js';
export * from './elicitation-example.js';
export * from './sampling-example.js';
export * from './structured-data-example.js';
export * from './logging.js';
export * from './validation-example.js';
export * from './mittwald/types.js';
export * from './mittwald/mail/index.js';

export type {
  ToolHandler,
  ToolHandlerContext,
  GetChannelArgs,
  GetPostArgs,
  GetNotificationsArgs,
  SearchRedditArgs,
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
export { handleSearchReddit } from './search-reddit.js';
export { handleGetComment } from './get-comment.js';
export { handleElicitationExample } from './elicitation-example.js';
export { handleSamplingExample } from './sampling-example.js';
export { handleStructuredDataExample } from './structured-data-example.js';
export { handleLogging } from './logging.js';
export { handleValidationExample } from './validation-example.js';

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
