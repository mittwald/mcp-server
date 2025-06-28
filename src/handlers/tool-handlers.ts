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
import {
  handleElicitationExample,
  handleLogging,
  handleProjectCreate,
  handleProjectDelete,
  handleProjectGet,
  handleProjectFilesystemUsage,
  handleProjectInviteGet,
  handleDomainVirtualhostList,
  handleExtensionInstall,
  handleExtensionListInstalled,
  handleExtensionList,
  handleExtensionUninstall,
  handleLoginReset,
} from './tools/index.js';

// Agent 2 app dependency handlers
import { handleMittwaldAppDependencyUpdate } from './tools/mittwald-cli/app/dependency/update.js';
import { handleMittwaldAppDependencyVersions } from './tools/mittwald-cli/app/dependency/versions.js';
import { handleMittwaldAppDependencyList } from './tools/mittwald-cli/app/dependency/list.js';

// Agent 3 app install handlers
import { handleAppInstallJoomla } from './tools/mittwald-cli/app/install/joomla.js';
import { handleAppInstallMatomo } from './tools/mittwald-cli/app/install/matomo.js';
import { handleAppInstallNextcloud } from './tools/mittwald-cli/app/install/nextcloud.js';
import { handleAppInstallShopware5 } from './tools/mittwald-cli/app/install/shopware5.js';
import { handleAppInstallShopware6 } from './tools/mittwald-cli/app/install/shopware6.js';
import { handleAppInstallTypo3 } from './tools/mittwald-cli/app/install/typo3.js';
import { handleAppInstallWordpress } from './tools/mittwald-cli/app/install/wordpress.js';

// Agent 3 app management handlers
import { handleAppList } from './tools/mittwald-cli/app/list.js';
import { handleAppOpen } from './tools/mittwald-cli/app/open.js';
import { handleAppSsh } from './tools/mittwald-cli/app/ssh.js';

// Agent 7 cronjob handlers
import { handleCronjobCreate } from './tools/mittwald-cli/cronjob/create.js';
import { handleCronjobDelete } from './tools/mittwald-cli/cronjob/delete.js';
import { handleCronjobExecute } from './tools/mittwald-cli/cronjob/execute.js';
import { handleCronjobExecutionAbort } from './tools/mittwald-cli/cronjob/execution-abort.js';
import { handleCronjobExecutionGet } from './tools/mittwald-cli/cronjob/execution-get.js';
import { handleCronjobExecutionList } from './tools/mittwald-cli/cronjob/execution-list.js';
import { handleCronjobExecutionLogs } from './tools/mittwald-cli/cronjob/execution-logs.js';
import { handleCronjobExecution } from './tools/mittwald-cli/cronjob/execution.js';

// Agent 8 cronjob handlers
import { handleMittwaldCronjobGet } from './tools/mittwald-cli/cronjob/get.js';
import { handleMittwaldCronjobList } from './tools/mittwald-cli/cronjob/list.js';
import { handleMittwaldCronjobUpdate } from './tools/mittwald-cli/cronjob/update.js';
import { handleMittwaldCronjob } from './tools/mittwald-cli/cronjob/cronjob.js';

// Agent 9 database handlers
import { handleDatabaseMysqlDump, MittwaldDatabaseMysqlDumpSchema } from './tools/mittwald-cli/database/mysql/dump.js';
import { handleDatabaseMysqlGet, MittwaldDatabaseMysqlGetSchema } from './tools/mittwald-cli/database/mysql/get.js';
import { handleMittwaldDatabaseList } from './tools/mittwald-cli/database/list.js';

// Agent 11 ddev handlers
import { handleDdevInit, ddevInitSchema } from './tools/mittwald-cli/ddev/init.js';

// Agent 15 mail handlers
import { handleMailDeliverybox } from './tools/mittwald-cli/mail/deliverybox.js';

// Agent 16 org handlers  
import { handleOrgMembershipList } from './tools/mittwald-cli/org/membership/list.js';
import { handleOrgMembershipRevoke } from './tools/mittwald-cli/org/membership/revoke.js';
import { handleOrgMembership } from './tools/mittwald-cli/org/membership.js';


import { getMittwaldClient } from '../services/mittwald/index.js';
import type { MittwaldToolHandlerContext } from '../types/mittwald/conversation.js';

/**
 * Zod schemas for tool validation
 */
