/**
 * @file MCP Tool request handlers
 * @module handlers/tool-handlers
 * 
 * @remarks
 * This module implements the MCP tool handling functionality for CLI-based tools,
 * managing both tool listing and tool invocation. It serves as the main entry point
 * for all tool-related operations in the MCP server.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools Specification}
 */

import type {
  CallToolRequest,
  CallToolResult,
  ListToolsRequest,
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TOOLS, TOOL_ERROR_MESSAGES } from '../constants/tools.js';
import { logger } from '../utils/logger.js';
import type { MCPToolContext } from '../types/request-context.js';
import type { ToolHandlerContext } from './tools/types.js';
import { filterTools, getToolCategories, getToolCountByCategory } from '../utils/tool-filter.js';
import { CONFIG } from '../server/config.js';
import {
  handleProjectCreate,
  handleProjectDelete,
  handleProjectGet,
  handleProjectFilesystemUsage,
  handleDomainVirtualhostList,
  handleDomainVirtualhostCreate,
  handleDomainVirtualhostDelete,
  handleDomainVirtualhostGet,
  handleDomainVirtualhost,
  handleVirtualHostHelp,
  handleExtension,
  handleExtensionInstall,
  handleExtensionListInstalled,
  handleExtensionList,
  handleExtensionUninstall,
} from './tools/index.js';
import { handleProjectFilesystem } from './tools/mittwald-cli/project/filesystem.js';
import { handleProjectInviteListOwnCli } from './tools/mittwald-cli/project/invite-list-own-cli.js';
import { handleProjectInviteListCli } from './tools/mittwald-cli/project/invite-list-cli.js';
import { handleProjectInviteGetCli } from './tools/mittwald-cli/project/invite-get-cli.js';
import { handleMittwaldProjectList } from './tools/mittwald-cli/project/list.js';
import { handleProjectSSH } from './tools/mittwald-cli/project/ssh.js';
import { handleProject } from './tools/mittwald-cli/project/project.js';
import { handleMittwaldProjectInvite } from './tools/mittwald-cli/project/invite.js';
import { handleMittwaldProjectMembership } from './tools/mittwald-cli/project/membership.js';
import { handleProjectMembershipGetCli } from './tools/mittwald-cli/project/membership-get-cli.js';
import { handleProjectMembershipGetOwnCli } from './tools/mittwald-cli/project/membership-get-own-cli.js';
import { handleProjectMembershipListCli } from './tools/mittwald-cli/project/membership-list-cli.js';
import { handleProjectMembershipListOwnCli } from './tools/mittwald-cli/project/membership-list-own-cli.js';
import { handleProjectUpdate } from './tools/mittwald-cli/project/update.js';

// Core project CLI handlers
import { handleMittwaldProjectListCli } from './tools/mittwald-cli/project/list-cli.js';
import { handleProjectGetCli } from './tools/mittwald-cli/project/get-cli.js';
import { handleProjectCreateCli } from './tools/mittwald-cli/project/create-cli.js';
import { handleProjectDeleteCli } from './tools/mittwald-cli/project/delete-cli.js';
import { handleProjectUpdateCli } from './tools/mittwald-cli/project/update-cli.js';
import { handleProjectSshCli } from './tools/mittwald-cli/project/ssh-cli.js';
import { handleProjectFilesystemUsageCli } from './tools/mittwald-cli/project/filesystem-usage-cli.js';

import { handleServerList } from './tools/mittwald-cli/server/list.js';
import { handleServerGet } from './tools/mittwald-cli/server/get.js';
import { handleServer } from './tools/mittwald-cli/server/server.js';

// Agent 2 app dependency handlers
import { handleMittwaldAppDependencyUpdate } from './tools/mittwald-cli/app/dependency/update.js';
import { handleMittwaldAppDependencyVersions } from './tools/mittwald-cli/app/dependency/versions.js';
import { handleMittwaldAppDependencyList } from './tools/mittwald-cli/app/dependency/list.js';
import { handleMittwaldAppDependencyGet } from './tools/mittwald-cli/app/dependency/get.js';

// Agent 2 app management handlers
import { handleMittwaldAppDownload } from './tools/mittwald-cli/app/download.js';
import { handleMittwaldAppGet } from './tools/mittwald-cli/app/get.js';
import { handleMittwaldAppInstall } from './tools/mittwald-cli/app/install.js';
import { handleAppInstallContao } from './tools/mittwald-cli/app/install/contao.js';
import { handleMittwaldAppListUpgradeCandidates } from './tools/mittwald-cli/app/list/upgrade-candidates.js';

// Agent 3 app install handlers
import { handleAppInstallJoomla } from './tools/mittwald-cli/app/install/joomla.js';
import { handleAppInstallMatomo } from './tools/mittwald-cli/app/install/matomo.js';
import { handleAppInstallNextcloud } from './tools/mittwald-cli/app/install/nextcloud.js';
import { handleAppInstallShopware5 } from './tools/mittwald-cli/app/install/shopware5.js';
import { handleAppInstallShopware6 } from './tools/mittwald-cli/app/install/shopware6.js';
import { handleAppInstallTypo3 } from './tools/mittwald-cli/app/install/typo3.js';
import { handleAppInstallWordpress } from './tools/mittwald-cli/app/install/wordpress.js';

// Agent 3 app install CLI wrapper handlers
import { handleAppInstallWordpressCli } from './tools/mittwald-cli/app/install/wordpress-cli.js';
import { handleAppInstallTypo3Cli } from './tools/mittwald-cli/app/install/typo3-cli.js';
import { handleAppInstallNextcloudCli } from './tools/mittwald-cli/app/install/nextcloud-cli.js';
import { handleAppInstallContaoCli } from './tools/mittwald-cli/app/install/contao-cli.js';
import { handleAppInstallJoomlaCli } from './tools/mittwald-cli/app/install/joomla-cli.js';
import { handleAppInstallMatomoCli } from './tools/mittwald-cli/app/install/matomo-cli.js';
import { handleAppInstallShopware5Cli } from './tools/mittwald-cli/app/install/shopware5-cli.js';
import { handleAppInstallShopware6Cli } from './tools/mittwald-cli/app/install/shopware6-cli.js';

// App create handlers
import { handleAppCreateNode } from './tools/mittwald-cli/app/create/node.js';
import { handleAppCreatePhp } from './tools/mittwald-cli/app/create/php.js';
import { handleAppCreatePhpWorker } from './tools/mittwald-cli/app/create/php-worker.js';
import { handleAppCreatePython } from './tools/mittwald-cli/app/create/python.js';
import { handleAppCreateStatic } from './tools/mittwald-cli/app/create/static.js';

// App create CLI handlers
import { handleAppCreateNodeCli } from './tools/mittwald-cli/app/create/node-cli.js';
import { handleAppCreatePhpCli } from './tools/mittwald-cli/app/create/php-cli.js';
import { handleAppCreatePhpWorkerCli } from './tools/mittwald-cli/app/create/php-worker-cli.js';
import { handleAppCreatePythonCli } from './tools/mittwald-cli/app/create/python-cli.js';
import { handleAppCreateStaticCli } from './tools/mittwald-cli/app/create/static-cli.js';

// Agent 3 app management handlers
import { handleApp } from './tools/mittwald-cli/app/app.js';
import { handleAppCopy } from './tools/mittwald-cli/app/copy.js';
import { handleAppCreate } from './tools/mittwald-cli/app/create.js';
import { handleAppList } from './tools/mittwald-cli/app/list.js';
import { handleAppOpen } from './tools/mittwald-cli/app/open.js';
import { handleAppSsh } from './tools/mittwald-cli/app/ssh.js';
import { handleAppUninstall } from './tools/mittwald-cli/app/uninstall.js';
import { handleAppUpdate } from './tools/mittwald-cli/app/update.js';
import { handleAppUpload } from './tools/mittwald-cli/app/upload.js';
import { handleAppVersions } from './tools/mittwald-cli/app/versions.js';
import { handleAppUpgrade, mittwald_app_upgrade_handler, mittwald_app_upgrade_schema } from './tools/mittwald-cli/app/upgrade.js';

// Agent 1 app management CLI handlers
import { handleAppListCli } from './tools/mittwald-cli/app/list-cli.js';
import { handleAppGetCli } from './tools/mittwald-cli/app/get-cli.js';
import { handleAppCopyCli } from './tools/mittwald-cli/app/copy-cli.js';
import { handleAppDownloadCli } from './tools/mittwald-cli/app/download-cli.js';
import { handleAppOpenCli } from './tools/mittwald-cli/app/open-cli.js';
import { handleAppSshCli } from './tools/mittwald-cli/app/ssh-cli.js';
import { handleAppUninstallCli } from './tools/mittwald-cli/app/uninstall-cli.js';
import { handleAppUpdateCli } from './tools/mittwald-cli/app/update-cli.js';
import { handleAppUpgradeCli } from './tools/mittwald-cli/app/upgrade-cli.js';
import { handleAppUploadCli } from './tools/mittwald-cli/app/upload-cli.js';
import { handleAppVersionsCli } from './tools/mittwald-cli/app/versions-cli.js';
import { handleAppListUpgradeCandidatesCli } from './tools/mittwald-cli/app/list-upgrade-candidates-cli.js';

// Agent 7 & 8 cronjob handlers (now using CLI implementations)
import {
  handleCronjobCreate,
  handleCronjobDelete,
  handleCronjobExecute,
  handleCronjobExecutionAbort,
  handleCronjobExecutionGet,
  handleCronjobExecutionList,
  handleCronjobExecutionLogs,
  handleCronjobExecution,
  handleMittwaldCronjobGet,
  handleMittwaldCronjobList,
  handleMittwaldCronjobUpdate,
  handleMittwaldCronjob
} from './tools/mittwald-cli/cronjob/index.js';

// Agent 9 database handlers
import { handleDatabaseMysqlDump, MittwaldDatabaseMysqlDumpSchema } from './tools/mittwald-cli/database/mysql/dump.js';
import { handleDatabaseMysqlGet, MittwaldDatabaseMysqlGetSchema } from './tools/mittwald-cli/database/mysql/get.js';
import { handleDatabaseMysqlImport, MittwaldDatabaseMysqlImportSchema } from './tools/mittwald-cli/database/mysql/import.js';
import { handleDatabaseMysqlList, MittwaldDatabaseMysqlListSchema } from './tools/mittwald-cli/database/mysql/list.js';
import { handleDatabaseMysqlPhpmyadmin, MittwaldDatabaseMysqlPhpmyadminSchema } from './tools/mittwald-cli/database/mysql/phpmyadmin.js';
import { handleDatabaseMysqlPortForward, MittwaldDatabaseMysqlPortForwardSchema } from './tools/mittwald-cli/database/mysql/port-forward.js';
import { handleDatabaseMysqlShell, MittwaldDatabaseMysqlShellSchema } from './tools/mittwald-cli/database/mysql/shell.js';
import { handleDatabaseMysqlVersions, MittwaldDatabaseMysqlVersionsSchema } from './tools/mittwald-cli/database/mysql/versions.js';
import { handleMittwaldDatabaseList } from './tools/mittwald-cli/database/list.js';
import { handleMittwaldDatabaseMysqlCharsets } from './tools/mittwald-cli/database/mysql/charsets.js';
import { handleMittwaldDatabaseMysqlCreate } from './tools/mittwald-cli/database/mysql/create.js';
import { handleMittwaldDatabaseMysqlDelete } from './tools/mittwald-cli/database/mysql/delete.js';

// Agent 6 MySQL user handlers
import { handleDatabaseMysqlUserCreate } from './tools/mittwald-cli/database/mysql/user/create.js';
import { handleDatabaseMysqlUserList } from './tools/mittwald-cli/database/mysql/user/list.js';
import { handleDatabaseMysqlUserGet } from './tools/mittwald-cli/database/mysql/user/get.js';
import { handleDatabaseMysqlUserDelete } from './tools/mittwald-cli/database/mysql/user/delete.js';
import { handleDatabaseMysqlUserUpdate } from './tools/mittwald-cli/database/mysql/user/update.js';

// Agent 6 Redis database handlers
import { handleMittwaldDatabaseRedisCreate, MittwaldDatabaseRedisCreateSchema } from './tools/mittwald-cli/database/redis-create.js';
import { handleMittwaldDatabaseRedisGet, MittwaldDatabaseRedisGetSchema } from './tools/mittwald-cli/database/redis-get.js';
import { handleMittwaldDatabaseRedisList, MittwaldDatabaseRedisListSchema } from './tools/mittwald-cli/database/redis-list.js';
import { handleMittwaldDatabaseRedisShell, MittwaldDatabaseRedisShellSchema } from './tools/mittwald-cli/database/redis-shell.js';
import { handleMittwaldDatabaseRedisVersions, MittwaldDatabaseRedisVersionsSchema } from './tools/mittwald-cli/database/redis-versions.js';

// Agent 11 mail CLI handlers
import { handleMittwaldMailAddressListCli } from './tools/mittwald-cli/mail/address/list-cli.js';
import { handleMittwaldMailAddressGetCli } from './tools/mittwald-cli/mail/address/get-cli.js';
import { handleMittwaldMailAddressCreateCli } from './tools/mittwald-cli/mail/address/create-cli.js';
import { handleMittwaldMailAddressDeleteCli } from './tools/mittwald-cli/mail/address/delete-cli.js';
import { handleMittwaldMailAddressUpdateCli } from './tools/mittwald-cli/mail/address/update-cli.js';
import { handleMittwaldMailDeliveryboxListCli } from './tools/mittwald-cli/mail/deliverybox/list-cli.js';
import { handleMittwaldMailDeliveryboxGetCli } from './tools/mittwald-cli/mail/deliverybox/get-cli.js';
import { handleMittwaldMailDeliveryboxCreateCli } from './tools/mittwald-cli/mail/deliverybox/create-cli.js';
import { handleMittwaldMailDeliveryboxDeleteCli } from './tools/mittwald-cli/mail/deliverybox/delete-cli.js';
import { handleMittwaldMailDeliveryboxUpdateCli } from './tools/mittwald-cli/mail/deliverybox/update-cli.js';

// Agent 11 handlers
import { handleDdevInit, ddevInitSchema } from './tools/mittwald-cli/ddev/init.js';
import { handleDdevRenderConfig, ddevRenderConfigSchema } from './tools/mittwald-cli/ddev/render-config.js';
import { handleDdevMain, ddevMainSchema } from './tools/mittwald-cli/ddev/index-command.js';
import { handleDomainGet, domainGetSchema } from './tools/mittwald-cli/domain/get.js';
import { handleDomainList } from './tools/mittwald-cli/domain/list.js';
import { handleDomainDnszoneGet, domainDnszoneGetSchema } from './tools/mittwald-cli/domain/dnszone/get.js';
import { handleDomainDnszoneList, domainDnszoneListSchema } from './tools/mittwald-cli/domain/dnszone/list.js';
import { handleDomainDnszoneUpdate, domainDnszoneUpdateSchema } from './tools/mittwald-cli/domain/dnszone/update.js';
import { handleDomainDnszoneMain, domainDnszoneMainSchema } from './tools/mittwald-cli/domain/dnszone/main.js';

// Domain CLI handlers
import { handleDomainListCli } from './tools/mittwald-cli/domain/list-cli.js';
import { handleDomainGetCli } from './tools/mittwald-cli/domain/get-cli.js';
import { handleDomainDnszoneListCli } from './tools/mittwald-cli/domain/dnszone/list-cli.js';
import { handleDomainDnszoneGetCli } from './tools/mittwald-cli/domain/dnszone/get-cli.js';
import { handleDomainDnszoneUpdateCli } from './tools/mittwald-cli/domain/dnszone/update-cli.js';

// Backup handlers (CLI wrapper)
import { handleBackupCreateCli } from './tools/mittwald-cli/backup/create-cli.js';
import { handleBackupDeleteCli } from './tools/mittwald-cli/backup/delete-cli.js';
import { handleBackupDownloadCli } from './tools/mittwald-cli/backup/download-cli.js';
import { handleBackupGetCli } from './tools/mittwald-cli/backup/get-cli.js';
import { handleBackupListCli } from './tools/mittwald-cli/backup/list-cli.js';
import { handleBackupScheduleCreateCli } from './tools/mittwald-cli/backup/schedule-create-cli.js';
import { handleBackupScheduleDeleteCli } from './tools/mittwald-cli/backup/schedule-delete-cli.js';
import { handleBackupScheduleListCli } from './tools/mittwald-cli/backup/schedule-list-cli.js';
import { handleBackupScheduleUpdateCli } from './tools/mittwald-cli/backup/schedule-update-cli.js';
// Keep legacy handlers for non-CLI commands
import { handleBackup } from './tools/mittwald-cli/backup/backup.js';
import { handleBackupSchedule } from './tools/mittwald-cli/backup/backup-schedule.js';

