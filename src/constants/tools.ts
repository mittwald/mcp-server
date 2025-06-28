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
import { ELICITATION_EXAMPLE_TOOL } from './tool/elicitation-example.js';
import { MCP_LOGGING_TOOL } from './tool/logging.js';

// Agent 2 app dependency tools
import { mittwald_app_dependency_update } from './tool/mittwald-cli/app/dependency/update.js';
import { mittwald_app_dependency_versions } from './tool/mittwald-cli/app/dependency/versions.js';

// Agent 3 app install tools
import { mittwald_app_install_joomla } from './tool/mittwald-cli/app/install/joomla.js';
import { mittwald_app_install_matomo } from './tool/mittwald-cli/app/install/matomo.js';
import { mittwald_app_install_nextcloud } from './tool/mittwald-cli/app/install/nextcloud.js';
import { mittwald_app_install_shopware5 } from './tool/mittwald-cli/app/install/shopware5.js';
import { mittwald_app_install_shopware6 } from './tool/mittwald-cli/app/install/shopware6.js';
import { mittwald_app_install_typo3 } from './tool/mittwald-cli/app/install/typo3.js';
import { mittwald_app_install_wordpress } from './tool/mittwald-cli/app/install/wordpress.js';

// Agent 3 app management tools
import { mittwald_app_list } from './tool/mittwald-cli/app/list.js';

// Agent-18 project tools
import { mittwald_project_create } from './tool/mittwald-cli/project/create.js';
import { mittwald_project_delete } from './tool/mittwald-cli/project/delete.js';
import { mittwald_project_get } from './tool/mittwald-cli/project/get.js';
import { mittwald_project_filesystem_usage } from './tool/mittwald-cli/project/filesystem-usage.js';
import { mittwald_project_invite_get } from './tool/mittwald-cli/project/invite-get.js';

// Agent 14 tools
import { mittwald_domain_virtualhost_list } from './tool/mittwald-cli/domain/virtualhost-list.js';
import { mittwald_extension_install } from './tool/mittwald-cli/extension/install.js';
import { mittwald_extension_list_installed } from './tool/mittwald-cli/extension/list-installed.js';
import { mittwald_extension_list } from './tool/mittwald-cli/extension/list.js';
import { mittwald_extension_uninstall } from './tool/mittwald-cli/extension/uninstall.js';
import { mittwald_login_reset } from './tool/mittwald-cli/login/reset.js';

// Agent 7 cronjob tools
import { mittwald_cronjob_create } from './tool/mittwald-cli/cronjob/create.js';

// Agent 8 cronjob tools
import { mittwaldCronjobGet, mittwaldCronjobList } from './tool/mittwald-cli/cronjob/index.js';

// Agent 9 database tools
import { MITTWALD_DATABASE_MYSQL_DUMP_TOOL } from './tool/mittwald-cli/database/mysql/dump.js';
import { MITTWALD_DATABASE_MYSQL_GET_TOOL } from './tool/mittwald-cli/database/mysql/get.js';

// Agent 11 ddev tools
import { ddev_init } from './tool/mittwald-cli/ddev/init.js';

// Agent 15 mail tools
import { mittwald_mail_deliverybox } from './tool/mittwald-cli/mail/deliverybox.js';

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
  // Example and utility tools
  ELICITATION_EXAMPLE_TOOL,
  MCP_LOGGING_TOOL,
  
  // Agent 2 app dependency tools
  mittwald_app_dependency_update,
  mittwald_app_dependency_versions,
  
  // Agent 3 app install tools
  mittwald_app_install_joomla,
  mittwald_app_install_matomo,
  mittwald_app_install_nextcloud,
  mittwald_app_install_shopware5,
  mittwald_app_install_shopware6,
  mittwald_app_install_typo3,
  mittwald_app_install_wordpress,
  
  // Agent 3 app management tools
  mittwald_app_list,
  
  // Agent-18 project tools
  mittwald_project_create,
  mittwald_project_delete,
  mittwald_project_get,
  mittwald_project_filesystem_usage,
  mittwald_project_invite_get,
  
  // Agent 14 tools
  mittwald_domain_virtualhost_list,
  mittwald_extension_install,
  mittwald_extension_list_installed,
  mittwald_extension_list,
  mittwald_extension_uninstall,
  mittwald_login_reset,
  
  // Agent 7 cronjob tools
  mittwald_cronjob_create,
  
  // Agent 8 cronjob tools
  mittwaldCronjobGet,
  mittwaldCronjobList,
  
  // Agent 9 database tools
  MITTWALD_DATABASE_MYSQL_DUMP_TOOL,
  MITTWALD_DATABASE_MYSQL_GET_TOOL,
  
  // Agent 11 ddev tools
  ddev_init,
  
  // Agent 15 mail tools
  mittwald_mail_deliverybox,
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