const ToolSchemas = {
  
  elicitation_example: z.object({
    type: z.enum(["input", "confirm", "choice"]).describe("Type of elicitation"),
    prompt: z.string().describe("Prompt to show to user"),
    options: z.array(z.string()).optional().describe("Options for choice type")
  }),
  
  mcp_logging: z.object({
    level: z.enum(["debug", "info", "warning", "error"]).describe("Log level"),
    message: z.string().describe("Message to log"),
    data: z.unknown().optional().describe("Optional additional data")
  }),
  
  
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

  mittwald_project_filesystem_usage: z.object({
    projectId: z.string().describe("ID or short ID of a project"),
    human: z.boolean().optional().describe("Display human readable sizes")
  }),

  mittwald_project_invite_get: z.object({
    inviteId: z.string().describe("ID of the ProjectInvite to be retrieved"),
    output: z.enum(["json", "table", "yaml"]).optional().describe("Output format")
  }),

  // Agent 2 app dependency schemas
  mittwald_app_dependency_update: z.object({
    installation_id: z.string().optional().describe("ID or short ID of an app installation"),
    set: z.array(z.string()).min(1).describe("Set a dependency to a specific version. Format: <dependency>=<version>"),
    update_policy: z.enum(["none", "inheritedFromApp", "patchLevel", "all"]).optional().describe("Set the update policy for the configured dependencies"),
    quiet: z.boolean().optional().describe("Suppress process output and only display a machine-readable summary")
  }),

  mittwald_app_dependency_versions: z.object({
    systemsoftware: z.string().describe("Name of the systemsoftware for which to list versions"),
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
  
  // Agent 3 app management schemas
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

  mittwald_login_reset: z.object({}),
  
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
  
  mittwald_database_list: z.object({
    projectId: z.string().optional().describe("ID or short ID of a project; this flag is optional if a default project is set in the context"),
    output: z.enum(["txt", "json", "yaml", "csv", "tsv"]).optional().describe("Output format"),
    extended: z.boolean().optional().describe("Show extended information"),
    noHeader: z.boolean().optional().describe("Hide table header"),
    noTruncate: z.boolean().optional().describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z.boolean().optional().describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z.enum([",", ";"]).optional().describe("Separator for CSV output (only relevant for CSV output)")
  }),
  
  // Agent 11 ddev tools
  mittwald_ddev_init: ddevInitSchema,
  
  // Agent 15 mail tools
  mittwald_mail_deliverybox: z.object({
    help: z.boolean().optional().describe("Show help for mail deliverybox commands")
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
  elicitation_example: any; // Example tools use any for flexibility
  mcp_logging: { level: 'debug' | 'info' | 'warning' | 'error'; message: string; data?: any };
  
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
  mittwald_login_reset: {};
  
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
  
  mittwald_database_list: {
    projectId?: string;
    output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
    extended?: boolean;
    noHeader?: boolean;
    noTruncate?: boolean;
    noRelativeDates?: boolean;
    csvSeparator?: ',' | ';';
  };
  
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
    const tools = [...TOOLS].sort((a, b) => a.name.localeCompare(b.name));
    logger.info(`✅ Returning ${tools.length} tools: ${tools.map(t => t.name).join(', ')}`);
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
      logger.error("Tool call missing required arguments", { toolName: request.params?.name });
      throw new Error("Arguments are required");
    }

    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      logger.error("Unknown tool requested", { toolName: request.params.name });
      throw new Error(`${TOOL_ERROR_MESSAGES.UNKNOWN_TOOL} ${request.params.name}`);
    }


    // Validate arguments using Zod schema
    const toolName = request.params.name as keyof typeof ToolSchemas;
    const schema = ToolSchemas[toolName];
    
    if (!schema) {
      logger.error("No Zod schema found for tool", { toolName });
      throw new Error(`No validation schema found for tool: ${toolName}`);
    }
    
    let args: ToolArgs[keyof ToolArgs];
    try {
      const validatedArgs = schema.parse(request.params.arguments);
      args = validatedArgs as ToolArgs[keyof ToolArgs];
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
      case "elicitation_example":
        result = await handleElicitationExample(args, context);
        break;
      case "mcp_logging":
        result = await handleLogging(args, handlerContext);
        break;
      
      // Note: Org handlers not yet implemented

      // Agent-18 project tools
      case "mittwald_project_create":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldProjectCreateContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectCreate(args, mittwaldProjectCreateContext);
        break;
      case "mittwald_project_delete":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldProjectDeleteContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectDelete(args, mittwaldProjectDeleteContext);
        break;
      case "mittwald_project_get":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldProjectGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectGet(args, mittwaldProjectGetContext);
        break;
      case "mittwald_project_filesystem_usage":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldProjectFilesystemUsageContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectFilesystemUsage(args, mittwaldProjectFilesystemUsageContext);
        break;
      case "mittwald_project_invite_get":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldProjectInviteGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleProjectInviteGet(args, mittwaldProjectInviteGetContext);
        break;

      // Agent 2 app dependency tools
      case "mittwald_app_dependency_update":
        result = await handleMittwaldAppDependencyUpdate(args);
        break;

      case "mittwald_app_dependency_versions":
        result = await handleMittwaldAppDependencyVersions(args);
        break;

      // Agent 3 app install tools
      case "mittwald_app_install_joomla":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppInstallJoomlaContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleAppInstallJoomla(args, mittwaldAppInstallJoomlaContext);
        break;
      case "mittwald_app_install_matomo":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppInstallMatomoContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleAppInstallMatomo(args, mittwaldAppInstallMatomoContext);
        break;
      case "mittwald_app_install_nextcloud":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppInstallNextcloudContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleAppInstallNextcloud(args, mittwaldAppInstallNextcloudContext);
        break;
      case "mittwald_app_install_shopware5":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppInstallShopware5Context: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleAppInstallShopware5(args, mittwaldAppInstallShopware5Context);
        break;
      case "mittwald_app_install_shopware6":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppInstallShopware6Context: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleAppInstallShopware6(args, mittwaldAppInstallShopware6Context);
        break;
      case "mittwald_app_install_typo3":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppInstallTypo3Context: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleAppInstallTypo3(args, mittwaldAppInstallTypo3Context);
        break;
      case "mittwald_app_install_wordpress":
        // Create context with mittwaldClient for Mittwald CLI tools
        const mittwaldAppInstallWordpressContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleAppInstallWordpress(args, mittwaldAppInstallWordpressContext);
        break;

      // Agent 3 app management tools
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
      
      case "mittwald_login_reset":
        const mittwaldLoginResetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleLoginReset(args, mittwaldLoginResetContext);
        break;
        
      // Agent 7 cronjob execution tools
      case "mittwald_cronjob_execution_abort":
        const mittwaldCronjobExecutionAbortContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleCronjobExecutionAbort(args, mittwaldCronjobExecutionAbortContext);
        break;
        
      case "mittwald_cronjob_execution_get":
        const mittwaldCronjobExecutionGetContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleCronjobExecutionGet(args, mittwaldCronjobExecutionGetContext);
        break;
        
      case "mittwald_cronjob_execution_list":
        const mittwaldCronjobExecutionListContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleCronjobExecutionList(args, mittwaldCronjobExecutionListContext);
        break;
        
      case "mittwald_cronjob_execution_logs":
        const mittwaldCronjobExecutionLogsContext: MittwaldToolHandlerContext = {
          mittwaldClient: getMittwaldClient(),
          userId: handlerContext.userId,
          sessionId: handlerContext.sessionId,
          progressToken: handlerContext.progressToken,
        };
        result = await handleCronjobExecutionLogs(args, mittwaldCronjobExecutionLogsContext);
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
        result = await handleMittwaldCronjobGet(args.cronjobId, args.output);
        break;
        
      case "mittwald_cronjob_list":
        result = await handleMittwaldCronjobList(
          args.projectId,
          args.output,
          args.extended,
          args.noHeader,
          args.noTruncate,
          args.noRelativeDates,
          args.csvSeparator
        );
        break;
        
      case "mittwald_cronjob_update":
        result = await handleMittwaldCronjobUpdate(args.cronjobId, {
          quiet: args.quiet,
          description: args.description,
          interval: args.interval,
          email: args.email,
          url: args.url,
          command: args.command,
          interpreter: args.interpreter,
          enable: args.enable,
          disable: args.disable,
          timeout: args.timeout
        });
        break;
        
      case "mittwald_cronjob":
        result = await handleMittwaldCronjob(args.help);
        break;
        
      // Agent 9 database tools
      case "mittwald_database_mysql_dump":
        result = await handleDatabaseMysqlDump(args);
        break;
        
      case "mittwald_database_mysql_get":
        result = await handleDatabaseMysqlGet(args);
        break;
        
      case "mittwald_database_list":
        result = await handleMittwaldDatabaseList(
          args.projectId,
          args.output,
          args.extended,
          args.noHeader,
          args.noTruncate,
          args.noRelativeDates,
          args.csvSeparator
        );
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