// Conversation CLI handlers
import { handleConversationCreateCli } from './tools/mittwald-cli/conversation/create-cli.js';
import { handleConversationCloseCli } from './tools/mittwald-cli/conversation/close-cli.js';
import { handleConversationListCli } from './tools/mittwald-cli/conversation/list-cli.js';
import { handleConversationReplyCli } from './tools/mittwald-cli/conversation/reply-cli.js';
import { handleConversationShowCli } from './tools/mittwald-cli/conversation/show-cli.js';
import { handleConversationCategoriesCli } from './tools/mittwald-cli/conversation/categories-cli.js';
// Keep legacy handlers for backward compatibility
import { handleConversationCreate } from './tools/mittwald-cli/conversation/create.js';
import { handleConversationClose } from './tools/mittwald-cli/conversation/close.js';
import { handleConversationList } from './tools/mittwald-cli/conversation/list.js';
import { handleConversationReply } from './tools/mittwald-cli/conversation/reply.js';
import { handleConversationShow } from './tools/mittwald-cli/conversation/show.js';
import { handleConversationCategories } from './tools/mittwald-cli/conversation/categories.js';
import { handleConversation } from './tools/mittwald-cli/conversation/conversation.js';

// User handlers
import { handleUserGet } from './tools/mittwald-cli/user/get.js';
import { handleUserApiToken } from './tools/mittwald-cli/user/api-token.js';
import { handleUserApiTokenCreate } from './tools/mittwald-cli/user/api-token/create.js';
import { handleUserApiTokenGet } from './tools/mittwald-cli/user/api-token/get.js';
import { handleUser } from './tools/mittwald-cli/user/user.js';

// SSH user handlers
import { handleSshUserCreate } from './tools/mittwald-cli/ssh/user-create.js';
import { handleSshUserDelete } from './tools/mittwald-cli/ssh/user-delete.js';
import { handleSshUserList } from './tools/mittwald-cli/ssh/user-list.js';
import { handleSshUserUpdate } from './tools/mittwald-cli/ssh/user-update.js';
import { handleSshUser } from './tools/mittwald-cli/ssh/user.js';

// SSH user CLI handlers
import { handleSshUserCreateCli } from './tools/mittwald-cli/ssh/user-create-cli.js';
import { handleSshUserDeleteCli } from './tools/mittwald-cli/ssh/user-delete-cli.js';
import { handleSshUserListCli } from './tools/mittwald-cli/ssh/user-list-cli.js';
import { handleSshUserUpdateCli } from './tools/mittwald-cli/ssh/user-update-cli.js';

// SFTP user handlers
import { handleSftpUserCreate } from './tools/mittwald-cli/sftp/user/create.js';
import { handleSftpUserDelete } from './tools/mittwald-cli/sftp/user-delete.js';
import { handleSftpUserList } from './tools/mittwald-cli/sftp/user-list.js';
import { handleSftpUserUpdate } from './tools/mittwald-cli/sftp/user-update.js';
import { handleSftpUser } from './tools/mittwald-cli/sftp/user.js';

// SFTP user CLI handlers
import { handleSftpUserCreateCli } from './tools/mittwald-cli/sftp/user-create-cli.js';
import { handleSftpUserDeleteCli } from './tools/mittwald-cli/sftp/user-delete-cli.js';
import { handleSftpUserListCli } from './tools/mittwald-cli/sftp/user-list-cli.js';
import { handleSftpUserUpdateCli } from './tools/mittwald-cli/sftp/user-update-cli.js';

// Mail handlers
import { handleMailDeliverybox } from './tools/mittwald-cli/mail/deliverybox.js';
import { handleMail } from './tools/mittwald-cli/mail/mail.js';
import { handleMittwaldMailAddressCreate } from './tools/mittwald-cli/mail/address/create.js';
import { handleMittwaldMailAddressDelete } from './tools/mittwald-cli/mail/address/delete.js';
import { handleMittwaldMailAddressGet } from './tools/mittwald-cli/mail/address/get.js';
import { handleMittwaldMailAddressList } from './tools/mittwald-cli/mail/address/list.js';
import { handleMailAddress } from './tools/mittwald-cli/mail/address/index.js';
import { handleMailAddressUpdate } from './tools/mittwald-cli/mail/address-update.js';
import { handleMailDeliveryboxCreate } from './tools/mittwald-cli/mail/deliverybox-create.js';
import { handleMailDeliveryboxDelete } from './tools/mittwald-cli/mail/deliverybox-delete.js';
import { handleMailDeliveryboxGet } from './tools/mittwald-cli/mail/deliverybox-get.js';
import { handleMailDeliveryboxList } from './tools/mittwald-cli/mail/deliverybox-list.js';
import { handleMailDeliveryboxUpdate } from './tools/mittwald-cli/mail/deliverybox-update.js';

// Agent 16 org handlers  
import { handleOrgMembershipList } from './tools/mittwald-cli/org/membership/list.js';
import { handleOrgMembershipRevoke } from './tools/mittwald-cli/org/membership/revoke.js';
import { handleOrgMembership } from './tools/mittwald-cli/org/membership.js';
import { handleOrg } from './tools/mittwald-cli/org/org.js';
import { handleOrgDelete } from './tools/mittwald-cli/org/delete.js';
import { handleOrgGet } from './tools/mittwald-cli/org/get.js';
import { handleOrgInvite } from './tools/mittwald-cli/org/invite.js';
import { handleOrgList } from './tools/mittwald-cli/org/list.js';
import { handleOrgMembershipListOwn } from './tools/mittwald-cli/org/membership-list-own.js';

// Agent 14 org CLI handlers  
import { handleOrgListCli } from './tools/mittwald-cli/org/list.js';
import { handleOrgGetCli } from './tools/mittwald-cli/org/get.js';
import { handleOrgDeleteCli } from './tools/mittwald-cli/org/delete.js';
import { handleOrgInviteCli } from './tools/mittwald-cli/org/invite.js';
import { handleOrgInviteListCli } from './tools/mittwald-cli/org/invite-list-cli.js';
import { handleOrgInviteListOwnCli } from './tools/mittwald-cli/org/invite-list-own-cli.js';
import { handleOrgInviteRevokeCli } from './tools/mittwald-cli/org/invite-revoke-cli.js';
import { handleOrgMembershipListCli } from './tools/mittwald-cli/org/membership/list.js';
import { handleOrgMembershipListOwnCli } from './tools/mittwald-cli/org/membership-list-own.js';
import { handleOrgMembershipRevokeCli } from './tools/mittwald-cli/org/membership/revoke.js';

// Context handlers
import { handleContext } from './tools/mittwald-cli/context/context.js';
import { handleContextGet } from './tools/mittwald-cli/context/get.js';
import { handleContextReset } from './tools/mittwald-cli/context/reset.js';
import { handleContextSet } from './tools/mittwald-cli/context/set.js';
import { handleContextDetect } from './tools/mittwald-cli/context/detect.js';

// Container handlers
import { handleContainerListStacks } from './tools/mittwald-cli/container/list-stacks.js';
import { handleContainerListServices } from './tools/mittwald-cli/container/list-services.js';
import { handleContainerListVolumes } from './tools/mittwald-cli/container/list-volumes.js';
import { handleContainerListRegistries } from './tools/mittwald-cli/container/list-registries.js';
import { handleContainerDeclareStack } from './tools/mittwald-cli/container/declare-stack.js';
import { handleContainerGetServiceLogs } from './tools/mittwald-cli/container/get-service-logs.js';
import { handleContainerCreateRegistry } from './tools/mittwald-cli/container/create-registry.js';
import { handleContainerGetService } from './tools/mittwald-cli/container/get-service.js';
import { handleContainerGetStack } from './tools/mittwald-cli/container/get-stack.js';
import { handleContainerRestartService } from './tools/mittwald-cli/container/restart-service.js';
import { handleContainerRecreateService } from './tools/mittwald-cli/container/recreate-service.js';
import { handleContainerStartService } from './tools/mittwald-cli/container/start-service.js';
import { handleContainerStopService } from './tools/mittwald-cli/container/stop-service.js';
import { handleContainerPullImage } from './tools/mittwald-cli/container/pull-image.js';

// Agent 12 Container CLI handlers
import { handleContainerListCli } from './tools/mittwald-cli/container/list-services-cli.js';
import { handleContainerLogsCli } from './tools/mittwald-cli/container/logs-cli.js';
import { handleContainerDeleteCli } from './tools/mittwald-cli/container/delete-cli.js';
import { handleContainerRecreateCli } from './tools/mittwald-cli/container/recreate-cli.js';
import { handleContainerRestartCli } from './tools/mittwald-cli/container/restart-cli.js';
import { handleContainerStartCli } from './tools/mittwald-cli/container/start-cli.js';
import { handleContainerStopCli } from './tools/mittwald-cli/container/stop-cli.js';
import { handleContainerRunCli } from './tools/mittwald-cli/container/run-cli.js';

// Contributor handler
import { handleContributor } from './tools/mittwald-cli/contributor/contributor.js';

import { getMittwaldClient } from '../services/mittwald/index.js';
import type { MittwaldToolHandlerContext } from '../types/mittwald/conversation.js';

/**
 * Helper function to map snake_case parameters to camelCase for app install handlers
 */
function mapAppInstallParams(args: any): any {
  const mapped: any = {};
  if (args.project_id !== undefined) mapped.projectId = args.project_id;
  if (args.version !== undefined) mapped.version = args.version;
  if (args.host !== undefined) mapped.host = args.host;
  if (args.admin_user !== undefined) mapped.adminUser = args.admin_user;
  if (args.admin_email !== undefined) mapped.adminEmail = args.admin_email;
  if (args.admin_pass !== undefined) mapped.adminPass = args.admin_pass;
  if (args.admin_firstname !== undefined) mapped.adminFirstname = args.admin_firstname;
  if (args.admin_lastname !== undefined) mapped.adminLastname = args.admin_lastname;
  if (args.site_title !== undefined) mapped.siteTitle = args.site_title;
  if (args.shopware_title !== undefined) mapped.shopwareTitle = args.shopware_title;
  if (args.shop_email !== undefined) mapped.shopEmail = args.shop_email;
  if (args.shop_lang !== undefined) mapped.shopLang = args.shop_lang;
  if (args.shop_currency !== undefined) mapped.shopCurrency = args.shop_currency;
  if (args.wait !== undefined) mapped.wait = args.wait;
  if (args.wait_timeout !== undefined) mapped.waitTimeout = args.wait_timeout;
  if (args.install_mode !== undefined) mapped.installMode = args.install_mode;
  return mapped;
}

/**
 * Zod schemas for tool validation
 */
