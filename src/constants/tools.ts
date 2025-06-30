/**
 * @file Tool constants and utilities for the MCP server
 * @module constants/tools
 * 
 * @remarks
 * This module aggregates all available MCP tools and provides utilities
 * for tool management. Tools are the primary way clients interact with
 * the MCP server.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools Specification}
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Agent 2 app dependency tools
import { mittwald_app_dependency_update } from './tool/mittwald-cli/app/dependency/update.js';
import { mittwald_app_dependency_versions } from './tool/mittwald-cli/app/dependency/versions.js';
import { mittwald_app_dependency_list } from './tool/mittwald-cli/app/dependency/list.js';
import { mittwald_app_dependency_get } from './tool/mittwald-cli/app/dependency/get.js';

// Agent 2 app management tools
import { mittwald_app_download } from './tool/mittwald-cli/app/download.js';
import { mittwald_app_get } from './tool/mittwald-cli/app/get.js';
import { mittwald_app_install } from './tool/mittwald-cli/app/install.js';
import { mittwald_app_install_contao } from './tool/mittwald-cli/app/install/contao.js';
import { mittwald_app_list_upgrade_candidates } from './tool/mittwald-cli/app/list/upgrade-candidates.js';

// Agent 3 app install tools
import { mittwald_app_install_joomla } from './tool/mittwald-cli/app/install/joomla.js';
import { mittwald_app_install_matomo } from './tool/mittwald-cli/app/install/matomo.js';
import { mittwald_app_install_nextcloud } from './tool/mittwald-cli/app/install/nextcloud.js';
import { mittwald_app_install_shopware5 } from './tool/mittwald-cli/app/install/shopware5.js';
import { mittwald_app_install_shopware6 } from './tool/mittwald-cli/app/install/shopware6.js';
import { mittwald_app_install_typo3 } from './tool/mittwald-cli/app/install/typo3.js';
import { mittwald_app_install_wordpress } from './tool/mittwald-cli/app/install/wordpress.js';

// Agent 3 app management tools
import { mittwald_app } from './tool/mittwald-cli/app/app.js';
import { mittwald_app_copy } from './tool/mittwald-cli/app/copy.js';
import { mittwald_app_create } from './tool/mittwald-cli/app/create.js';
import { mittwald_app_list } from './tool/mittwald-cli/app/list.js';
import { mittwald_app_open } from './tool/mittwald-cli/app/open.js';
import { mittwald_app_ssh } from './tool/mittwald-cli/app/ssh.js';
import { mittwald_app_uninstall } from './tool/mittwald-cli/app/uninstall.js';
import { mittwald_app_update } from './tool/mittwald-cli/app/update.js';
import { mittwald_app_upgrade } from './tool/mittwald-cli/app/upgrade.js';
import { mittwald_app_upload } from './tool/mittwald-cli/app/upload.js';
import { mittwald_app_versions } from './tool/mittwald-cli/app/versions.js';

// Agent-18 project tools
import { mittwald_project_create } from './tool/mittwald-cli/project/create.js';
import { mittwald_project_delete } from './tool/mittwald-cli/project/delete.js';
import { mittwald_project_get } from './tool/mittwald-cli/project/get.js';
import { mittwald_project_list } from './tool/mittwald-cli/project/list.js';
import { mittwald_project_filesystem_usage } from './tool/mittwald-cli/project/filesystem-usage.js';
import { mittwald_project_filesystem } from './tool/mittwald-cli/project/filesystem.js';
import { mittwald_project_invite_get } from './tool/mittwald-cli/project/invite-get.js';
import { mittwald_project_invite_list_own } from './tool/mittwald-cli/project/invite-list-own.js';
import { mittwald_project_invite_list } from './tool/mittwald-cli/project/invite-list.js';
import { mittwald_project } from './tool/mittwald-cli/project/project.js';
import { mittwald_project_invite } from './tool/mittwald-cli/project/invite.js';
import { mittwald_project_membership } from './tool/mittwald-cli/project/membership.js';
import { mittwald_project_membership_get } from './tool/mittwald-cli/project/membership-get.js';
import { mittwald_project_membership_get_own } from './tool/mittwald-cli/project/membership-get-own.js';
import { mittwald_project_membership_list } from './tool/mittwald-cli/project/membership-list.js';
import { mittwald_project_membership_list_own } from './tool/mittwald-cli/project/membership-list-own.js';
import { mittwald_project_update } from './tool/mittwald-cli/project/update.js';

// Server tools
import { 
  mittwald_server_get,
  mittwald_server_list,
  mittwald_server
} from './tool/mittwald-cli/server/index.js';

// Agent 14 tools
import { mittwald_domain_virtualhost_list } from './tool/mittwald-cli/domain/virtualhost-list.js';
import { 
  mittwald_extension,
  mittwald_extension_install,
  mittwald_extension_list_installed,
  mittwald_extension_list,
  mittwald_extension_uninstall 
} from './tool/mittwald-cli/extension/index.js';

// Agent 7 cronjob tools
import { mittwald_cronjob_create } from './tool/mittwald-cli/cronjob/create.js';
import { mittwald_cronjob_delete } from './tool/mittwald-cli/cronjob/delete.js';
import { mittwald_cronjob_execute } from './tool/mittwald-cli/cronjob/execute.js';
import { 
  mittwald_cronjob_execution_abort,
  mittwald_cronjob_execution_get,
  mittwald_cronjob_execution_list, 
  mittwald_cronjob_execution_logs,
  mittwald_cronjob_execution
} from './tool/mittwald-cli/cronjob/index.js';

// Agent 8 cronjob tools
import { mittwald_cronjob_get, mittwald_cronjob_list, mittwald_cronjob_update, mittwald_cronjob_cronjob } from './tool/mittwald-cli/cronjob/index.js';

// Agent 9 database tools
import { 
  mittwald_database_mysql_dump,
  mittwald_database_mysql_get,
  mittwald_database_mysql_import,
  mittwald_database_mysql_list,
  mittwald_database_mysql_phpmyadmin,
  mittwald_database_mysql_port_forward,
  mittwald_database_mysql_shell,
  mittwald_database_mysql_versions,
  mittwald_database_list,
  mittwald_database_mysql_charsets,
  mittwald_database_mysql_create,
  mittwald_database_mysql_delete,
  mittwald_database_redis_create,
  mittwald_database_redis_get,
  mittwald_database_redis_list,
  mittwald_database_redis_shell,
  mittwald_database_redis_versions
} from './tool/mittwald-cli/database/index.js';

// Agent 11 ddev tools
import { ddev_init } from './tool/mittwald-cli/ddev/init.js';
import { ddev_render_config } from './tool/mittwald-cli/ddev/render-config.js';
import { ddev_main } from './tool/mittwald-cli/ddev/index-command.js';
import { domain_get } from './tool/mittwald-cli/domain/get.js';
import { domain_dnszone_get } from './tool/mittwald-cli/domain/dnszone/get.js';
import { domain_dnszone_list } from './tool/mittwald-cli/domain/dnszone/list.js';
import { domain_dnszone_update } from './tool/mittwald-cli/domain/dnszone/update.js';
import { domain_dnszone_main } from './tool/mittwald-cli/domain/dnszone/main.js';

// Agent 15 mail tools
import { mittwald_mail_deliverybox } from './tool/mittwald-cli/mail/deliverybox.js';
import { mittwald_mail } from './tool/mittwald-cli/mail/mail.js';

// Agent 16 org tools
import { 
  mittwald_org_membership_list, 
  mittwald_org_membership_revoke, 
  mittwald_org_membership, 
  mittwald_org,
  mittwald_org_delete,
  mittwald_org_get,
  mittwald_org_invite,
  mittwald_org_list,
  mittwald_org_membership_list_own
} from './tool/mittwald-cli/org/index.js';

// App create tools
import { mittwald_app_create_node } from './tool/mittwald-cli/app/create/node.js';
import { mittwald_app_create_php } from './tool/mittwald-cli/app/create/php.js';
import { mittwald_app_create_php_worker } from './tool/mittwald-cli/app/create/php-worker.js';
import { mittwald_app_create_python } from './tool/mittwald-cli/app/create/python.js';
import { mittwald_app_create_static } from './tool/mittwald-cli/app/create/static.js';

// Backup tools
import {
  mittwald_backup,
  mittwald_backup_create,
  mittwald_backup_delete,
  mittwald_backup_download,
  mittwald_backup_get,
  mittwald_backup_list,
  mittwald_backup_schedule,
  backupScheduleListTool,
  backupScheduleUpdateTool
} from './tool/mittwald-cli/backup/index.js';
import { mittwald_backup_schedule_create } from './tool/mittwald-cli/backup/schedule/create.js';
import { mittwald_backup_schedule_delete } from './tool/mittwald-cli/backup/schedule/delete.js';

// Conversation tools
import {
  conversationTool,
  conversationCategoriesTool,
  conversationCloseTool,
  conversationCreateTool,
  conversationListTool,
  conversationReplyTool,
  conversationShowTool
} from './tool/mittwald-cli/conversation/index.js';

// Domain tools (additional missing ones)
import { mittwald_domain_virtualhost_create } from './tool/mittwald-cli/domain/virtualhost-create.js';
import { mittwald_domain_virtualhost_delete } from './tool/mittwald-cli/domain/virtualhost-delete.js';
import { mittwald_domain_virtualhost_get } from './tool/mittwald-cli/domain/virtualhost-get.js';
import { mittwald_domain_virtualhost } from './tool/mittwald-cli/domain/virtualhost.js';
import { mittwald_domain_list } from './tool/mittwald-cli/domain/list.js';
import { mittwald_domain } from './tool/mittwald-cli/domain/domain.js';

// Mail address tools (commented out due to readonly TypeScript issues)
// import {
//   mittwald_mail_address_create,
//   mittwald_mail_address_delete,
//   mittwald_mail_address_get,
//   mittwald_mail_address_list
// } from './tool/mittwald-cli/mail/address/index.js';

// Additional mail tools
import { mittwaldMailDeliveryboxCreate } from './tool/mittwald-cli/mail/deliverybox-create.js';
import { mittwaldMailDeliveryboxDelete } from './tool/mittwald-cli/mail/deliverybox-delete.js';
import { mittwaldMailDeliveryboxGet } from './tool/mittwald-cli/mail/deliverybox-get.js';
import { mittwaldMailDeliveryboxList } from './tool/mittwald-cli/mail/deliverybox-list.js';
import { mittwaldMailDeliveryboxUpdate } from './tool/mittwald-cli/mail/deliverybox-update.js';
import { mittwaldMailAddressUpdate } from './tool/mittwald-cli/mail/address-update.js';

// SFTP tools
import {
  mittwaldSftpUser,
  mittwaldSftpUserDelete,
  mittwaldSftpUserList,
  mittwaldSftpUserUpdate
} from './tool/mittwald-cli/sftp/index.js';
import { mittwald_sftp_user_create } from './tool/mittwald-cli/sftp/user/index.js';

// SSH tools
import {
  mittwaldSshUserTool,
  mittwaldSshUserCreate,
  mittwaldSshUserDelete,
  mittwaldSshUserList,
  mittwaldSshUserUpdateTool
} from './tool/mittwald-cli/ssh/index.js';

// User/API token tools
import {
  mittwaldUserTool,
  mittwaldUserGetTool,
  mittwaldUserApiTokenTool,
  mittwaldUserApiTokenCreateTool,
  mittwaldUserApiTokenGetTool,
  mittwaldUserApiTokenListTool,
  mittwaldUserApiTokenRevokeTool,
  mittwaldUserSessionGetTool,
  mittwaldUserSessionListTool
} from './tool/mittwald-cli/user/index.js';

// Missing project SSH tool
import { mittwald_project_ssh } from './tool/mittwald-cli/project/ssh.js';

// Contributor tool
import { contributorTool as mittwald_contributor } from './tool/mittwald-cli/contributor/contributor.js';

// Context tools
import {
  mittwald_context,
  mittwald_context_get,
  mittwald_context_reset,
  mittwald_context_set
} from './tool/mittwald-cli/context/index.js';

/**
 * Standard error messages for tool operations.
 * 
 * @remarks
 * These messages are used when tool calls fail or when
 * an unknown tool is requested.
 */