const ToolSchemas = {
  
  
  
  // Agent-18 project tools
  mittwald_project_create: z.object({
    description: z.string().describe("A description for the project"),
    serverId: z.string().describe("Server ID to create project on"),
    wait: z.boolean().optional().describe("Wait for operation to complete"),
    waitTimeout: z.number().optional().describe("Timeout for wait operation in milliseconds"),
    updateContext: z.boolean().optional().describe("Update the CLI context to use the newly created project")
  }),

  mittwald_project_delete: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    force: z.boolean().describe("Do not ask for confirmation (required in MCP context)")
  }),

  mittwald_project_get: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    output: z.enum(["json", "table", "yaml"]).optional().describe("Output format")
  }),

  mittwald_project_list: z.object({
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)")
  }),
  
  mittwald_project_ssh: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    sshUser: z.string().optional().describe("Override the SSH user to connect with"),
    sshIdentityFile: z.string().optional().describe("The SSH identity file (private key) to use for public key authentication")
  }),
  
  mittwald_project: z.object({
    help: z.boolean().optional().describe("Show help for project commands")
  }),
  
  mittwald_project_invite: z.object({
    command: z.enum(["get", "list", "list-own"]).optional().describe("The invite command to run"),
    help: z.boolean().optional().describe("Show help for project invite commands")
  }),
  
  mittwald_project_membership: z.object({
    command: z.enum(["get", "get-own", "list", "list-own"]).optional().describe("The membership command to run"),
    help: z.boolean().optional().describe("Show help for project membership commands")
  }),
  
  mittwald_project_membership_get: z.object({
    membershipId: z.string().describe("ID of the project membership"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_project_membership_get_own: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_project_membership_list: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output")
  }),
  
  mittwald_project_membership_list_own: z.object({
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output")
  }),
  
  mittwald_project_update: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    description: z.string().optional().describe("New description for the project"),
    defaultIp: z.enum(["v4", "v6"]).optional().describe("Default IP version to use for new app installations")
  }),

  mittwald_server_list: z.object({
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_server_get: z.object({
    serverId: z.string().describe("ID of the server to retrieve"),
    output: z.enum(["txt", "json", "yaml"]).optional().default("txt").describe("Output format")
  }),
  
  mittwald_server: z.object({
    help: z.boolean().optional().describe("Show help for server commands")
  }),

  mittwald_project_filesystem_usage: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    human: z.boolean().optional().describe("Display human readable sizes")
  }),

  mittwald_project_invite_get: z.object({
    inviteId: z.string().describe("ID of the ProjectInvite to be retrieved"),
    output: z.enum(["json", "table", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_project_invite_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_project_invite_list_own: z.object({
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  // Project CLI schemas
  mittwald_project_list_cli: z.object({
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)")
  }),
  
  mittwald_project_get_cli: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_project_create_cli: z.object({
    description: z.string().describe("A description for the project"),
    serverId: z.string().optional().describe("ID or short ID of a server; this flag is optional if a default server is set in the context"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    wait: z.boolean().optional().describe("Wait for the resource to be ready"),
    waitTimeout: z.string().optional().describe("The duration to wait for the resource to be ready (common units like 'ms', 's', 'm' are accepted)"),
    updateContext: z.boolean().optional().describe("Update the CLI context to use the newly created project")
  }),
  
  mittwald_project_delete_cli: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    force: z.boolean().optional().describe("Do not ask for confirmation")
  }),
  
  mittwald_project_update_cli: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    description: z.string().optional().describe("Set the project description"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_project_ssh_cli: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    sshUser: z.string().optional().describe("Override the SSH user to connect with; if omitted, your own user will be used"),
    sshIdentityFile: z.string().optional().describe("The SSH identity file (private key) to use for public key authentication")
  }),
  
  mittwald_project_filesystem_usage_cli: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format"),
    human: z.boolean().optional().describe("Display human readable sizes")
  }),

  // Agent 2 app dependency schemas
  mittwald_app_dependency_update: z.object({
    installationId: z.string().describe("ID of the app installation"),
    set: z.array(z.string()).min(1).describe("Set a dependency to a specific version. Format: <dependency>=<version>"),
    updatePolicy: z.enum(["none", "inheritedFromApp", "patchLevel", "all"]).optional().describe("Set the update policy for the configured dependencies"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),

  mittwald_app_dependency_versions: z.object({
    systemsoftware: z.string().describe("Name of the systemsoftware for which to list versions"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output in a more machine friendly format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  mittwald_app_dependency_list: z.object({
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output in a more machine friendly format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  mittwald_app_dependency_get: z.object({
    installationId: z.string().describe("ID of the app installation"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),

  mittwald_app_download: z.object({
    installation_id: z.string().optional().describe("ID or short ID of an app installation"),
    target: z.string().describe("Target directory to download the app installation to"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    ssh_user: z.string().optional().describe("Override the SSH user to connect with"),
    ssh_identity_file: z.string().optional().describe("The SSH identity file (private key) to use for public key authentication"),
    exclude: z.array(z.string()).optional().describe("Exclude files matching the given pattern"),
    dry_run: z.boolean().optional().describe("Do not actually download the app installation"),
    delete: z.boolean().optional().describe("Delete local files that are not present on the server"),
    remote_sub_directory: z.string().optional().describe("Specify a sub-directory within the app installation to download")
  }),

  mittwald_app_get: z.object({
    installation_id: z.string().optional().describe("ID or short ID of an app installation"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output in a more machine friendly format")
  }),

  mittwald_app_install: z.object({
    appType: z.enum(["contao", "joomla", "matomo", "nextcloud", "shopware5", "shopware6", "typo3", "wordpress"]).describe("Type of application to install"),
    projectId: z.string().optional().describe("ID or short ID of a project"),
    version: z.string().optional().describe("Version of the application to be installed"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    host: z.string().optional().describe("Host to initially configure your installation with"),
    adminUser: z.string().optional().describe("Username for your administrator user"),
    adminEmail: z.string().optional().describe("Email address of your administrator user"),
    adminPass: z.string().optional().describe("Password of your administrator user"),
    siteTitle: z.string().optional().describe("Site title for your installation"),
    wait: z.boolean().optional().describe("Wait for the resource to be ready"),
    waitTimeout: z.string().optional().describe("The duration to wait for the resource to be ready")
  }),

  mittwald_app_install_contao: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project"),
    version: z.string().describe("Version of Contao to be installed"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    host: z.string().optional().describe("Host to initially configure your Contao installation with"),
    adminFirstname: z.string().optional().describe("First name of your administrator user"),
    adminUser: z.string().optional().describe("Username for your administrator user"),
    adminEmail: z.string().optional().describe("Email address of your administrator user"),
    adminPass: z.string().optional().describe("Password of your administrator user"),
    adminLastname: z.string().optional().describe("Last name of your administrator user"),
    siteTitle: z.string().optional().describe("Site title for your Contao installation"),
    wait: z.boolean().optional().describe("Wait for the resource to be ready"),
    waitTimeout: z.string().optional().describe("The duration to wait for the resource to be ready")
  }),

  mittwald_app_list_upgrade_candidates: z.object({
    installation_id: z.string().optional().describe("ID or short ID of an app installation"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output in a more machine friendly format"),
    extended: z.boolean().optional().describe("Show extended information"),
    no_header: z.boolean().optional().describe("Hide table header"),
    no_truncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    no_relative_dates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csv_separator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  // Agent 3 app install schemas
  mittwald_app_install_joomla: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    version: z.string().optional().describe("Version to install"),
    host: z.string().optional().describe("Host to configure the app with"),
    adminUser: z.string().optional().describe("Administrator username"),
    adminEmail: z.string().optional().describe("Administrator email"),
    adminPass: z.string().optional().describe("Administrator password"),
    adminFirstname: z.string().optional().describe("Administrator first name"),
    adminLastname: z.string().optional().describe("Administrator last name"),
    siteTitle: z.string().optional().describe("Title for the Joomla installation"),
    wait: z.boolean().optional().describe("Wait for installation to complete"),
    waitTimeout: z.number().optional().describe("Maximum time to wait in seconds")
  }),

  mittwald_app_install_matomo: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    version: z.string().optional().describe("Version to install"),
    host: z.string().optional().describe("Host to configure the app with"),
    adminUser: z.string().optional().describe("Administrator username"),
    adminEmail: z.string().optional().describe("Administrator email"),
    adminPass: z.string().optional().describe("Administrator password"),
    siteTitle: z.string().optional().describe("Title for the Matomo installation"),
    wait: z.boolean().optional().describe("Wait for installation to complete"),
    waitTimeout: z.number().optional().describe("Maximum time to wait in seconds")
  }),

  mittwald_app_install_nextcloud: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    version: z.string().optional().describe("Version to install"),
    host: z.string().optional().describe("Host to configure the app with"),
    adminUser: z.string().optional().describe("Administrator username"),
    adminEmail: z.string().optional().describe("Administrator email"),
    adminPass: z.string().optional().describe("Administrator password"),
    siteTitle: z.string().optional().describe("Title for the Nextcloud installation"),
    wait: z.boolean().optional().describe("Wait for installation to complete"),
    waitTimeout: z.number().optional().describe("Maximum time to wait in seconds")
  }),

  mittwald_app_install_shopware5: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    version: z.string().optional().describe("Version to install"),
    host: z.string().optional().describe("Host to configure the app with"),
    adminUser: z.string().optional().describe("Administrator username"),
    adminEmail: z.string().optional().describe("Administrator email"),
    adminPass: z.string().optional().describe("Administrator password"),
    adminFirstname: z.string().optional().describe("Administrator first name"),
    adminLastname: z.string().optional().describe("Administrator last name"),
    siteTitle: z.string().optional().describe("Title for the Shopware installation"),
    shopEmail: z.string().optional().describe("Shop email address"),
    shopLang: z.string().optional().describe("Shop language"),
    shopCurrency: z.string().optional().describe("Shop currency"),
    wait: z.boolean().optional().describe("Wait for installation to complete"),
    waitTimeout: z.number().optional().describe("Maximum time to wait in seconds")
  }),

  mittwald_app_install_shopware6: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    version: z.string().optional().describe("Version to install"),
    host: z.string().optional().describe("Host to configure the app with"),
    adminUser: z.string().optional().describe("Administrator username"),
    adminEmail: z.string().optional().describe("Administrator email"),
    adminPass: z.string().optional().describe("Administrator password"),
    adminFirstname: z.string().optional().describe("Administrator first name"),
    adminLastname: z.string().optional().describe("Administrator last name"),
    siteTitle: z.string().optional().describe("Title for the Shopware installation"),
    shopEmail: z.string().optional().describe("Shop email address"),
    shopLang: z.string().optional().describe("Shop language"),
    shopCurrency: z.string().optional().describe("Shop currency"),
    wait: z.boolean().optional().describe("Wait for installation to complete"),
    waitTimeout: z.number().optional().describe("Maximum time to wait in seconds")
  }),

  mittwald_app_install_typo3: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    version: z.string().optional().describe("Version to install"),
    host: z.string().optional().describe("Host to configure the app with"),
    adminUser: z.string().optional().describe("Administrator username"),
    adminEmail: z.string().optional().describe("Administrator email"),
    adminPass: z.string().optional().describe("Administrator password"),
    siteTitle: z.string().optional().describe("Title for the TYPO3 installation"),
    installMode: z.enum(["composer", "symlink"]).optional().describe("Installation mode"),
    wait: z.boolean().optional().describe("Wait for installation to complete"),
    waitTimeout: z.number().optional().describe("Maximum time to wait in seconds")
  }),

  mittwald_app_install_wordpress: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    version: z.string().optional().describe("Version to install"),
    host: z.string().optional().describe("Host to configure the app with"),
    adminUser: z.string().optional().describe("Administrator username"),
    adminEmail: z.string().optional().describe("Administrator email"),
    adminPass: z.string().optional().describe("Administrator password"),
    siteTitle: z.string().optional().describe("Title for the WordPress installation"),
    wait: z.boolean().optional().describe("Wait for installation to complete"),
    waitTimeout: z.number().optional().describe("Maximum time to wait in seconds")
  }),
  
  // App create schemas
  mittwald_app_create_node: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    siteTitle: z.string().optional().describe("Title for the Node.js application"),
    entrypoint: z.string().optional().describe("Entry point file for the Node.js application"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    wait: z.boolean().optional().describe("Wait for installation to complete"),
    waitTimeout: z.number().optional().describe("Maximum time to wait in seconds")
  }),
  
  mittwald_app_create_php: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    documentRoot: z.string().describe("Document root path for the PHP application"),
    siteTitle: z.string().optional().describe("Title for the PHP application"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    wait: z.boolean().optional().describe("Wait for installation to complete"),
    waitTimeout: z.number().optional().describe("Maximum time to wait in seconds")
  }),
  
  mittwald_app_create_php_worker: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    entrypoint: z.string().optional().describe("Command to start the PHP worker (e.g., 'php worker.php')"),
    siteTitle: z.string().optional().describe("Title for the PHP worker application"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    wait: z.boolean().optional().describe("Wait for installation to complete"),
    waitTimeout: z.number().optional().describe("Maximum time to wait in seconds")
  }),
  
  mittwald_app_create_python: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    entrypoint: z.string().optional().describe("Command to start the Python application (e.g., 'python app.py')"),
    siteTitle: z.string().optional().describe("Title for the Python application"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    wait: z.boolean().optional().describe("Wait for installation to complete"),
    waitTimeout: z.number().optional().describe("Maximum time to wait in seconds")
  }),
  
  mittwald_app_create_static: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    documentRoot: z.string().describe("Document root path for the static site"),
    siteTitle: z.string().optional().describe("Title for the static site"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    wait: z.boolean().optional().describe("Wait for installation to complete"),
    waitTimeout: z.number().optional().describe("Maximum time to wait in seconds")
  }),
  
  // Agent 3 app management schemas
  mittwald_app: z.object({
    help: z.boolean().optional().describe("Show help for app commands")
  }),
  
  mittwald_app_copy: z.object({
    installationId: z.string().describe("ID of the app installation to copy"),
    description: z.string().describe("Description for the copied app"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_app_create: z.object({
    help: z.boolean().optional().describe("Show help for app create commands")
  }),
  
  mittwald_app_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  mittwald_app_open: z.object({
    installationId: z.string().optional().describe("ID or short ID of an app installation; this argument is optional if a default app installation is set in the context")
  }),

  mittwald_app_ssh: z.object({
    installationId: z.string().optional().describe("ID or short ID of an app installation; this argument is optional if a default app installation is set in the context"),
    sshUser: z.string().optional().describe("SSH user for the connection"),
    sshIdentityFile: z.string().optional().describe("SSH private key file"),
    cd: z.boolean().optional().describe("Change to installation path after connecting"),
    info: z.boolean().optional().describe("Only print connection info without connecting"),
    test: z.boolean().optional().describe("Test connection and exit")
  }),

  mittwald_app_uninstall: z.object({
    installationId: z.string().optional().describe("ID or short ID of an app installation; this argument is optional if a default app installation is set in the context"),
    force: z.boolean().optional().describe("Do not ask for confirmation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),

  mittwald_app_update: z.object({
    installationId: z.string().optional().describe("ID or short ID of an app installation; this argument is optional if a default app installation is set in the context"),
    description: z.string().optional().describe("Update the description of the app installation"),
    documentRoot: z.string().optional().describe("Update the document root of the app installation"),
    entrypoint: z.string().optional().describe("Update the entrypoint of the app installation (Python and Node.js only)"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),

  mittwald_app_upgrade: mittwald_app_upgrade_schema,

  mittwald_app_upload: z.object({
    installationId: z.string().optional().describe("ID or short ID of an app installation; this argument is optional if a default app installation is set in the context"),
    source: z.string().describe("Source directory or file to upload"),
    exclude: z.array(z.string()).optional().describe("Exclude files matching the given pattern"),
    dryRun: z.boolean().optional().describe("Do not actually upload; only show what would be done"),
    delete: z.boolean().optional().describe("Delete remote files that are not present locally"),
    sshUser: z.string().optional().describe("Override the SSH user to connect with"),
    sshIdentityFile: z.string().optional().describe("The SSH identity file (private key) to use for public key authentication"),
    remoteSubDirectory: z.string().optional().describe("Specify a sub-directory within the app installation to upload to"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),

  mittwald_app_versions: z.object({
    app: z.string().optional().describe("Name of specific app to get versions for (optional)"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  // Agent 14 tools
  mittwald_domain_virtualhost_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project"),
    all: z.boolean().optional().describe("List all virtual hosts (do not filter by project)"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Do not show table headers"),
    noTruncate: z.boolean().optional().describe("Do not truncate output"),
    noRelativeDates: z.boolean().optional().describe("Do not use relative dates"),
    csvSeparator: z.enum([",", ";"]).optional().describe("CSV separator to use")
  }),

  mittwald_extension: z.object({
    help: z.boolean().optional().describe("Show help for extension commands")
  }),

  mittwald_extension_install: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    extensionId: z.string().describe("ID of the extension to install"),
    description: z.string().optional().describe("Description for the extension installation"),
    consent: z.boolean().optional().describe("Consent to the extension's terms and conditions"),
    wait: z.boolean().optional().describe("Wait for the installation to complete"),
    waitTimeout: z.number().optional().describe("Timeout in milliseconds to wait for the installation to complete")
  }),

  mittwald_extension_list: z.object({}),

  mittwald_extension_list_installed: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project"),
    orgId: z.string().optional().describe("ID of an organization")
  }).refine(data => (data.projectId && !data.orgId) || (!data.projectId && data.orgId), {
    message: "Exactly one of projectId or orgId must be provided"
  }),

  mittwald_extension_uninstall: z.object({
    extensionInstanceId: z.string().describe("ID of the extension instance to uninstall")
  }),
  
  // Agent 7 cronjob execution tools
  mittwald_cronjob_execution_abort: z.object({
    cronjobId: z.string().describe("ID of the cronjob the execution belongs to"),
    executionId: z.string().describe("ID of the cron job execution to abort"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_cronjob_execution_get: z.object({
    cronjobId: z.string().describe("ID of the cronjob the execution belongs to"),
    executionId: z.string().describe("ID of the cronjob execution to be retrieved"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_cronjob_execution_list: z.object({
    cronjobId: z.string().describe("ID of the cron job for which to list executions for"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_cronjob_execution_logs: z.object({
    cronjobId: z.string().describe("ID of the cronjob the execution belongs to"),
    executionId: z.string().describe("ID of the cronjob execution to be retrieved"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format"),
    noPager: z.boolean().optional().describe("Disable pager for output")
  }),
  
  mittwald_cronjob_execution: z.object({
    command: z.enum(["abort", "get", "list", "logs"]).optional().describe("The execution command to run"),
    help: z.boolean().optional().describe("Show help for cronjob execution commands")
  }),
  
  // Agent 8 cronjob tools
  mittwald_cronjob_get: z.object({
    cronjobId: z.string().describe("ID of the cron job to be retrieved"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_cronjob_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_cronjob_update: z.object({
    cronjobId: z.string().describe("ID of the cron job to be updated"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    description: z.string().optional().describe("Set cron job description"),
    interval: z.string().optional().describe("Set the interval for cron jobs to run (cron schedule expression)"),
    email: z.string().optional().describe("Set the target email to which error messages will be sent"),
    url: z.string().optional().describe("Set the URL to use when running a cron job"),
    command: z.string().optional().describe("Specify the file and arguments to be executed when the cron job is run"),
    interpreter: z.enum(["bash", "php"]).optional().describe("Set the interpreter to be used for execution"),
    enable: z.boolean().optional().describe("Enable the cron job"),
    disable: z.boolean().optional().describe("Disable the cron job"),
    timeout: z.string().optional().describe("Timeout after which the process will be killed (duration format like 1h, 30m, 30s)")
  }),
  
  mittwald_cronjob: z.object({
    help: z.boolean().optional().describe("Show help for cronjob commands")
  }),
  
  // Agent 9 database tools
  mittwald_database_mysql_dump: MittwaldDatabaseMysqlDumpSchema,
  mittwald_database_mysql_get: MittwaldDatabaseMysqlGetSchema,
  mittwald_database_mysql_import: MittwaldDatabaseMysqlImportSchema,
  mittwald_database_mysql_list: MittwaldDatabaseMysqlListSchema,
  mittwald_database_mysql_phpmyadmin: MittwaldDatabaseMysqlPhpmyadminSchema,
  mittwald_database_mysql_port_forward: MittwaldDatabaseMysqlPortForwardSchema,
  mittwald_database_mysql_shell: MittwaldDatabaseMysqlShellSchema,
  mittwald_database_mysql_versions: MittwaldDatabaseMysqlVersionsSchema,
  
  // Agent 6 MySQL user tools
  mittwald_database_mysql_user_create: z.object({
    databaseId: z.string().describe("MySQL database ID to create a user for"),
    accessLevel: z.enum(['readonly', 'full']).describe("Set the access level permissions for the MySQL user"),
    description: z.string().describe("Set the description for the MySQL user"),
    password: z.string().describe("Password used for authentication"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    accessIpMask: z.string().optional().describe("IP to restrict external access to"),
    enableExternalAccess: z.boolean().optional().describe("Enable external access for this MySQL user")
  }),
  
  mittwald_database_mysql_user_list: z.object({
    databaseId: z.string().describe("ID of the MySQL database to list users for"),
    output: z.enum(['txt', 'json', 'yaml', 'csv', 'tsv']).optional().describe("Output format for the user list"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format"),
    csvSeparator: z.enum([',', ';']).optional().describe("Separator for CSV output")
  }),
  
  mittwald_database_mysql_user_get: z.object({
    userId: z.string().describe("ID of the MySQL user to be retrieved"),
    output: z.enum(['txt', 'json', 'yaml']).optional().describe("Output format for the user details")
  }),
  
  mittwald_database_mysql_user_delete: z.object({
    userId: z.string().describe("ID of the MySQL user to delete"),
    quiet: z.boolean().optional().describe("Suppress process output"),
    force: z.boolean().optional().describe("Do not ask for confirmation")
  }),
  
  mittwald_database_mysql_user_update: z.object({
    userId: z.string().describe("ID of the MySQL user to update"),
    quiet: z.boolean().optional().describe("Suppress process output"),
    accessLevel: z.enum(['readonly', 'full']).optional().describe("Set the access level permissions"),
    description: z.string().optional().describe("Set the description for the MySQL user"),
    password: z.string().optional().describe("Password used for authentication"),
    accessIpMask: z.string().optional().describe("IP to restrict external access to"),
    enableExternalAccess: z.boolean().optional().describe("Enable external access"),
    disableExternalAccess: z.boolean().optional().describe("Disable external access")
  }),
  
  // Agent 6 Redis database tools
  mittwald_database_redis_create: MittwaldDatabaseRedisCreateSchema,
  mittwald_database_redis_get: MittwaldDatabaseRedisGetSchema,
  mittwald_database_redis_list: MittwaldDatabaseRedisListSchema,
  mittwald_database_redis_shell: MittwaldDatabaseRedisShellSchema,
  mittwald_database_redis_versions: MittwaldDatabaseRedisVersionsSchema,
  
  mittwald_database_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_database_mysql_charsets: z.object({
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_database_mysql_create: z.object({
    description: z.string().describe("A description for the database"),
    version: z.string().describe("The MySQL version to use"),
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    collation: z.string().optional().describe("The collation to use"),
    characterSet: z.string().optional().describe("The character set to use"),
    userPassword: z.string().optional().describe("The password to use for the default user"),
    userExternal: z.boolean().optional().describe("Enable external access for default user"),
    userAccessLevel: z.enum(["full", "readonly"]).optional().describe("The access level preset for the default user")
  }),
  
  mittwald_database_mysql_delete: z.object({
    databaseId: z.string().describe("ID or name of the database to delete"),
    force: z.boolean().optional().describe("Do not ask for confirmation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  // Backup tools
  mittwald_backup_create: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    expires: z.string().describe("Set the backup expiration time (duration format like 30d, 1y)"),
    description: z.string().optional().describe("Set a description for the backup"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    wait: z.boolean().optional().describe("Wait for the resource to be ready"),
    waitTimeout: z.string().optional().describe("The duration to wait for the resource to be ready")
  }),
  
  mittwald_backup_delete: z.object({
    backupId: z.string().describe("ID of the ProjectBackup to be deleted"),
    force: z.boolean().optional().describe("Do not ask for confirmation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_backup_download: z.object({
    backupId: z.string().describe("ID of the ProjectBackup to be downloaded"),
    target: z.string().describe("Target directory to download the backup to"),
    force: z.boolean().optional().describe("Force download even if target exists"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_backup_get: z.object({
    backupId: z.string().describe("ID of the ProjectBackup to be retrieved"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_backup_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_backup: z.object({
    help: z.boolean().optional().describe("Show help for backup commands")
  }),
  
  mittwald_backup_schedule_create: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    schedule: z.string().describe("Schedule for the backup (cron expression)"),
    retention: z.string().describe("Set the backup retention time (duration format like 30d, 1y)"),
    description: z.string().optional().describe("Set a description for the backup schedule"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_backup_schedule_delete: z.object({
    scheduleId: z.string().describe("ID of the ProjectBackupSchedule to be deleted"),
    force: z.boolean().optional().describe("Do not ask for confirmation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_backup_schedule_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_backup_schedule_update: z.object({
    scheduleId: z.string().describe("ID of the ProjectBackupSchedule to be updated"),
    schedule: z.string().optional().describe("Update schedule for the backup (cron expression)"),
    retention: z.string().optional().describe("Update the backup retention time (duration format like 30d, 1y)"),
    description: z.string().optional().describe("Update description for the backup schedule"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_backup_schedule: z.object({
    help: z.boolean().optional().describe("Show help for backup schedule commands")
  }),
  
  // Conversation tools
  mittwald_conversation_create: z.object({
    subject: z.string().describe("Subject of the conversation"),
    message: z.string().describe("Initial message content"),
    category: z.string().describe("Category of the conversation"),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional().describe("Priority of the conversation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_conversation_close: z.object({
    conversationId: z.string().describe("ID of the conversation to close"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_conversation_list: z.object({
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_conversation_reply: z.object({
    conversationId: z.string().describe("ID of the conversation to reply to"),
    message: z.string().describe("Reply message content"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_conversation_show: z.object({
    conversationId: z.string().describe("ID of the conversation to show"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_conversation_categories: z.object({
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_conversation: z.object({
    help: z.boolean().optional().describe("Show help for conversation commands")
  }),
  
  // User tools
  mittwald_user_get: z.object({
    userId: z.string().optional().describe("ID of the user to retrieve (defaults to current user)"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_user_api_token_create: z.object({
    description: z.string().describe("Description for the API token"),
    expiresAt: z.string().optional().describe("Expiration date for the token (ISO 8601 format)"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_user_api_token_get: z.object({
    tokenId: z.string().describe("ID of the API token to retrieve"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_user_api_token: z.object({
    help: z.boolean().optional().describe("Show help for user API token commands")
  }),
  
  mittwald_user: z.object({
    help: z.boolean().optional().describe("Show help for user commands")
  }),
  
  // SSH user tools
  mittwald_ssh_user_create: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    description: z.string().describe("Description for the SSH user"),
    authenticationMethod: z.enum(["password", "publickey"]).describe("Authentication method for the SSH user"),
    password: z.string().optional().describe("Password for the SSH user (required if authenticationMethod is password)"),
    publicKey: z.string().optional().describe("SSH public key (required if authenticationMethod is publickey)"),
    expiresAt: z.string().optional().describe("Expiration date for the SSH user (ISO 8601 format)"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_ssh_user_delete: z.object({
    sshUserId: z.string().describe("ID of the SSH user to delete"),
    force: z.boolean().optional().describe("Do not ask for confirmation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_ssh_user_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_ssh_user_update: z.object({
    sshUserId: z.string().describe("ID of the SSH user to update"),
    description: z.string().optional().describe("Update description for the SSH user"),
    authenticationMethod: z.enum(["password", "publickey"]).optional().describe("Update authentication method for the SSH user"),
    password: z.string().optional().describe("Update password for the SSH user"),
    publicKey: z.string().optional().describe("Update SSH public key"),
    expiresAt: z.string().optional().describe("Update expiration date for the SSH user (ISO 8601 format)"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_ssh_user: z.object({
    help: z.boolean().optional().describe("Show help for SSH user commands")
  }),
  
  // SFTP user tools
  mittwald_sftp_user_create: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    description: z.string().describe("Description for the SFTP user"),
    password: z.string().describe("Password for the SFTP user"),
    accessLevel: z.enum(["read", "full"]).optional().describe("Access level for the SFTP user"),
    directories: z.array(z.string()).optional().describe("List of directories the SFTP user has access to"),
    expiresAt: z.string().optional().describe("Expiration date for the SFTP user (ISO 8601 format)"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_sftp_user_delete: z.object({
    sftpUserId: z.string().describe("ID of the SFTP user to delete"),
    force: z.boolean().optional().describe("Do not ask for confirmation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_sftp_user_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_sftp_user_update: z.object({
    sftpUserId: z.string().describe("ID of the SFTP user to update"),
    description: z.string().optional().describe("Update description for the SFTP user"),
    password: z.string().optional().describe("Update password for the SFTP user"),
    accessLevel: z.enum(["read", "full"]).optional().describe("Update access level for the SFTP user"),
    directories: z.array(z.string()).optional().describe("Update list of directories the SFTP user has access to"),
    expiresAt: z.string().optional().describe("Update expiration date for the SFTP user (ISO 8601 format)"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_sftp_user: z.object({
    help: z.boolean().optional().describe("Show help for SFTP user commands")
  }),
  
  // SSH user CLI tools
  mittwald_ssh_user_create_cli: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    description: z.string().describe("Set description for SSH user"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    expires: z.string().optional().describe("An interval after which the SSH user expires (examples: 30m, 30d, 1y)"),
    publicKey: z.string().optional().describe("Public key used for authentication"),
    password: z.string().optional().describe("Password used for authentication")
  }),
  
  mittwald_ssh_user_delete_cli: z.object({
    sshUserId: z.string().describe("The ID of the SSH user to delete"),
    force: z.boolean().optional().describe("Do not ask for confirmation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_ssh_user_list_cli: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output in a more machine friendly format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_ssh_user_update_cli: z.object({
    sshUserId: z.string().describe("The ID of the SSH user to update"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    expires: z.string().optional().describe("An interval after which the SSH user expires (examples: 30m, 30d, 1y)"),
    description: z.string().optional().describe("Set description for SSH user"),
    publicKey: z.string().optional().describe("Public key used for authentication"),
    password: z.string().optional().describe("Password used for authentication"),
    enable: z.boolean().optional().describe("Enable the SSH user"),
    disable: z.boolean().optional().describe("Disable the SSH user")
  }),
  
  // SFTP user CLI tools
  mittwald_sftp_user_create_cli: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    description: z.string().describe("Set description for SFTP user"),
    directories: z.array(z.string()).describe("Specify directories to restrict this SFTP user's access to"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    expires: z.string().optional().describe("An interval after which the SFTP user expires (examples: 30m, 30d, 1y)"),
    publicKey: z.string().optional().describe("Public key used for authentication"),
    password: z.string().optional().describe("Password used for authentication"),
    accessLevel: z.enum(["read", "full"]).optional().describe("Set access level permissions for the SFTP user")
  }),
  
  mittwald_sftp_user_delete_cli: z.object({
    sftpUserId: z.string().describe("The ID of the SFTP user to delete"),
    force: z.boolean().optional().describe("Do not ask for confirmation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_sftp_user_list_cli: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output in a more machine friendly format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_sftp_user_update_cli: z.object({
    sftpUserId: z.string().describe("The ID of the SFTP user to update"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    expires: z.string().optional().describe("An interval after which the SFTP user expires (examples: 30m, 30d, 1y)"),
    description: z.string().optional().describe("Set description for SFTP user"),
    publicKey: z.string().optional().describe("Public key used for authentication"),
    password: z.string().optional().describe("Password used for authentication"),
    accessLevel: z.enum(["read", "full"]).optional().describe("Set access level permissions for the SFTP user"),
    directories: z.array(z.string()).optional().describe("Specify directories to restrict this SFTP user's access to"),
    enable: z.boolean().optional().describe("Enable the SFTP user"),
    disable: z.boolean().optional().describe("Disable the SFTP user")
  }),
  
  // Agent 11 tools
  mittwald_ddev_init: ddevInitSchema,
  mittwald_ddev_render_config: ddevRenderConfigSchema,
  mittwald_ddev: ddevMainSchema,
  mittwald_domain_get: domainGetSchema,
  mittwald_domain_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  mittwald_domain_dnszone_get: domainDnszoneGetSchema,
  mittwald_domain_dnszone_list: domainDnszoneListSchema,
  mittwald_domain_dnszone_update: domainDnszoneUpdateSchema,
  mittwald_domain_dnszone: domainDnszoneMainSchema,
  
  // Domain CLI schemas
  mittwald_domain_list_cli: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  mittwald_domain_get_cli: z.object({
    domainId: z.string().describe("The domain ID"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  mittwald_domain_dnszone_list_cli: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  mittwald_domain_dnszone_get_cli: z.object({
    dnszoneId: z.string().describe("The DNS zone ID"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  mittwald_domain_dnszone_update_cli: z.object({
    dnszoneId: z.string().describe("The DNS zone ID"),
    recordSet: z.enum(["a", "mx", "txt", "srv", "cname"]).describe("The record set type to update"),
    projectId: z.string().optional().describe("ID or short ID of a project"),
    set: z.array(z.string()).optional().describe("Set record values"),
    recordId: z.string().optional().describe("Specific record ID to update"),
    unset: z.array(z.string()).optional().describe("Unset record values"),
    quiet: z.boolean().optional().describe("Suppress output except for errors"),
    managed: z.boolean().optional().describe("Update managed records"),
    record: z.array(z.string()).optional().describe("Record values to set"),
    ttl: z.number().optional().describe("Time to live for the record")
  }),
  
  mittwald_domain_virtualhost: z.object({
    help: z.boolean().optional().describe("Show help for virtualhost commands")
  }),
  mittwald_domain_virtualhost_create: z.object({
    hostname: z.string().describe("Hostname for the virtual host"),
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    quiet: z.boolean().optional().describe("Suppress process output"),
    pathToApp: z.array(z.string()).optional().describe("Path to app mappings in format 'path:appId' (e.g., '/:a-3c96b5')"),
    pathToUrl: z.array(z.string()).optional().describe("Path to URL mappings in format 'path:url' (e.g., '/api:https://api.example.com')"),
    pathToContainer: z.array(z.string()).optional().describe("Path to container mappings in format 'path:containerId:port' (e.g., '/:c-f6kw84:5601/tcp')")
  }),
  mittwald_domain_virtualhost_delete: z.object({
    virtualHostId: z.string().describe("ID of the virtual host to delete"),
    force: z.boolean().optional().describe("Do not ask for confirmation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  mittwald_domain_virtualhost_get: z.object({
    ingressId: z.string().describe("ID of the ingress to retrieve"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  mittwald_domain_virtualhost_help: z.object({}),
  
  // Mail tools
  mittwald_mail: z.object({
    help: z.boolean().optional().describe("Show help for mail commands")
  }),
  
  mittwald_mail_deliverybox: z.object({
    help: z.boolean().optional().describe("Show help for mail deliverybox commands")
  }),
  
  mittwald_mail_address_create: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    address: z.string().describe("Email address to create"),
    password: z.string().optional().describe("Password for the email address"),
    forwards: z.array(z.string()).optional().describe("List of forwarding addresses"),
    catchAll: z.boolean().optional().describe("Set as catch-all address"),
    autoresponder: z.string().optional().describe("Auto-responder message"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_mail_address_delete: z.object({
    addressId: z.string().describe("ID of the mail address to delete"),
    force: z.boolean().optional().describe("Do not ask for confirmation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_mail_address_get: z.object({
    addressId: z.string().describe("ID of the mail address to retrieve"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_mail_address_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_mail_address: z.object({
    help: z.boolean().optional().describe("Show help for mail address commands")
  }),
  
  mittwald_mail_address_update: z.object({
    addressId: z.string().describe("ID of the mail address to update"),
    password: z.string().optional().describe("Update password for the email address"),
    forwards: z.array(z.string()).optional().describe("Update list of forwarding addresses"),
    catchAll: z.boolean().optional().describe("Update catch-all setting"),
    autoresponder: z.string().optional().describe("Update auto-responder message"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_mail_deliverybox_create: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    description: z.string().describe("Description for the deliverybox"),
    password: z.string().describe("Password for the deliverybox"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_mail_deliverybox_delete: z.object({
    deliveryboxId: z.string().describe("ID of the deliverybox to delete"),
    force: z.boolean().optional().describe("Do not ask for confirmation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_mail_deliverybox_get: z.object({
    deliveryboxId: z.string().describe("ID of the deliverybox to retrieve"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),
  
  mittwald_mail_deliverybox_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_mail_deliverybox_update: z.object({
    deliveryboxId: z.string().describe("ID of the deliverybox to update"),
    description: z.string().optional().describe("Update description for the deliverybox"),
    password: z.string().optional().describe("Update password for the deliverybox"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  // Agent 16 org tools
  mittwald_org_membership_list: z.object({
    orgId: z.string().optional().describe("ID or short ID of an org; this flag is optional if a default org is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  mittwald_org_membership_revoke: z.object({
    membershipId: z.string().describe("The ID of the membership to revoke"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),
  
  mittwald_org_membership: z.object({
    command: z.enum(["list", "list-own", "revoke"]).optional().describe("The membership command to run"),
    help: z.boolean().optional().describe("Show help for org membership commands")
  }),
  
  mittwald_org: z.object({
    command: z.enum(["delete", "get", "invite", "list", "membership"]).optional().describe("The org command to run"),
    help: z.boolean().optional().describe("Show help for org commands")
  }),
  
  // Contributor tool
  mittwald_contributor: z.object({
    help: z.boolean().optional().describe("Show help for contributor commands")
  }),
  
  // Context tools
  mittwald_context: z.object({
    command: z.enum(["get", "reset", "set"]).describe("The context command to execute"),
    projectId: z.string().optional().describe("ID or short ID of a project (set command)"),
    serverId: z.string().optional().describe("ID or short ID of a server (set command)"),
    orgId: z.string().optional().describe("ID or short ID of an organization (set command)"),
    installationId: z.string().optional().describe("ID or short ID of an app installation (set command)"),
    output: z.enum(["txt", "json"]).optional().describe("Output format for get command")
  }),
  
  mittwald_context_get: z.object({
    output: z.enum(["txt", "json"]).optional().describe("Output format")
  }),
  
  mittwald_context_reset: z.object({
    force: z.boolean().optional().describe("Do not ask for confirmation")
  }),
  
  mittwald_context_set: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project"),
    serverId: z.string().optional().describe("ID or short ID of a server"),
    orgId: z.string().optional().describe("ID or short ID of an organization"),
    installationId: z.string().optional().describe("ID or short ID of an app installation")
  }),

  mittwald_context_detect: z.object({
    id: z.string().describe("Any Mittwald ID to detect and analyze")
  }),

  // Container tools
  mittwald_container_list_stacks: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    output: z.enum(["json", "table", "csv", "tsv"]).optional().describe("Output format (default: table)"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header (only relevant for table output)"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for table output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  mittwald_container_list_services: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    output: z.enum(["json", "table", "csv", "tsv"]).optional().describe("Output format (default: table)"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header (only relevant for table output)"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for table output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  mittwald_container_list_volumes: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    output: z.enum(["json", "table", "csv", "tsv"]).optional().describe("Output format (default: table)"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header (only relevant for table output)"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for table output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  mittwald_container_list_registries: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    output: z.enum(["json", "table", "csv", "tsv"]).optional().describe("Output format (default: table)"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header (only relevant for table output)"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for table output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  mittwald_container_declare_stack: z.object({
    stackId: z.string().describe("ID of the stack to update"),
    desiredServices: z.record(z.string(), z.object({
      imageUri: z.string().describe("Container image URI"),
      environment: z.record(z.string(), z.string()).optional().describe("Environment variables"),
      ports: z.array(z.object({
        containerPort: z.number().describe("Port inside the container"),
        protocol: z.enum(["tcp", "udp"]).optional().describe("Protocol (default: tcp)")
      })).optional().describe("Port mappings"),
      volumes: z.array(z.object({
        name: z.string().describe("Volume name or absolute path"),
        mountPath: z.string().describe("Mount path inside the container"),
        readOnly: z.boolean().optional().describe("Mount as read-only")
      })).optional().describe("Volume mounts")
    })).optional().describe("Service configurations"),
    desiredVolumes: z.record(z.string(), z.object({
      size: z.string().optional().describe("Volume size (e.g., 1Gi)")
    })).optional().describe("Volume configurations")
  }),

  mittwald_container_get_service_logs: z.object({
    stackId: z.string().describe("ID of the stack"),
    serviceId: z.string().describe("ID of the service"),
    since: z.string().optional().describe("Show logs since timestamp (RFC3339)"),
    until: z.string().optional().describe("Show logs until timestamp (RFC3339)"),
    limit: z.number().optional().describe("Maximum number of log lines"),
    follow: z.boolean().optional().describe("Follow log output (not supported in MCP)")
  }),

  mittwald_container_create_registry: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    uri: z.string().describe("Registry URI"),
    imageRegistryType: z.enum(["docker", "github", "gitlab", "custom"]).optional().describe("Type of registry"),
    username: z.string().optional().describe("Registry username"),
    password: z.string().optional().describe("Registry password or token")
  }),
  
  mittwald_container_get_service: z.object({
    stackId: z.string().describe("ID of the stack the service belongs to"),
    serviceId: z.string().describe("ID of the service to retrieve")
  }),
  
  mittwald_container_get_stack: z.object({
    stackId: z.string().describe("ID of the stack to retrieve")
  }),

  mittwald_container_restart_service: z.object({
    stackId: z.string().describe("ID of the stack the service belongs to"),
    serviceId: z.string().describe("ID of the service to restart")
  }),

  mittwald_container_recreate_service: z.object({
    stackId: z.string().describe("ID of the stack the service belongs to"),
    serviceId: z.string().describe("ID of the service to recreate")
  }),

  mittwald_container_start_service: z.object({
    stackId: z.string().describe("ID of the stack the service belongs to"),
    serviceId: z.string().describe("ID of the service to start")
  }),

  mittwald_container_stop_service: z.object({
    stackId: z.string().describe("ID of the stack the service belongs to"),
    serviceId: z.string().describe("ID of the service to stop")
  }),

  mittwald_container_pull_image: z.object({
    stackId: z.string().describe("ID of the stack the service belongs to"),
    serviceId: z.string().describe("ID of the service to pull the image for")
  }),

  // Agent 12 Container CLI wrapper tools
  mittwald_container_list_cli: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project (optional if default project is set in context)"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format (default: txt)"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header (only relevant for table output)"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for table output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  mittwald_container_logs_cli: z.object({
    containerId: z.string().describe("ID of the container for which to get logs"),
    projectId: z.string().optional().describe("ID or short ID of a project (optional if default project is set in context)"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format (default: txt)"),
    noPager: z.boolean().optional().describe("Disable pager for output (always true in CLI context)")
  }),

  mittwald_container_delete_cli: z.object({
    containerId: z.string().describe("ID or short ID of the container to delete"),
    projectId: z.string().optional().describe("ID or short ID of a project (optional if default project is set in context)"),
    force: z.boolean().optional().describe("Do not ask for confirmation"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),

  mittwald_container_recreate_cli: z.object({
    containerId: z.string().describe("ID or short ID of the container to recreate"),
    projectId: z.string().optional().describe("ID or short ID of a project (optional if default project is set in context)"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    pull: z.boolean().optional().describe("Pull the container image before recreating the container"),
    force: z.boolean().optional().describe("Also recreate the container when it is already up to date")
  }),

  mittwald_container_restart_cli: z.object({
    containerId: z.string().describe("ID or short ID of the container to restart"),
    projectId: z.string().optional().describe("ID or short ID of a project (optional if default project is set in context)"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),

  mittwald_container_start_cli: z.object({
    containerId: z.string().describe("ID or short ID of the container to start"),
    projectId: z.string().optional().describe("ID or short ID of a project (optional if default project is set in context)"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),

  mittwald_container_stop_cli: z.object({
    containerId: z.string().describe("ID or short ID of the container to stop"),
    projectId: z.string().optional().describe("ID or short ID of a project (optional if default project is set in context)"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),

  mittwald_container_run_cli: z.object({
    image: z.string().describe("Container image (e.g., ubuntu:20.04 or alpine@sha256:abc123...)"),
    command: z.string().optional().describe("Override the default command specified in the container image"),
    args: z.array(z.string()).optional().describe("Runtime arguments passed to the command"),
    projectId: z.string().optional().describe("ID or short ID of a project (optional if default project is set in context)"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    env: z.array(z.string()).optional().describe("Set environment variables in the container (format: KEY=VALUE)"),
    envFile: z.array(z.string()).optional().describe("Read environment variables from files"),
    description: z.string().optional().describe("Add a descriptive label to the container"),
    entrypoint: z.string().optional().describe("Override the default entrypoint of the container image"),
    name: z.string().optional().describe("Assign a custom name to the container"),
    publish: z.array(z.string()).optional().describe("Publish container ports to the host (format: host-port:container-port)"),
    publishAll: z.boolean().optional().describe("Publish all ports that are defined in the image"),
    volume: z.array(z.string()).optional().describe("Bind mount volumes to the container (format: host-path:container-path)")
  }),

  // Agent 11 mail address CLI tools
  mittwald_mail_address_list_cli: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  mittwald_mail_address_get_cli: z.object({
    id: z.string().describe("ID of the mail address to retrieve"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),

  mittwald_mail_address_create_cli: z.object({
    address: z.string().describe("Mail address to create"),
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    catchAll: z.boolean().optional().describe("Make this a catch-all mail address"),
    enableSpamProtection: z.boolean().optional().describe("Enable spam protection for this mailbox"),
    quota: z.string().optional().describe("Mailbox quota (default: 1GiB)"),
    password: z.string().optional().describe("Mailbox password"),
    randomPassword: z.boolean().optional().describe("Generate a random password"),
    forwardTo: z.array(z.string()).optional().describe("Forward mail to other addresses")
  }),

  mittwald_mail_address_delete_cli: z.object({
    id: z.string().describe("ID of the mail address to delete"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    force: z.boolean().optional().describe("Do not ask for confirmation")
  }),

  mittwald_mail_address_update_cli: z.object({
    id: z.string().describe("ID of the mail address to update"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    catchAll: z.boolean().optional().describe("Make this a catch-all mail address"),
    enableSpamProtection: z.boolean().optional().describe("Enable spam protection for this mailbox"),
    quota: z.string().optional().describe("Mailbox quota"),
    password: z.string().optional().describe("Mailbox password"),
    randomPassword: z.boolean().optional().describe("Generate a random password"),
    forwardTo: z.array(z.string()).optional().describe("Forward mail to other addresses")
  }),

  // Agent 11 mail deliverybox CLI tools
  mittwald_mail_deliverybox_list_cli: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),

  mittwald_mail_deliverybox_get_cli: z.object({
    id: z.string().describe("ID of the delivery box to retrieve"),
    output: z.enum(["txt", "json", "yaml"]).optional().describe("Output format")
  }),

  mittwald_mail_deliverybox_create_cli: z.object({
    description: z.string().describe("Description for the delivery box"),
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    password: z.string().optional().describe("Delivery box password"),
    randomPassword: z.boolean().optional().describe("Generate a random password")
  }),

  mittwald_mail_deliverybox_delete_cli: z.object({
    id: z.string().describe("ID of the delivery box to delete"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    force: z.boolean().optional().describe("Do not ask for confirmation")
  }),

  mittwald_mail_deliverybox_update_cli: z.object({
    id: z.string().describe("ID of the delivery box to update"),
    description: z.string().optional().describe("New description for the delivery box"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary"),
    password: z.string().optional().describe("Delivery box password"),
    randomPassword: z.boolean().optional().describe("Generate a random password")
  })
};

/**
 * Type mapping of tool names to their argument types.
 * 
 * @remarks
 * This type ensures type safety when dispatching tool calls
 * to their respective handlers.
 */
type ToolArgs = {
  // Agent-18 project tools
  mittwald_project_create: {
    description: string;
    serverId: string;
    wait?: boolean;
    waitTimeout?: number;
    updateContext?: boolean;
  };
  mittwald_project_delete: {
    projectId: string;
    force: boolean;
  };
  mittwald_project_get: {
    projectId: string;
    output?: 'json' | 'table' | 'yaml';
  };
  mittwald_project_filesystem_usage: {
    projectId: string;
    human?: boolean;
  };
  mittwald_project_invite_get: {
    inviteId: string;
    output?: 'json' | 'table' | 'yaml';
  };
  
  mittwald_project_invite_list: {
    projectId?: string;
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  
  mittwald_project_invite_list_own: {
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  
  mittwald_project_list: {
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    csvSeparator?: ',' | ';';
    noHeader?: boolean;
    noRelativeDates?: boolean;
    noTruncate?: boolean;
  };
  
  mittwald_project_ssh: {
    projectId: string;
    sshUser?: string;
    sshIdentityFile?: string;
  };
  
  mittwald_project: {
    help?: boolean;
  };
  
  mittwald_project_invite: {
    command?: 'get' | 'list' | 'list-own';
    help?: boolean;
  };
  
  mittwald_project_membership: {
    command?: 'get' | 'get-own' | 'list' | 'list-own';
    help?: boolean;
  };
  
  mittwald_project_membership_get: {
    membershipId: string;
    output?: 'txt' | 'json' | 'yaml';
  };
  
  mittwald_project_membership_get_own: {
    projectId: string;
    output?: 'txt' | 'json' | 'yaml';
  };
  
  mittwald_project_membership_list: {
    projectId: string;
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  
  mittwald_project_membership_list_own: {
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  
  mittwald_project_update: {
    projectId: string;
    description?: string;
    defaultIp?: 'v4' | 'v6';
  };

  // Project CLI tool types
  mittwald_project_list_cli: {
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    csvSeparator?: ',' | ';';
    noHeader?: boolean;
    noRelativeDates?: boolean;
    noTruncate?: boolean;
  };
  
  mittwald_project_get_cli: {
    projectId: string;
    output?: 'txt' | 'json' | 'yaml';
  };
  
  mittwald_project_create_cli: {
    description: string;
    serverId?: string;
    quiet?: boolean;
    wait?: boolean;
    waitTimeout?: string;
    updateContext?: boolean;
  };
  
  mittwald_project_delete_cli: {
    projectId: string;
    quiet?: boolean;
    force?: boolean;
  };
  
  mittwald_project_update_cli: {
    projectId: string;
    description?: string;
    quiet?: boolean;
  };
  
  mittwald_project_ssh_cli: {
    projectId: string;
    sshUser?: string;
    sshIdentityFile?: string;
  };
  
  mittwald_project_filesystem_usage_cli: {
    projectId: string;
    output?: 'txt' | 'json' | 'yaml';
    human?: boolean;
  };

  // Agent 2 app dependency types
  mittwald_app_dependency_update: {
    installation_id?: string;
    set: string[];
    update_policy?: 'none' | 'inheritedFromApp' | 'patchLevel' | 'all';
    quiet?: boolean;
  };

  mittwald_app_dependency_versions: {
    systemsoftware: string;
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    no_header?: boolean;
    no_truncate?: boolean;
    no_relative_dates?: boolean;
    csv_separator?: ',' | ';';
  };

  // Agent 3 app install types
  mittwald_app_install_joomla: {
    projectId: string;
    version?: string;
    host?: string;
    adminUser?: string;
    adminEmail?: string;
    adminPass?: string;
    adminFirstname?: string;
    adminLastname?: string;
    siteTitle?: string;
    wait?: boolean;
    waitTimeout?: number;
  };
  mittwald_app_install_matomo: {
    projectId: string;
    version?: string;
    host?: string;
    adminUser?: string;
    adminEmail?: string;
    adminPass?: string;
    siteTitle?: string;
    wait?: boolean;
    waitTimeout?: number;
  };
  mittwald_app_install_nextcloud: {
    projectId: string;
    version?: string;
    host?: string;
    adminUser?: string;
    adminEmail?: string;
    adminPass?: string;
    siteTitle?: string;
    wait?: boolean;
    waitTimeout?: number;
  };
  mittwald_app_install_shopware5: {
    projectId: string;
    version?: string;
    host?: string;
    adminUser?: string;
    adminEmail?: string;
    adminPass?: string;
    adminFirstname?: string;
    adminLastname?: string;
    siteTitle?: string;
    shopEmail?: string;
    shopLang?: string;
    shopCurrency?: string;
    wait?: boolean;
    waitTimeout?: number;
  };
  mittwald_app_install_shopware6: {
    projectId: string;
    version?: string;
    host?: string;
    adminUser?: string;
    adminEmail?: string;
    adminPass?: string;
    adminFirstname?: string;
    adminLastname?: string;
    siteTitle?: string;
    shopEmail?: string;
    shopLang?: string;
    shopCurrency?: string;
    wait?: boolean;
    waitTimeout?: number;
  };
  mittwald_app_install_typo3: {
    projectId: string;
    version?: string;
    host?: string;
    adminUser?: string;
    adminEmail?: string;
    adminPass?: string;
    siteTitle?: string;
    installMode?: string;
    wait?: boolean;
    waitTimeout?: number;
  };
  mittwald_app_install_wordpress: {
    projectId: string;
    version?: string;
    host?: string;
    adminUser?: string;
    adminEmail?: string;
    adminPass?: string;
    siteTitle?: string;
    wait?: boolean;
    waitTimeout?: number;
  };
  
  // Agent 3 app management types
  mittwald_app: {
    help?: boolean;
  };
  
  mittwald_app_copy: {
    installationId: string;
    description: string;
    quiet?: boolean;
  };
  
  mittwald_app_create: {
    help?: boolean;
  };
  
  mittwald_app_list: {
    projectId?: string;
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  mittwald_app_open: {
    installationId?: string;
  };
  mittwald_app_ssh: {
    installationId?: string;
    sshUser?: string;
    sshIdentityFile?: string;
    cd?: boolean;
    info?: boolean;
    test?: boolean;
  };
  mittwald_app_uninstall: {
    installationId?: string;
    force?: boolean;
    quiet?: boolean;
  };
  mittwald_app_update: {
    installationId?: string;
    description?: string;
    documentRoot?: string;
    entrypoint?: string;
    quiet?: boolean;
  };
  mittwald_app_upgrade: z.infer<typeof mittwald_app_upgrade_schema>;
  mittwald_app_upload: {
    installationId?: string;
    source: string;
    exclude?: string[];
    dryRun?: boolean;
    delete?: boolean;
    sshUser?: string;
    sshIdentityFile?: string;
    remoteSubDirectory?: string;
    quiet?: boolean;
  };
  mittwald_app_versions: {
    app?: string;
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };

  // Agent 14 tools
  mittwald_domain_virtualhost_list: {
    projectId?: string;
    all?: boolean;
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  mittwald_extension_install: {
    projectId: string;
    extensionId: string;
    description?: string;
    consent?: boolean;
    wait?: boolean;
    waitTimeout?: number;
  };
  mittwald_extension_list: {};
  mittwald_extension_list_installed: {
    projectId?: string;
    orgId?: string;
  };
  mittwald_extension_uninstall: {
    extensionInstanceId: string;
  };
  
  // Agent 7 cronjob execution tools
  mittwald_cronjob_execution_abort: {
    cronjobId: string;
    executionId: string;
    quiet?: boolean;
  };
  
  mittwald_cronjob_execution_get: {
    cronjobId: string;
    executionId: string;
    output?: 'txt' | 'json' | 'yaml';
  };
  
  mittwald_cronjob_execution_list: {
    cronjobId: string;
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  
  mittwald_cronjob_execution_logs: {
    cronjobId: string;
    executionId: string;
    output?: 'txt' | 'json' | 'yaml';
    noPager?: boolean;
  };
  
  mittwald_cronjob_execution: {
    command?: 'abort' | 'get' | 'list' | 'logs';
    help?: boolean;
  };
  
  // Agent 8 cronjob tools
  mittwald_cronjob_get: {
    cronjobId: string;
    output?: 'txt' | 'json' | 'yaml';
  };
  
  mittwald_cronjob_list: {
    projectId?: string;
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  
  mittwald_cronjob_update: {
    cronjobId: string;
    quiet?: boolean;
    description?: string;
    interval?: string;
    email?: string;
    url?: string;
    command?: string;
    interpreter?: 'bash' | 'php';
    enable?: boolean;
    disable?: boolean;
    timeout?: string;
  };
  
  mittwald_cronjob: {
    help?: boolean;
  };
  
  // Agent 9 database tools
  mittwald_database_mysql_dump: {
    databaseId: string;
    output: string;
    mysqlPassword?: string;
    quiet?: boolean;
    gzip?: boolean;
    mysqlCharset?: string;
    temporaryUser?: boolean;
    sshUser?: string;
    sshIdentityFile?: string;
  };
  mittwald_database_mysql_get: {
    databaseId: string;
    output: 'txt' | 'json' | 'yaml';
  };
  mittwald_database_mysql_import: {
    databaseId: string;
    input: string;
    mysqlPassword?: string;
    quiet?: boolean;
    gzip?: boolean;
    mysqlCharset?: string;
    temporaryUser?: boolean;
    sshUser?: string;
    sshIdentityFile?: string;
  };
  mittwald_database_mysql_list: {
    projectId?: string;
    output: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  mittwald_database_mysql_phpmyadmin: {
    databaseId: string;
  };
  mittwald_database_mysql_port_forward: {
    databaseId: string;
    port: number;
    sshUser?: string;
    sshIdentityFile?: string;
  };
  mittwald_database_mysql_shell: {
    databaseId: string;
    mysqlPassword?: string;
    mysqlCharset?: string;
    temporaryUser?: boolean;
    sshUser?: string;
    sshIdentityFile?: string;
  };
  mittwald_database_mysql_versions: {
    output: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  
  mittwald_database_list: {
    projectId?: string;
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  
  mittwald_database_mysql_charsets: {
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  
  mittwald_database_mysql_create: {
    description: string;
    version: string;
    projectId?: string;
    quiet?: boolean;
    collation?: string;
    characterSet?: string;
    userPassword?: string;
    userExternal?: boolean;
    userAccessLevel?: 'full' | 'readonly';
  };
  
  mittwald_database_mysql_delete: {
    databaseId: string;
    force?: boolean;
    quiet?: boolean;
  };
  
  // Agent 11 tools
  mittwald_ddev_init: z.infer<typeof ddevInitSchema>;
  mittwald_ddev_render_config: z.infer<typeof ddevRenderConfigSchema>;
  mittwald_ddev: z.infer<typeof ddevMainSchema>;
  mittwald_domain_get: z.infer<typeof domainGetSchema>;
  mittwald_domain_dnszone_get: z.infer<typeof domainDnszoneGetSchema>;
  mittwald_domain_dnszone_list: z.infer<typeof domainDnszoneListSchema>;
  mittwald_domain_dnszone_update: z.infer<typeof domainDnszoneUpdateSchema>;
  mittwald_domain_dnszone: z.infer<typeof domainDnszoneMainSchema>;
  
  // Agent 15 mail tools
  mittwald_mail_deliverybox: {
    help?: boolean;
  };
  
  // Agent 16 org tools
  mittwald_org_membership_list: {
    orgId?: string;
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  
  mittwald_org_membership_revoke: {
    membershipId: string;
    quiet?: boolean;
  };
  
  mittwald_org_membership: {
    command?: 'list' | 'list-own' | 'revoke';
    help?: boolean;
  };
  
  mittwald_org: {
    command?: 'delete' | 'get' | 'invite' | 'list' | 'membership';
    help?: boolean;
  };
  
  // Contributor tool
  mittwald_contributor: {
    help?: boolean;
  };
  
  // Context tools
  mittwald_context: {
    command: 'get' | 'reset' | 'set';
    projectId?: string;
    serverId?: string;
    orgId?: string;
    installationId?: string;
    output?: 'txt' | 'json';
  };
  
  mittwald_context_get: {
    output?: 'txt' | 'json';
  };
  
  mittwald_context_reset: {
    force?: boolean;
  };
  
  mittwald_context_set: {
    projectId?: string;
    serverId?: string;
    orgId?: string;
    installationId?: string;
  };

  mittwald_context_detect: z.infer<typeof ToolSchemas.mittwald_context_detect>;

  // Container tools
  mittwald_container_list_stacks: z.infer<typeof ToolSchemas.mittwald_container_list_stacks>;
  mittwald_container_list_services: z.infer<typeof ToolSchemas.mittwald_container_list_services>;
  mittwald_container_list_volumes: z.infer<typeof ToolSchemas.mittwald_container_list_volumes>;
  mittwald_container_list_registries: z.infer<typeof ToolSchemas.mittwald_container_list_registries>;
  mittwald_container_declare_stack: z.infer<typeof ToolSchemas.mittwald_container_declare_stack>;
  mittwald_container_get_service_logs: z.infer<typeof ToolSchemas.mittwald_container_get_service_logs>;
  mittwald_container_create_registry: z.infer<typeof ToolSchemas.mittwald_container_create_registry>;
  mittwald_container_get_service: z.infer<typeof ToolSchemas.mittwald_container_get_service>;
  mittwald_container_get_stack: z.infer<typeof ToolSchemas.mittwald_container_get_stack>;
  mittwald_container_restart_service: z.infer<typeof ToolSchemas.mittwald_container_restart_service>;
  mittwald_container_recreate_service: z.infer<typeof ToolSchemas.mittwald_container_recreate_service>;
  mittwald_container_start_service: z.infer<typeof ToolSchemas.mittwald_container_start_service>;
  mittwald_container_stop_service: z.infer<typeof ToolSchemas.mittwald_container_stop_service>;
  mittwald_container_pull_image: z.infer<typeof ToolSchemas.mittwald_container_pull_image>;

  // Agent 12 Container CLI wrapper tools
  mittwald_container_list_cli: z.infer<typeof ToolSchemas.mittwald_container_list_cli>;
  mittwald_container_logs_cli: z.infer<typeof ToolSchemas.mittwald_container_logs_cli>;
  mittwald_container_delete_cli: z.infer<typeof ToolSchemas.mittwald_container_delete_cli>;
  mittwald_container_recreate_cli: z.infer<typeof ToolSchemas.mittwald_container_recreate_cli>;
  mittwald_container_restart_cli: z.infer<typeof ToolSchemas.mittwald_container_restart_cli>;
  mittwald_container_start_cli: z.infer<typeof ToolSchemas.mittwald_container_start_cli>;
  mittwald_container_stop_cli: z.infer<typeof ToolSchemas.mittwald_container_stop_cli>;
  mittwald_container_run_cli: z.infer<typeof ToolSchemas.mittwald_container_run_cli>;

  // Agent 11 mail address CLI tools
  mittwald_mail_address_list_cli: z.infer<typeof ToolSchemas.mittwald_mail_address_list_cli>;
  mittwald_mail_address_get_cli: z.infer<typeof ToolSchemas.mittwald_mail_address_get_cli>;
  mittwald_mail_address_create_cli: z.infer<typeof ToolSchemas.mittwald_mail_address_create_cli>;
  mittwald_mail_address_delete_cli: z.infer<typeof ToolSchemas.mittwald_mail_address_delete_cli>;
  mittwald_mail_address_update_cli: z.infer<typeof ToolSchemas.mittwald_mail_address_update_cli>;

  // Agent 11 mail deliverybox CLI tools
  mittwald_mail_deliverybox_list_cli: z.infer<typeof ToolSchemas.mittwald_mail_deliverybox_list_cli>;
  mittwald_mail_deliverybox_get_cli: z.infer<typeof ToolSchemas.mittwald_mail_deliverybox_get_cli>;
  mittwald_mail_deliverybox_create_cli: z.infer<typeof ToolSchemas.mittwald_mail_deliverybox_create_cli>;
  mittwald_mail_deliverybox_delete_cli: z.infer<typeof ToolSchemas.mittwald_mail_deliverybox_delete_cli>;
  mittwald_mail_deliverybox_update_cli: z.infer<typeof ToolSchemas.mittwald_mail_deliverybox_update_cli>;
};

/**
 * Handles MCP tool listing requests.
 * 
 * @remarks
 * Returns all available tools sorted alphabetically by name.
 * This allows MCP clients to discover what tools are available
 * for interacting with the CLI.
 * 
 * @param _request - The tool listing request (currently unused)
 * @returns Promise resolving to the list of available tools
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools#listing-tools | Listing Tools}
 */
export async function handleListTools(_request: ListToolsRequest): Promise<ListToolsResult> {
  try {
    logger.info(`🔧 handleListTools called, TOOLS.length: ${TOOLS.length}`);
    
    // Check if tool filtering is enabled
    if (CONFIG.TOOL_FILTER_ENABLED === 'true') {
      const maxTools = CONFIG.MAX_TOOLS_PER_RESPONSE ? parseInt(CONFIG.MAX_TOOLS_PER_RESPONSE, 10) : 50;
      const allowedCategories = CONFIG.ALLOWED_TOOL_CATEGORIES?.split(',').map(c => c.trim()).filter(Boolean);
      
      const filterOptions = {
        maxTools,
        categories: allowedCategories && allowedCategories.length > 0 ? allowedCategories : undefined,
      };
      
      const result = filterTools(TOOLS, filterOptions);
      
      logger.info(`📊 Tool filtering enabled:`);
      logger.info(`   Total tools: ${TOOLS.length}`);
      logger.info(`   Filtered tools: ${result.tools.length}`);
      logger.info(`   Max per response: ${maxTools}`);
      if (allowedCategories?.length) {
        logger.info(`   Allowed categories: ${allowedCategories.join(', ')}`);
      }
      
      // Log tool counts by category for debugging
      const categoryCounts = getToolCountByCategory(TOOLS);
      logger.info(`   Available categories: ${Object.entries(categoryCounts).map(([cat, count]) => `${cat}(${count})`).join(', ')}`);
      
      return { 
        tools: result.tools,
        // Include metadata about pagination if there are more tools
        ...(result.nextCursor && {
          _meta: {
            nextCursor: result.nextCursor,
            totalCount: result.totalCount,
            hasMore: !!result.nextCursor
          }
        })
      };
    }
    
    // Default behavior: return all tools sorted
    const tools = [...TOOLS].sort((a, b) => a.name.localeCompare(b.name));
    
    // Log warning about large tool list
    const estimatedSize = JSON.stringify({ tools }).length;
    if (estimatedSize > 100000) { // > 100KB
      logger.warn(`⚠️  Large tool list response: ${tools.length} tools, estimated ${Math.round(estimatedSize / 1024)}KB`);
      logger.warn(`   Consider enabling TOOL_FILTER_ENABLED=true to reduce response size`);
    }
    
    logger.info(`✅ Returning ${tools.length} tools (filtering disabled)`);
    return { tools };
  } catch (error) {
    logger.error("Failed to list tools", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { tools: TOOLS };
  }
}


/**
 * Handles MCP tool invocation requests.
 * 
 * @remarks
 * This is the main dispatcher for tool calls. It:
 * 1. Validates the requested tool exists
 * 2. Validates tool arguments against the tool's input schema
 * 3. Creates a minimal handler context
 * 4. Dispatches to the appropriate tool handler
 * 5. Returns the tool result or error
 * 
 * @param request - The tool invocation request containing tool name and arguments
 * @param context - MCP context containing authentication and session information
 * @returns Promise resolving to the tool execution result
 * @throws Error if tool is unknown, auth fails, or execution fails
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools#calling-tools | Calling Tools}
 */
export async function handleToolCall(
  request: CallToolRequest,
  context: MCPToolContext,
): Promise<CallToolResult> {
  
  try {
    logger.info(`🔧 handleToolCall called for tool: ${request.params.name}`);
    
    // For utility tools, create minimal context without any service
    const handlerContext: ToolHandlerContext = {
      redditService: null as any, // Not used for utility tools
      userId: 'utility-user',
      sessionId: context.sessionId,
      progressToken: request.params._meta?.progressToken,
    };


    if (!request.params.arguments) {
      const toolName = request.params?.name || 'unknown';
      logger.error("Tool call missing required arguments", { toolName });
      
      // Provide helpful error message for specific tools
      if (toolName === 'mittwald_domain_virtualhost_create') {
        throw new Error("Arguments are required. Expected: { hostname: string, pathToApp?: string[], pathToUrl?: string[], pathToContainer?: string[] }. At least one path mapping is required. For containers use pathToContainer: ['/:c-xxxxx:port/tcp'].");
      }
      
      throw new Error(`Arguments are required for tool '${toolName}'`);
    }

    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      logger.error("Unknown tool requested", { toolName: request.params.name });
      throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }


    // Validate arguments using Zod schema
    const toolName = request.params.name as keyof typeof ToolSchemas;
    const schema = ToolSchemas[toolName];
    
    // Debug: Check schema lookup for Python
    if (toolName === 'mittwald_app_create_python') {
      logger.info('Looking up schema for Python:', {
        toolName,
        schemaFound: !!schema
      });
    }
    
    if (!schema) {
      logger.error("No Zod schema found for tool", { toolName });
      throw new Error(`No validation schema found for tool: ${toolName}`);
    }
    
    let args: any;
    try {
      // For app install tools, map snake_case to camelCase before validation
      let argumentsToValidate = request.params.arguments;
      if (toolName.startsWith('mittwald_app_install_') && toolName !== 'mittwald_app_install') {
        logger.info('Mapping app install params for', toolName);
        logger.info('Original args:', JSON.stringify(request.params.arguments));
        argumentsToValidate = mapAppInstallParams(request.params.arguments);
        logger.info('Mapped args:', JSON.stringify(argumentsToValidate));
      }
      
      // Debug logging for create tools
      if (toolName.startsWith('mittwald_app_create_')) {
        logger.info(`Validating ${toolName} with args:`, JSON.stringify(argumentsToValidate));
        logger.info(`Schema for ${toolName}:`, schema);
      }
      
      const validatedArgs = schema.parse(argumentsToValidate);
      args = validatedArgs;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error("Tool argument validation failed", { 
          toolName, 
          errors: error.errors,
          arguments: request.params.arguments 
        });
        throw new Error(`Invalid arguments for tool ${toolName}: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }


    let result: CallToolResult;

    switch (request.params.name) {
      // Agent-18 project tools
      case "mittwald_project_create":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldProjectCreateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectCreate(args as ToolArgs['mittwald_project_create'], mittwaldProjectCreateContext);
        break;
      case "mittwald_project_delete":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldProjectDeleteContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectDelete(args as ToolArgs['mittwald_project_delete'], mittwaldProjectDeleteContext);
        break;
      case "mittwald_project_get":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldProjectGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectGet(args as ToolArgs['mittwald_project_get'], mittwaldProjectGetContext);
        break;
      case "mittwald_project_filesystem_usage":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldProjectFilesystemUsageContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectFilesystemUsage(args as ToolArgs['mittwald_project_filesystem_usage'], mittwaldProjectFilesystemUsageContext);
        break;
      case "mittwald_project_invite_get":
        const mittwaldProjectInviteGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectInviteGetCli(args as ToolArgs['mittwald_project_invite_get'], mittwaldProjectInviteGetContext);
        break;
      case "mittwald_project_invite_list":
        const mittwaldProjectInviteListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectInviteListCli(args as ToolArgs['mittwald_project_invite_list'], mittwaldProjectInviteListContext);
        break;
      case "mittwald_project_invite_list_own":
        const mittwaldProjectInviteListOwnContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectInviteListOwnCli(args as ToolArgs['mittwald_project_invite_list_own'], mittwaldProjectInviteListOwnContext);
        break;
      case "mittwald_project_list":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldProjectListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleMittwaldProjectList(args, mittwaldProjectListContext);
        break;
        
      case "mittwald_project_ssh":
        const mittwaldProjectSSHContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectSSH(args, mittwaldProjectSSHContext);
        break;
        
      case "mittwald_project_invite":
        const mittwaldProjectInviteContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleMittwaldProjectInvite(args, mittwaldProjectInviteContext);
        break;
        
      case "mittwald_project_membership":
        const mittwaldProjectMembershipContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleMittwaldProjectMembership(args, mittwaldProjectMembershipContext);
        break;
        
      case "mittwald_project_membership_get":
        const mittwaldProjectMembershipGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectMembershipGetCli(args as ToolArgs['mittwald_project_membership_get'], mittwaldProjectMembershipGetContext);
        break;
        
      case "mittwald_project_membership_get_own":
        const mittwaldProjectMembershipGetOwnContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectMembershipGetOwnCli(args as ToolArgs['mittwald_project_membership_get_own'], mittwaldProjectMembershipGetOwnContext);
        break;
        
      case "mittwald_project_membership_list":
        const mittwaldProjectMembershipListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectMembershipListCli(args as ToolArgs['mittwald_project_membership_list'], mittwaldProjectMembershipListContext);
        break;
        
      case "mittwald_project_membership_list_own":
        const mittwaldProjectMembershipListOwnContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectMembershipListOwnCli(args as ToolArgs['mittwald_project_membership_list_own'], mittwaldProjectMembershipListOwnContext);
        break;
        
      case "mittwald_project_update":
        const mittwaldProjectUpdateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectUpdate(args, mittwaldProjectUpdateContext);
        break;

      // Project CLI tools
      case "mittwald_project_list_cli":
        const mittwaldProjectListCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleMittwaldProjectListCli(args as ToolArgs['mittwald_project_list_cli'], mittwaldProjectListCliContext);
        break;
        
      case "mittwald_project_get_cli":
        const mittwaldProjectGetCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectGetCli(args as ToolArgs['mittwald_project_get_cli'], mittwaldProjectGetCliContext);
        break;
        
      case "mittwald_project_create_cli":
        const mittwaldProjectCreateCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectCreateCli(args as ToolArgs['mittwald_project_create_cli'], mittwaldProjectCreateCliContext);
        break;
        
      case "mittwald_project_delete_cli":
        const mittwaldProjectDeleteCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectDeleteCli(args as ToolArgs['mittwald_project_delete_cli'], mittwaldProjectDeleteCliContext);
        break;
        
      case "mittwald_project_update_cli":
        const mittwaldProjectUpdateCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectUpdateCli(args as ToolArgs['mittwald_project_update_cli'], mittwaldProjectUpdateCliContext);
        break;
        
      case "mittwald_project_ssh_cli":
        const mittwaldProjectSshCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectSshCli(args as ToolArgs['mittwald_project_ssh_cli'], mittwaldProjectSshCliContext);
        break;
        
      case "mittwald_project_filesystem_usage_cli":
        const mittwaldProjectFilesystemUsageCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectFilesystemUsageCli(args as ToolArgs['mittwald_project_filesystem_usage_cli'], mittwaldProjectFilesystemUsageCliContext);
        break;
        
      case "mittwald_server_list":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldServerListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleServerList(args, mittwaldServerListContext);
        break;
        
      case "mittwald_server_get":
        const mittwaldServerGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleServerGet(args, mittwaldServerGetContext);
        break;
        
      case "mittwald_server":
        const mittwaldServerContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleServer(args, mittwaldServerContext);
        break;

      // Agent 2 app dependency tools
      case "mittwald_app_dependency_update":
        const mittwaldAppDependencyUpdateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleMittwaldAppDependencyUpdate(args, mittwaldAppDependencyUpdateContext);
        break;

      case "mittwald_app_dependency_versions":
        const mittwaldAppDependencyVersionsContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleMittwaldAppDependencyVersions(args, mittwaldAppDependencyVersionsContext);
        break;

      case "mittwald_app_dependency_list":
        const mittwaldAppDependencyListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleMittwaldAppDependencyList(args, mittwaldAppDependencyListContext);
        break;

      case "mittwald_app_dependency_get":
        const mittwaldAppDependencyGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleMittwaldAppDependencyGet(args, mittwaldAppDependencyGetContext);
        break;

      case "mittwald_app_download":
        result = await handleMittwaldAppDownload(args);
        break;

      case "mittwald_app_get":
        const mittwaldAppGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleMittwaldAppGet(args, mittwaldAppGetContext);
        break;

      case "mittwald_app_install":
        const mittwaldAppInstallContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleMittwaldAppInstall(args, mittwaldAppInstallContext);
        break;

      case "mittwald_app_install_contao":
        // Use CLI wrapper instead of direct API calls
        result = await handleAppInstallContaoCli(args);
        break;

      case "mittwald_app_list_upgrade_candidates":
        result = await handleMittwaldAppListUpgradeCandidates(args);
        break;

      // Agent 3 app install tools
      case "mittwald_app_install_joomla":
        // Use CLI wrapper instead of direct API calls
        result = await handleAppInstallJoomlaCli(args);
        break;
      case "mittwald_app_install_matomo":
        // Use CLI wrapper instead of direct API calls
        result = await handleAppInstallMatomoCli(args);
        break;
      case "mittwald_app_install_nextcloud":
        // Use CLI wrapper instead of direct API calls
        result = await handleAppInstallNextcloudCli(args);
        break;
      case "mittwald_app_install_shopware5":
        // Use CLI wrapper instead of direct API calls
        result = await handleAppInstallShopware5Cli(args);
        break;
      case "mittwald_app_install_shopware6":
        // Use CLI wrapper instead of direct API calls
        result = await handleAppInstallShopware6Cli(args);
        break;
      case "mittwald_app_install_typo3":
        // Use CLI wrapper instead of direct API calls
        result = await handleAppInstallTypo3Cli(args);
        break;
      case "mittwald_app_install_wordpress":
        // Use CLI wrapper instead of direct API calls
        result = await handleAppInstallWordpressCli(args);
        break;

      // App create tools
      case "mittwald_app_create_node":
        const mittwaldAppCreateNodeContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleAppCreateNodeCli(args);
        break;
        
      case "mittwald_app_create_php":
        const mittwaldAppCreatePhpContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleAppCreatePhpCli(args);
        break;
        
      case "mittwald_app_create_php_worker":
        const mittwaldAppCreatePhpWorkerContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleAppCreatePhpWorkerCli(args);
        break;
        
      case "mittwald_app_create_python":
        const mittwaldAppCreatePythonContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleAppCreatePythonCli(args);
        break;
        
      case "mittwald_app_create_static":
        const mittwaldAppCreateStaticContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleAppCreateStaticCli(args);
        break;

      // Agent 3 app management tools
      case "mittwald_app":
        const mittwaldAppContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleApp(args, mittwaldAppContext);
        break;
        
      case "mittwald_app_copy":
        const mittwaldAppCopyContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleAppCopy(args, mittwaldAppCopyContext);
        break;
        
      case "mittwald_app_create":
        const mittwaldAppCreateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleAppCreate(args, mittwaldAppCreateContext);
        break;
        
      case "mittwald_app_list":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
          projectContext: {
            projectId: (args as any).projectId
          }
        };
        result = await handleAppList(args, mittwaldAppListContext);
        break;
      case "mittwald_app_open":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppOpenContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
          appContext: {
            installationId: (args as any).installationId
          }
        };
        result = await handleAppOpen(args, mittwaldAppOpenContext);
        break;
      case "mittwald_app_ssh":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppSshContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
          appContext: {
            installationId: (args as any).installationId
          }
        };
        result = await handleAppSsh(args, mittwaldAppSshContext);
        break;
      case "mittwald_app_uninstall":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppUninstallContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
          appContext: {
            installationId: (args as any).installationId
          }
        };
        result = await handleAppUninstall(args, mittwaldAppUninstallContext);
        break;
      case "mittwald_app_update":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppUpdateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
          appContext: {
            installationId: (args as any).installationId
          }
        };
        result = await handleAppUpdate(args, mittwaldAppUpdateContext);
        break;
      case "mittwald_app_upgrade":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppUpgradeContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
          appContext: {
            installationId: (args as any).installationId
          }
        };
        result = await mittwald_app_upgrade_handler(args, mittwaldAppUpgradeContext);
        break;
      case "mittwald_app_upload":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppUploadContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
          appContext: {
            installationId: (args as any).installationId
          }
        };
        result = await handleAppUpload(args, mittwaldAppUploadContext);
        break;
      case "mittwald_app_versions":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppVersionsContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleAppVersions(args, mittwaldAppVersionsContext);
        break;

      // Agent 1 app management CLI tools
      case "mittwald_app_list_cli":
        result = await handleAppListCli(args);
        break;
      case "mittwald_app_get_cli":
        result = await handleAppGetCli(args);
        break;
      case "mittwald_app_copy_cli":
        result = await handleAppCopyCli(args);
        break;
      case "mittwald_app_download_cli":
        result = await handleAppDownloadCli(args);
        break;
      case "mittwald_app_open_cli":
        result = await handleAppOpenCli(args);
        break;
      case "mittwald_app_ssh_cli":
        result = await handleAppSshCli(args);
        break;
      case "mittwald_app_uninstall_cli":
        result = await handleAppUninstallCli(args);
        break;
      case "mittwald_app_update_cli":
        result = await handleAppUpdateCli(args);
        break;
      case "mittwald_app_upgrade_cli":
        result = await handleAppUpgradeCli(args);
        break;
      case "mittwald_app_upload_cli":
        result = await handleAppUploadCli(args);
        break;
      case "mittwald_app_versions_cli":
        result = await handleAppVersionsCli(args);
        break;
      case "mittwald_app_list_upgrade_candidates_cli":
        result = await handleAppListUpgradeCandidatesCli(args);
        break;

      // Agent 14 tools
      case "mittwald_domain_virtualhost_list":
        const mittwaldDomainVirtualhostListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleDomainVirtualhostList(args, mittwaldDomainVirtualhostListContext);
        break;
      
      case "mittwald_extension":
        const mittwaldExtensionContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleExtension(args, mittwaldExtensionContext);
        break;
        
      case "mittwald_extension_install":
        const mittwaldExtensionInstallContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleExtensionInstall(args, mittwaldExtensionInstallContext);
        break;
      
      case "mittwald_extension_list":
        const mittwaldExtensionListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleExtensionList(args, mittwaldExtensionListContext);
        break;
      
      case "mittwald_extension_list_installed":
        const mittwaldExtensionListInstalledContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleExtensionListInstalled(args, mittwaldExtensionListInstalledContext);
        break;
      
      case "mittwald_extension_uninstall":
        const mittwaldExtensionUninstallContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleExtensionUninstall(args, mittwaldExtensionUninstallContext);
        break;
        
      // Agent 7 cronjob tools
      case "mittwald_cronjob_create":
        result = await handleCronjobCreate(args);
        break;
        
      case "mittwald_cronjob_delete":
        result = await handleCronjobDelete(args);
        break;
        
      case "mittwald_cronjob_execute":
        result = await handleCronjobExecute(args);
        break;
        
      // Agent 7 cronjob execution tools
      case "mittwald_cronjob_execution_abort":
        result = await handleCronjobExecutionAbort(args);
        break;
        
      case "mittwald_cronjob_execution_get":
        result = await handleCronjobExecutionGet(args);
        break;
        
      case "mittwald_cronjob_execution_list":
        result = await handleCronjobExecutionList(args);
        break;
        
      case "mittwald_cronjob_execution_logs":
        result = await handleCronjobExecutionLogs(args);
        break;
        
      case "mittwald_cronjob_execution":
        const mittwaldCronjobExecutionContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleCronjobExecution(args, mittwaldCronjobExecutionContext);
        break;
        
      // Agent 8 cronjob tools
      case "mittwald_cronjob_get":
        result = await handleMittwaldCronjobGet(args);
        break;
        
      case "mittwald_cronjob_list":
        result = await handleMittwaldCronjobList(args);
        break;
        
      case "mittwald_cronjob_update":
        result = await handleMittwaldCronjobUpdate(args);
        break;
        
      case "mittwald_cronjob":
        const cronjobMainContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleMittwaldCronjob(args, cronjobMainContext);
        break;
        
      // Agent 9 database tools
      case "mittwald_database_mysql_dump":
        result = await handleDatabaseMysqlDump(args);
        break;
        
      case "mittwald_database_mysql_get":
        const mittwaldDatabaseMysqlGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
        };
        result = await handleDatabaseMysqlGet(args, mittwaldDatabaseMysqlGetContext);
        break;
        
      case "mittwald_database_mysql_import":
        result = await handleDatabaseMysqlImport(args);
        break;
        
      case "mittwald_database_mysql_list":
        const mittwaldDatabaseMysqlListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
        };
        result = await handleDatabaseMysqlList(args, mittwaldDatabaseMysqlListContext);
        break;
        
      case "mittwald_database_mysql_phpmyadmin":
        result = await handleDatabaseMysqlPhpmyadmin(args);
        break;
        
      case "mittwald_database_mysql_port_forward":
        result = await handleDatabaseMysqlPortForward(args);
        break;
        
      case "mittwald_database_mysql_shell":
        result = await handleDatabaseMysqlShell(args);
        break;
        
      case "mittwald_database_mysql_versions":
        result = await handleDatabaseMysqlVersions(args);
        break;
        
      case "mittwald_database_list":
        const databaseListContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleMittwaldDatabaseList(args, databaseListContext);
        break;
        
      case "mittwald_database_mysql_charsets":
        result = await handleMittwaldDatabaseMysqlCharsets(
          args.output,
          args.extended,
          args.noHeader,
          args.noTruncate,
          args.noRelativeDates,
          args.csvSeparator
        );
        break;
        
      case "mittwald_database_mysql_create":
        result = await handleMittwaldDatabaseMysqlCreate(
          args.description,
          args.version,
          args.projectId,
          args.quiet,
          args.collation,
          args.characterSet,
          args.userPassword,
          args.userExternal,
          args.userAccessLevel
        );
        break;
        
      case "mittwald_database_mysql_delete":
        result = await handleMittwaldDatabaseMysqlDelete(
          args.databaseId,
          args.force,
          args.quiet
        );
        break;
        
      // Agent 6 MySQL user tools
      case "mittwald_database_mysql_user_create":
        result = await handleDatabaseMysqlUserCreate(args);
        break;
        
      case "mittwald_database_mysql_user_list":
        result = await handleDatabaseMysqlUserList(args);
        break;
        
      case "mittwald_database_mysql_user_get":
        result = await handleDatabaseMysqlUserGet(args);
        break;
        
      case "mittwald_database_mysql_user_delete":
        result = await handleDatabaseMysqlUserDelete(args);
        break;
        
      case "mittwald_database_mysql_user_update":
        result = await handleDatabaseMysqlUserUpdate(args);
        break;
        
      // Backup tools
      case "mittwald_backup_create":
        result = await handleBackupCreateCli(args);
        break;
        
      case "mittwald_backup_delete":
        result = await handleBackupDeleteCli(args);
        break;
        
      case "mittwald_backup_download":
        result = await handleBackupDownloadCli(args);
        break;
        
      case "mittwald_backup_get":
        result = await handleBackupGetCli(args);
        break;
        
      case "mittwald_backup_list":
        result = await handleBackupListCli(args);
        break;
        
      case "mittwald_backup":
        const mittwaldBackupContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleBackup(args, mittwaldBackupContext);
        break;
        
      case "mittwald_backup_schedule_create":
        result = await handleBackupScheduleCreateCli(args);
        break;
        
      case "mittwald_backup_schedule_delete":
        result = await handleBackupScheduleDeleteCli(args);
        break;
        
      case "mittwald_backup_schedule_list":
        result = await handleBackupScheduleListCli(args);
        break;
        
      case "mittwald_backup_schedule_update":
        result = await handleBackupScheduleUpdateCli(args);
        break;
        
      case "mittwald_backup_schedule":
        const mittwaldBackupScheduleContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleBackupSchedule(args, mittwaldBackupScheduleContext);
        break;
        
      // Conversation tools (using CLI wrappers)
      case "mittwald_conversation_create":
        result = await handleConversationCreateCli(args);
        break;
        
      case "mittwald_conversation_close":
        result = await handleConversationCloseCli(args);
        break;
        
      case "mittwald_conversation_list":
        result = await handleConversationListCli(args);
        break;
        
      case "mittwald_conversation_reply":
        result = await handleConversationReplyCli(args);
        break;
        
      case "mittwald_conversation_show":
        result = await handleConversationShowCli(args);
        break;
        
      case "mittwald_conversation_categories":
        result = await handleConversationCategoriesCli(args);
        break;
        
      case "mittwald_conversation":
        result = await handleConversation();
        break;
        
      // User tools
      case "mittwald_user_get":
        const mittwaldUserGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleUserGet(args, mittwaldUserGetContext);
        break;
        
      case "mittwald_user_api_token_create":
        const mittwaldUserApiTokenCreateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleUserApiTokenCreate(args, mittwaldUserApiTokenCreateContext);
        break;
        
      case "mittwald_user_api_token_get":
        const mittwaldUserApiTokenGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleUserApiTokenGet(args, mittwaldUserApiTokenGetContext);
        break;
        
      case "mittwald_user_api_token":
        const mittwaldUserApiTokenContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleUserApiToken(args, mittwaldUserApiTokenContext);
        break;
        
      case "mittwald_user":
        const mittwaldUserContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleUser(args, mittwaldUserContext);
        break;
        
      // SSH user tools (mixed patterns)
      case "mittwald_ssh_user_create":
        result = await handleSshUserCreate(args, { 
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId
        });
        break;
        
      case "mittwald_ssh_user_delete":
        result = await handleSshUserDelete(args, getMittwaldClient().api);
        break;
        
      case "mittwald_ssh_user_list":
        result = await handleSshUserList(args, getMittwaldClient().api);
        break;
        
      case "mittwald_ssh_user_update":
        const mittwaldSshUserUpdateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleSshUserUpdate(args, mittwaldSshUserUpdateContext);
        break;
        
      case "mittwald_ssh_user":
        const mittwaldSshUserContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleSshUser(args, mittwaldSshUserContext);
        break;
        
      // SFTP user tools (mixed patterns)
      case "mittwald_sftp_user_create":
        const mittwaldSftpUserCreateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleSftpUserCreate(args, mittwaldSftpUserCreateContext);
        break;
        
      case "mittwald_sftp_user_delete":
        result = await handleSftpUserDelete(args, getMittwaldClient().api);
        break;
        
      case "mittwald_sftp_user_list":
        result = await handleSftpUserList(args, getMittwaldClient().api);
        break;
        
      case "mittwald_sftp_user_update":
        result = await handleSftpUserUpdate(args, getMittwaldClient().api);
        break;
        
      case "mittwald_sftp_user":
        result = await handleSftpUser(args, getMittwaldClient().api);
        break;
        
      // SSH user CLI tools
      case "mittwald_ssh_user_create_cli":
        const mittwaldSshUserCreateCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleSshUserCreateCli(args, mittwaldSshUserCreateCliContext);
        break;
        
      case "mittwald_ssh_user_delete_cli":
        const mittwaldSshUserDeleteCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleSshUserDeleteCli(args, mittwaldSshUserDeleteCliContext);
        break;
        
      case "mittwald_ssh_user_list_cli":
        const mittwaldSshUserListCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleSshUserListCli(args, mittwaldSshUserListCliContext);
        break;
        
      case "mittwald_ssh_user_update_cli":
        const mittwaldSshUserUpdateCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleSshUserUpdateCli(args, mittwaldSshUserUpdateCliContext);
        break;
        
      // SFTP user CLI tools
      case "mittwald_sftp_user_create_cli":
        const mittwaldSftpUserCreateCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleSftpUserCreateCli(args, mittwaldSftpUserCreateCliContext);
        break;
        
      case "mittwald_sftp_user_delete_cli":
        const mittwaldSftpUserDeleteCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleSftpUserDeleteCli(args, mittwaldSftpUserDeleteCliContext);
        break;
        
      case "mittwald_sftp_user_list_cli":
        const mittwaldSftpUserListCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleSftpUserListCli(args, mittwaldSftpUserListCliContext);
        break;
        
      case "mittwald_sftp_user_update_cli":
        const mittwaldSftpUserUpdateCliContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleSftpUserUpdateCli(args, mittwaldSftpUserUpdateCliContext);
        break;
        
      // Agent 6 Redis database tools
      case "mittwald_database_redis_create":
        result = await handleMittwaldDatabaseRedisCreate(args);
        break;
        
      case "mittwald_database_redis_get":
        result = await handleMittwaldDatabaseRedisGet(args);
        break;
        
      case "mittwald_database_redis_list":
        result = await handleMittwaldDatabaseRedisList(args);
        break;
        
      case "mittwald_database_redis_shell":
        result = await handleMittwaldDatabaseRedisShell(args);
        break;
        
      case "mittwald_database_redis_versions":
        result = await handleMittwaldDatabaseRedisVersions(args);
        break;
        
      // Agent 11 tools
      case "mittwald_ddev_init":
        const mittwaldDdevInitContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDdevInit(args, mittwaldDdevInitContext);
        break;
        
      case "mittwald_ddev_render_config":
        const mittwaldDdevRenderContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDdevRenderConfig(args, mittwaldDdevRenderContext);
        break;
        
      case "mittwald_ddev":
        const mittwaldDdevMainContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDdevMain(args, mittwaldDdevMainContext);
        break;
        
      case "mittwald_domain_get":
        const mittwaldDomainGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDomainGet(args, mittwaldDomainGetContext);
        break;
        
      case "mittwald_domain_list":
        const mittwaldDomainListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDomainList(args, mittwaldDomainListContext);
        break;
        
      case "mittwald_domain_dnszone_get":
        const mittwaldDnszoneGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDomainDnszoneGet(args, mittwaldDnszoneGetContext);
        break;
        
      case "mittwald_domain_dnszone_list":
        const mittwaldDnszoneListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDomainDnszoneList(args, mittwaldDnszoneListContext);
        break;
        
      case "mittwald_domain_dnszone_update":
        const mittwaldDnszoneUpdateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDomainDnszoneUpdate(args, mittwaldDnszoneUpdateContext);
        break;
        
      case "mittwald_domain_dnszone":
        const mittwaldDnszoneMainContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDomainDnszoneMain(args, mittwaldDnszoneMainContext);
        break;
        
      // Domain CLI handlers
      case "mittwald_domain_list_cli":
        result = await handleDomainListCli(args);
        break;
        
      case "mittwald_domain_get_cli":
        result = await handleDomainGetCli(args);
        break;
        
      case "mittwald_domain_dnszone_list_cli":
        result = await handleDomainDnszoneListCli(args);
        break;
        
      case "mittwald_domain_dnszone_get_cli":
        result = await handleDomainDnszoneGetCli(args);
        break;
        
      case "mittwald_domain_dnszone_update_cli":
        result = await handleDomainDnszoneUpdateCli(args);
        break;
        
      case "mittwald_domain_virtualhost":
        const mittwaldDomainVirtualhostContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDomainVirtualhost(args, mittwaldDomainVirtualhostContext);
        break;
        
      case "mittwald_domain_virtualhost_create":
        const mittwaldDomainVirtualhostCreateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDomainVirtualhostCreate(args, mittwaldDomainVirtualhostCreateContext);
        break;
        
      case "mittwald_domain_virtualhost_delete":
        const mittwaldDomainVirtualhostDeleteContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDomainVirtualhostDelete(args, mittwaldDomainVirtualhostDeleteContext);
        break;
        
      case "mittwald_domain_virtualhost_get":
        const mittwaldDomainVirtualhostGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleDomainVirtualhostGet(args, mittwaldDomainVirtualhostGetContext);
        break;
        
      case "mittwald_domain_virtualhost_help":
        const mittwaldDomainVirtualhostHelpContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleVirtualHostHelp(args, mittwaldDomainVirtualhostHelpContext);
        break;

      // Agent 11 mail address CLI tools
      case "mittwald_mail_address_list_cli":
        result = await handleMittwaldMailAddressListCli(args as ToolArgs['mittwald_mail_address_list_cli']);
        break;

      case "mittwald_mail_address_get_cli":
        result = await handleMittwaldMailAddressGetCli(args as ToolArgs['mittwald_mail_address_get_cli']);
        break;

      case "mittwald_mail_address_create_cli":
        result = await handleMittwaldMailAddressCreateCli(args as ToolArgs['mittwald_mail_address_create_cli']);
        break;

      case "mittwald_mail_address_delete_cli":
        result = await handleMittwaldMailAddressDeleteCli(args as ToolArgs['mittwald_mail_address_delete_cli']);
        break;

      case "mittwald_mail_address_update_cli":
        result = await handleMittwaldMailAddressUpdateCli(args as ToolArgs['mittwald_mail_address_update_cli']);
        break;

      // Agent 11 mail deliverybox CLI tools
      case "mittwald_mail_deliverybox_list_cli":
        result = await handleMittwaldMailDeliveryboxListCli(args as ToolArgs['mittwald_mail_deliverybox_list_cli']);
        break;

      case "mittwald_mail_deliverybox_get_cli":
        result = await handleMittwaldMailDeliveryboxGetCli(args as ToolArgs['mittwald_mail_deliverybox_get_cli']);
        break;

      case "mittwald_mail_deliverybox_create_cli":
        result = await handleMittwaldMailDeliveryboxCreateCli(args as ToolArgs['mittwald_mail_deliverybox_create_cli']);
        break;

      case "mittwald_mail_deliverybox_delete_cli":
        result = await handleMittwaldMailDeliveryboxDeleteCli(args as ToolArgs['mittwald_mail_deliverybox_delete_cli']);
        break;

      case "mittwald_mail_deliverybox_update_cli":
        result = await handleMittwaldMailDeliveryboxUpdateCli(args as ToolArgs['mittwald_mail_deliverybox_update_cli']);
        break;
        
      // Agent 15 mail tools
      case "mittwald_mail_deliverybox":
        const mittwaldMailDeliveryboxContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleMailDeliverybox(args, mittwaldMailDeliveryboxContext);
        break;
        
      case "mittwald_mail":
        const mittwaldMailContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleMail(args, mittwaldMailContext);
        break;
        
      // Mail address tools
      case "mittwald_mail_address_create":
        const mittwaldMailAddressCreateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleMittwaldMailAddressCreate(getMittwaldClient().api, args);
        break;
        
      case "mittwald_mail_address_delete":
        result = await handleMittwaldMailAddressDelete(getMittwaldClient().api, args);
        break;
        
      case "mittwald_mail_address_get":
        result = await handleMittwaldMailAddressGet(getMittwaldClient().api, args);
        break;
        
      case "mittwald_mail_address_list":
        result = await handleMittwaldMailAddressList(getMittwaldClient().api, args);
        break;
        
      case "mittwald_mail_address":
        const mittwaldMailAddressContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleMailAddress(args, mittwaldMailAddressContext);
        break;
        
      case "mittwald_mail_address_update":
        const mittwaldMailAddressUpdateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleMailAddressUpdate(args, mittwaldMailAddressUpdateContext);
        break;
        
      // Mail deliverybox tools  
      case "mittwald_mail_deliverybox_create":
        const mittwaldMailDeliveryboxCreateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleMailDeliveryboxCreate(args, mittwaldMailDeliveryboxCreateContext);
        break;
        
      case "mittwald_mail_deliverybox_delete":
        const mittwaldMailDeliveryboxDeleteContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleMailDeliveryboxDelete(args, mittwaldMailDeliveryboxDeleteContext);
        break;
        
      case "mittwald_mail_deliverybox_get":
        const mittwaldMailDeliveryboxGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleMailDeliveryboxGet(args, mittwaldMailDeliveryboxGetContext);
        break;
        
      case "mittwald_mail_deliverybox_list":
        const mittwaldMailDeliveryboxListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleMailDeliveryboxList(args, mittwaldMailDeliveryboxListContext);
        break;
        
      case "mittwald_mail_deliverybox_update":
        const mittwaldMailDeliveryboxUpdateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleMailDeliveryboxUpdate(args, mittwaldMailDeliveryboxUpdateContext);
        break;
        
      // Agent 16 org tools
      case "mittwald_org_membership_list":
        const mittwaldOrgMembershipListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
          orgContext: {
            orgId: (args as any).orgId
          }
        };
        result = await handleOrgMembershipList(args, mittwaldOrgMembershipListContext);
        break;
        
      case "mittwald_org_membership_revoke":
        const mittwaldOrgMembershipRevokeContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleOrgMembershipRevoke(args, mittwaldOrgMembershipRevokeContext);
        break;
        
      case "mittwald_org":
        const mittwaldOrgContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleOrg(args, mittwaldOrgContext);
        break;
        
      case "mittwald_org_delete":
        const mittwaldOrgDeleteContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleOrgDelete(args, mittwaldOrgDeleteContext);
        break;
        
      case "mittwald_org_get":
        const mittwaldOrgGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleOrgGet(args, mittwaldOrgGetContext);
        break;
        
      case "mittwald_org_invite":
        const mittwaldOrgInviteContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleOrgInvite(args, mittwaldOrgInviteContext);
        break;
        
      case "mittwald_org_list":
        const mittwaldOrgListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleOrgList(args, mittwaldOrgListContext);
        break;
        
      case "mittwald_org_membership_list_own":
        const mittwaldOrgMembershipListOwnContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleOrgMembershipListOwn(args, mittwaldOrgMembershipListOwnContext);
        break;
        
      // Context tools
      case "mittwald_context":
        const mittwaldContextContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContext(args, mittwaldContextContext);
        break;
        
      case "mittwald_context_get":
        const mittwaldContextGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContextGet(args, mittwaldContextGetContext);
        break;
        
      case "mittwald_context_reset":
        const mittwaldContextResetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContextReset(args, mittwaldContextResetContext);
        break;
        
      case "mittwald_context_set":
        const mittwaldContextSetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContextSet(args, mittwaldContextSetContext);
        break;

      case "mittwald_context_detect":
        const mittwaldContextDetectContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContextDetect(args as ToolArgs['mittwald_context_detect'], mittwaldContextDetectContext);
        break;

      // Container tools
      case "mittwald_container_list_stacks":
        const mittwaldContainerListStacksContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerListStacks(args as ToolArgs['mittwald_container_list_stacks'], mittwaldContainerListStacksContext);
        break;

      case "mittwald_container_list_services":
        const mittwaldContainerListServicesContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerListServices(args as ToolArgs['mittwald_container_list_services'], mittwaldContainerListServicesContext);
        break;

      case "mittwald_container_list_volumes":
        const mittwaldContainerListVolumesContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerListVolumes(args as ToolArgs['mittwald_container_list_volumes'], mittwaldContainerListVolumesContext);
        break;

      case "mittwald_container_list_registries":
        const mittwaldContainerListRegistriesContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerListRegistries(args as ToolArgs['mittwald_container_list_registries'], mittwaldContainerListRegistriesContext);
        break;

      case "mittwald_container_declare_stack":
        const mittwaldContainerDeclareStackContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerDeclareStack(args as ToolArgs['mittwald_container_declare_stack'], mittwaldContainerDeclareStackContext);
        break;

      case "mittwald_container_get_service_logs":
        const mittwaldContainerGetServiceLogsContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerGetServiceLogs(args as ToolArgs['mittwald_container_get_service_logs'], mittwaldContainerGetServiceLogsContext);
        break;

      case "mittwald_container_create_registry":
        const mittwaldContainerCreateRegistryContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerCreateRegistry(args as ToolArgs['mittwald_container_create_registry'], mittwaldContainerCreateRegistryContext);
        break;
        
      case "mittwald_container_get_service":
        const mittwaldContainerGetServiceContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerGetService(args as ToolArgs['mittwald_container_get_service'], mittwaldContainerGetServiceContext);
        break;
        
      case "mittwald_container_get_stack":
        const mittwaldContainerGetStackContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerGetStack(args as ToolArgs['mittwald_container_get_stack'], mittwaldContainerGetStackContext);
        break;

      case "mittwald_container_restart_service":
        const mittwaldContainerRestartServiceContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerRestartService(args as ToolArgs['mittwald_container_restart_service'], mittwaldContainerRestartServiceContext);
        break;

      case "mittwald_container_recreate_service":
        const mittwaldContainerRecreateServiceContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerRecreateService(args as ToolArgs['mittwald_container_recreate_service'], mittwaldContainerRecreateServiceContext);
        break;

      case "mittwald_container_start_service":
        const mittwaldContainerStartServiceContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerStartService(args as ToolArgs['mittwald_container_start_service'], mittwaldContainerStartServiceContext);
        break;

      case "mittwald_container_stop_service":
        const mittwaldContainerStopServiceContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerStopService(args as ToolArgs['mittwald_container_stop_service'], mittwaldContainerStopServiceContext);
        break;

      case "mittwald_container_pull_image":
        const mittwaldContainerPullImageContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken
        };
        result = await handleContainerPullImage(args as ToolArgs['mittwald_container_pull_image'], mittwaldContainerPullImageContext);
        break;

      // Agent 12 Container CLI wrapper cases
      case "mittwald_container_list_cli":
        result = await handleContainerListCli(args as ToolArgs['mittwald_container_list_cli']);
        break;

      case "mittwald_container_logs_cli":
        result = await handleContainerLogsCli(args as ToolArgs['mittwald_container_logs_cli']);
        break;

      case "mittwald_container_delete_cli":
        result = await handleContainerDeleteCli(args as ToolArgs['mittwald_container_delete_cli']);
        break;

      case "mittwald_container_recreate_cli":
        result = await handleContainerRecreateCli(args as ToolArgs['mittwald_container_recreate_cli']);
        break;

      case "mittwald_container_restart_cli":
        result = await handleContainerRestartCli(args as ToolArgs['mittwald_container_restart_cli']);
        break;

      case "mittwald_container_start_cli":
        result = await handleContainerStartCli(args as ToolArgs['mittwald_container_start_cli']);
        break;

      case "mittwald_container_stop_cli":
        result = await handleContainerStopCli(args as ToolArgs['mittwald_container_stop_cli']);
        break;

      case "mittwald_container_run_cli":
        result = await handleContainerRunCli(args as ToolArgs['mittwald_container_run_cli']);
        break;
        
      case "mittwald_contributor":
        result = await handleContributor();
        break;
        
      default:
        logger.error("Unsupported tool in switch statement", { toolName: request.params.name });
        throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error("Tool call failed", {
      toolName: request.params?.name,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-throw the error to be handled by MCP framework
    throw error;
  }
}