export const TOOL_ERROR_MESSAGES = {
  /** Prefix for unknown tool errors */
  UNKNOWN_TOOL: 'Unknown tool:',
  /** Prefix for tool execution failures */
  TOOL_CALL_FAILED: 'Tool call failed:',
} as const;

/**
 * Standard response messages for tool operations.
 * 
 * @remarks
 * These messages are used for special tool responses,
 * such as when a tool triggers an asynchronous operation.
 */
export const TOOL_RESPONSE_MESSAGES = {
  /** Message returned when a tool triggers async processing (e.g., sampling) */
  ASYNC_PROCESSING: 'Request is being processed asynchronously',
} as const;

/**
 * Array of all available MCP tools.
 * 
 * @remarks
 * Currently includes:
 * - Example/Tutorial tools:
 *   - `elicitation_example`: Demonstrates requesting user input
 * - Utility tools:
 *   - `mcp_logging`: Request server to log messages for debugging
 * 
 * Mittwald CLI-based tools will be added here after migration.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/core/tools | MCP Tools}
 */
export const TOOLS: Tool[] = [
  // Agent 2 app dependency tools
  mittwald_app_dependency_update,
  mittwald_app_dependency_versions,
  mittwald_app_dependency_list,
  mittwald_app_dependency_get,
  
  // Agent 2 app management tools
  mittwald_app_download,
  mittwald_app_get,
  mittwald_app_install,
  mittwald_app_install_contao,
  mittwald_app_list_upgrade_candidates,
  
  // Agent 3 app install tools
  mittwald_app_install_joomla,
  mittwald_app_install_matomo,
  mittwald_app_install_nextcloud,
  mittwald_app_install_shopware5,
  mittwald_app_install_shopware6,
  mittwald_app_install_typo3,
  mittwald_app_install_wordpress,
  
  // Agent 3 app management tools
  mittwald_app,
  mittwald_app_copy,
  mittwald_app_create,
  mittwald_app_list,
  mittwald_app_open,
  mittwald_app_ssh,
  mittwald_app_uninstall,
  mittwald_app_update,
  mittwald_app_upgrade,
  mittwald_app_upload,
  mittwald_app_versions,
  
  // Agent-18 project tools
  mittwald_project_create,
  mittwald_project_delete,
  mittwald_project_get,
  mittwald_project_list,
  mittwald_project_filesystem_usage,
  mittwald_project_filesystem,
  mittwald_project_invite_get,
  mittwald_project_invite_list_own,
  mittwald_project_invite_list,
  mittwald_project,
  mittwald_project_invite,
  mittwald_project_membership,
  mittwald_project_membership_get,
  mittwald_project_membership_get_own,
  mittwald_project_membership_list,
  mittwald_project_membership_list_own,
  mittwald_project_update,
  
  // Server tools
  mittwald_server_get,
  mittwald_server_list,
  mittwald_server,
  
  // Agent 14 tools
  mittwald_domain_virtualhost_list,
  mittwald_extension,
  mittwald_extension_install,
  mittwald_extension_list_installed,
  mittwald_extension_list,
  mittwald_extension_uninstall,
  
  // Agent 7 cronjob tools
  mittwald_cronjob_create,
  mittwald_cronjob_delete,
  mittwald_cronjob_execute,
  mittwald_cronjob_execution_abort,
  mittwald_cronjob_execution_get,
  mittwald_cronjob_execution_list,
  mittwald_cronjob_execution_logs,
  mittwald_cronjob_execution,
  
  // Agent 8 cronjob tools
  mittwald_cronjob_get,
  mittwald_cronjob_list,
  mittwald_cronjob_update,
  mittwald_cronjob_cronjob,
  
  // Agent 9 database tools
  mittwald_database_mysql_dump,
  mittwald_database_mysql_get,
  mittwald_database_mysql_import,
  mittwald_database_mysql_list,
  mittwald_database_mysql_phpmyadmin,
  mittwald_database_mysql_port_forward,
  mittwald_database_mysql_shell,
  mittwald_database_mysql_versions,
  mittwald_database_list,
  mittwald_database_mysql_charsets,
  mittwald_database_mysql_create,
  mittwald_database_mysql_delete,
  mittwald_database_redis_create,
  mittwald_database_redis_get,
  mittwald_database_redis_list,
  mittwald_database_redis_shell,
  mittwald_database_redis_versions,
  
  // Agent 11 ddev tools
  ddev_init,
  ddev_render_config,
  ddev_main,
  domain_get,
  domain_dnszone_get,
  domain_dnszone_list,
  domain_dnszone_update,
  domain_dnszone_main,
  
  // Agent 15 mail tools
  mittwald_mail_deliverybox,
  mittwald_mail,
  
  // Agent 16 org tools
  mittwald_org_membership_list,
  mittwald_org_membership_revoke,
  mittwald_org_membership,
  mittwald_org,
  mittwald_org_delete,
  mittwald_org_get,
  mittwald_org_invite,
  mittwald_org_list,
  mittwald_org_membership_list_own,
  
  // Contributor tool
  mittwald_contributor,
  
  // Context tools
  mittwald_context,
  mittwald_context_get,
  mittwald_context_reset,
  mittwald_context_set,
  
  // App create tools
  mittwald_app_create_node,
  mittwald_app_create_php,
  mittwald_app_create_php_worker,
  mittwald_app_create_python,
  mittwald_app_create_static,
  
  // Backup tools
  mittwald_backup,
  mittwald_backup_create,
  mittwald_backup_delete,
  mittwald_backup_download,
  mittwald_backup_get,
  mittwald_backup_list,
  mittwald_backup_schedule,
  mittwald_backup_schedule_create,
  mittwald_backup_schedule_delete,
  backupScheduleListTool,
  backupScheduleUpdateTool,
  
  // Conversation tools
  conversationTool,
  conversationCategoriesTool,
  conversationCloseTool,
  conversationCreateTool,
  conversationListTool,
  conversationReplyTool,
  conversationShowTool,
  
  // Additional domain tools
  mittwald_domain_virtualhost_create,
  mittwald_domain_virtualhost_delete,
  mittwald_domain_virtualhost_get,
  mittwald_domain_virtualhost,
  mittwald_domain_list,
  mittwald_domain,
  
  // Mail address tools (commented out due to readonly TypeScript issues)
  // mittwald_mail_address_create,
  // mittwald_mail_address_delete,
  // mittwald_mail_address_get,
  // mittwald_mail_address_list,
  
  // Additional mail tools
  mittwaldMailDeliveryboxCreate,
  mittwaldMailDeliveryboxDelete,
  mittwaldMailDeliveryboxGet,
  mittwaldMailDeliveryboxList,
  mittwaldMailDeliveryboxUpdate,
  mittwaldMailAddressUpdate,
  
  // SFTP tools
  mittwaldSftpUser,
  mittwald_sftp_user_create,
  mittwaldSftpUserDelete,
  mittwaldSftpUserList,
  mittwaldSftpUserUpdate,
  
  // SSH tools
  mittwaldSshUserTool,
  mittwaldSshUserCreate,
  mittwaldSshUserDelete,
  mittwaldSshUserList,
  mittwaldSshUserUpdateTool,
  
  // User/API token tools
  mittwaldUserTool,
  mittwaldUserGetTool,
  mittwaldUserApiTokenTool,
  mittwaldUserApiTokenCreateTool,
  mittwaldUserApiTokenGetTool,
  mittwaldUserApiTokenListTool,
  mittwaldUserApiTokenRevokeTool,
  mittwaldUserSessionGetTool,
  mittwaldUserSessionListTool,
  
  // Missing project SSH tool
  mittwald_project_ssh,
];

/**
 * Populates tools with initial data from configuration.
 * 
 * @remarks
 * This function can be used to inject user-specific data into tools
 * at initialization time. Currently, it creates a clone of each tool
 * to avoid modifying the original tool definitions.
 * 
 * @param tools - Array of tool definitions to populate
 * @param configData - Configuration data
 * @returns Array of populated tool definitions
 * 
 * @example
 * ```typescript
 * const populatedTools = populateToolsInitialData(TOOLS, config);
 * ```
 */
export function populateToolsInitialData(tools: Tool[], _configData: any): Tool[] {
  return tools.map((tool) => {
    const clonedTool = { ...tool };
    return clonedTool;
  });
}