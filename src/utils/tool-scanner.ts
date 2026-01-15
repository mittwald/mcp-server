/**
 * @file Tool scanner utility
 * @module utils/tool-scanner
 * 
 * @remarks
 * This module provides functionality to dynamically discover and load CLI tools
 * from the filesystem. It scans for files matching a pattern and attempts to
 * load their tool registrations.
 */

import { readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { logger } from './logger.js';
import type { 
  ToolRegistry, 
  ToolScanOptions, 
  ToolScanResult, 
  ToolRegistration 
} from '../types/tool-registry.js';

/**
 * Tools that should be excluded from the tool registry with reasons
 * These tools are deactivated for security, multi-tenancy, and to enforce
 * a no-CLI-spawn runtime (see docs/UNMIGRATED-TOOLS-ANALYSIS.md).
 */
export const EXCLUDED_TOOLS_WITH_REASONS: Record<string, string> = {
  'mittwald_login_reset': 'security reasons in multi-tenant environment',
  'mittwald_login_token': 'security reasons in multi-tenant environment',
  'mittwald_org_delete': 'organization deletion is irreversible and no org/create tool exists for safe testing',

  // Disabled to guarantee "no mw spawn" in normal operation (not yet migrated or not suitable for MCP).
  'mittwald_app_create_node': 'not migrated to library yet (complex installer workflow)',
  'mittwald_app_create_php': 'not migrated to library yet (complex installer workflow)',
  'mittwald_app_create_php_worker': 'not migrated to library yet (complex installer workflow)',
  'mittwald_app_create_python': 'not migrated to library yet (complex installer workflow)',
  'mittwald_app_create_static': 'not migrated to library yet (complex installer workflow)',
  'mittwald_app_install_wordpress': 'not migrated to library yet (multi-step installer workflow)',
  'mittwald_app_install_typo3': 'not migrated to library yet (multi-step installer workflow)',
  'mittwald_app_install_shopware5': 'not migrated to library yet (multi-step installer workflow)',
  'mittwald_app_install_shopware6': 'not migrated to library yet (multi-step installer workflow)',
  'mittwald_app_install_joomla': 'not migrated to library yet (multi-step installer workflow)',
  'mittwald_app_install_matomo': 'not migrated to library yet (multi-step installer workflow)',
  'mittwald_app_install_nextcloud': 'not migrated to library yet (multi-step installer workflow)',
  'mittwald_app_install_contao': 'not migrated to library yet (multi-step installer workflow)',
  'mittwald_app_dependency_list': 'not migrated to library yet',
  'mittwald_app_dependency_update': 'not migrated to library yet',
  'mittwald_app_dependency_versions': 'not migrated to library yet',
  'mittwald_project_filesystem_usage': 'not migrated to library yet',
  'mittwald_project_invite_list_own': 'not migrated to library yet',
  'mittwald_project_membership_get_own': 'not migrated to library yet',
  'mittwald_project_membership_list_own': 'not migrated to library yet',
  'mittwald_org_invite_list_own': 'not migrated to library yet',
  'mittwald_org_membership_list_own': 'not migrated to library yet',
  'mittwald_extension_install': 'not migrated to library yet',
  'mittwald_extension_list': 'not migrated to library yet',
  'mittwald_extension_list_installed': 'not migrated to library yet',
  'mittwald_extension_uninstall': 'not migrated to library yet',
  'mittwald_container_recreate': 'not migrated to library yet',
  'mittwald_container_update': 'not migrated to library yet',
  'mittwald_sftp_user_create': 'not migrated to library yet (CLI-only parameter coverage)',
  'mittwald_sftp_user_update': 'not migrated to library yet (CLI-only parameter coverage)',
  'mittwald_volume_delete': 'not migrated to library yet (CLI-based safety checks)',

  // Interactive/streaming/file-transfer operations (incompatible with stateless MCP requests).
  'mittwald_app_ssh': 'interactive shell session not supported via MCP',
  'mittwald_database_mysql_shell': 'interactive shell session not supported via MCP',
  'mittwald_database_mysql_port_forward': 'long-running port-forward/tunnel not supported via MCP',
  'mittwald_container_logs': 'streaming logs not supported via MCP',
  'mittwald_container_run': 'interactive/arb command execution not supported via MCP',
  'mittwald_app_download': 'local file download/upload not supported via MCP',
  'mittwald_app_upload': 'local file download/upload not supported via MCP',
  'mittwald_backup_download': 'local file download/upload not supported via MCP',
  'mittwald_app_open': 'opens a browser on the host; not supported via MCP',
  'mittwald_database_mysql_dump': 'streams large exports; not supported via MCP',
  'mittwald_database_mysql_import': 'streams large imports; not supported via MCP',
  'mittwald_database_mysql_phpmyadmin': 'opens a browser on the host; not supported via MCP',

  // No stable API support.
  'mittwald_cronjob_execution_logs': 'no API support for execution logs',
  'mittwald_database_mysql_charsets': 'requires direct MySQL connection; no API support',
  'mittwald_database_list': 'CLI-only wrapper; no direct API equivalent',

  // Local development helpers.
  'mittwald_ddev_init': 'local development helper (not supported in MCP server runtime)',
  'mittwald_ddev_render_config': 'local development helper (not supported in MCP server runtime)',

  // Conversation tools (no OAuth scope support - admin-only endpoints).
  'mittwald_conversation_categories': 'conversation endpoints return 403 Forbidden - no OAuth scope support (admin-only)',
  'mittwald_conversation_close': 'conversation endpoints return 403 Forbidden - no OAuth scope support (admin-only)',
  'mittwald_conversation_create': 'conversation endpoints return 403 Forbidden - no OAuth scope support (admin-only)',
  'mittwald_conversation_list': 'conversation endpoints return 403 Forbidden - no OAuth scope support (admin-only)',
  'mittwald_conversation_reply': 'conversation endpoints return 403 Forbidden - no OAuth scope support (admin-only)',
  'mittwald_conversation_show': 'conversation endpoints return 403 Forbidden - no OAuth scope support (admin-only)',
};

/**
 * Set of excluded tool names for quick lookup
 */
const EXCLUDED_TOOLS = new Set(Object.keys(EXCLUDED_TOOLS_WITH_REASONS));

/**
 * Check if a tool is excluded from the registry
 *
 * @param toolName - Name of the tool to check
 * @returns true if the tool is excluded
 */
export function isToolExcluded(toolName: string): boolean {
  return EXCLUDED_TOOLS.has(toolName);
}

/**
 * Get the reason why a tool is excluded
 *
 * @param toolName - Name of the tool
 * @returns Reason string or undefined if not excluded
 */
export function getExclusionReason(toolName: string): string | undefined {
  return EXCLUDED_TOOLS_WITH_REASONS[toolName];
}

/**
 * Default options for tool scanning
 */
const DEFAULT_SCAN_OPTIONS: ToolScanOptions = {
  baseDir: '',
  pattern: '*-cli.ts',
  recursive: true
};

/**
 * Scans a directory recursively for CLI tool files
 * 
 * @param dir - Directory to scan
 * @param pattern - File pattern to match (default: *-cli.ts)
 * @returns Array of file paths matching the pattern
 */
async function scanDirectory(dir: string, pattern: string = '*-cli.ts'): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await scanDirectory(fullPath, pattern);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        // Check if file matches pattern
        if (entry.name.endsWith('-cli.ts') || entry.name.endsWith('-cli.js')) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    logger.warn(`Failed to scan directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Loads a tool registration from a file
 * 
 * @param filePath - Path to the tool file
 * @returns Tool registration or null if failed
 */
async function loadToolFromFile(filePath: string): Promise<ToolRegistration | null> {
  try {
    // Convert file path to URL for dynamic import
    const fileUrl = pathToFileURL(filePath).href;
    
    // Dynamic import the module
    const module = await import(fileUrl);
    
    // Look for the tool registration export
    // We'll check for different possible export patterns
    let registration: ToolRegistration | null = null;
    
    // Pattern 1: Direct export of ToolRegistration
    if (module.default && typeof module.default === 'object' && 
        module.default.tool && module.default.handler) {
      registration = module.default;
    }
    
    // Pattern 2: Named export 'registration'
    if (!registration && module.registration && typeof module.registration === 'object' &&
        module.registration.tool && module.registration.handler) {
      registration = module.registration;
    }
    
    // Pattern 3: Separate tool and handler exports (legacy pattern)
    if (!registration) {
      // Try to find tool and handler exports
      const toolExport = Object.values(module).find(exp => 
        typeof exp === 'object' && exp !== null && 
        'name' in exp && 'description' in exp && 'inputSchema' in exp
      );
      
      const handlerExport = Object.values(module).find(exp => 
        typeof exp === 'function' && exp.name.includes('handle')
      );
      
      if (toolExport && handlerExport) {
        registration = {
          tool: toolExport as any,
          handler: handlerExport as any,
          schema: (toolExport as any).inputSchema
        };
      }
    }
    
    if (!registration) {
      logger.warn(`No valid tool registration found in ${filePath}`);
      return null;
    }
    
    // Validate the registration
    if (!registration.tool || !registration.tool.name || !registration.handler) {
      logger.warn(`Invalid tool registration in ${filePath}: missing tool name or handler`);
      return null;
    }
    
    return registration;
    
  } catch (error) {
    logger.warn(`Failed to load tool from ${filePath}:`, error);
    return null;
  }
}

/**
 * Scans for and loads all CLI tools from the specified directory
 * 
 * @param options - Scanning options
 * @returns Tool registry with all loaded tools
 */
export async function loadTools(options: Partial<ToolScanOptions> = {}): Promise<ToolRegistry> {
  const opts = { ...DEFAULT_SCAN_OPTIONS, ...options };
  
  logger.info(`Scanning for CLI tools in ${opts.baseDir} with pattern ${opts.pattern}`);
  
  const registry: ToolRegistry = {
    tools: new Map(),
    handlers: new Map(),
    schemas: new Map()
  };
  
  try {
    // Scan for tool files
    const toolFiles = await scanDirectory(opts.baseDir, opts.pattern);
    
    logger.info(`Found ${toolFiles.length} potential tool files`);
    
    // Load each tool file
    for (const filePath of toolFiles) {
      const registration = await loadToolFromFile(filePath);
      
      if (registration) {
        const toolName = registration.tool.name;
        
        // Check if tool is excluded
        if (EXCLUDED_TOOLS.has(toolName)) {
          logger.info(
            `Tool '${toolName}' is excluded from registry: ${EXCLUDED_TOOLS_WITH_REASONS[toolName] ?? 'disabled'}`
          );
          continue;
        }
        
        // Check for duplicate tool names
        if (registry.tools.has(toolName)) {
          logger.warn(`Duplicate tool name '${toolName}' found in ${filePath}, skipping`);
          continue;
        }
        
        // Register the tool
        registry.tools.set(toolName, registration.tool);
        registry.handlers.set(toolName, registration.handler);
        
        if (registration.schema) {
          registry.schemas.set(toolName, registration.schema);
        }
        
        logger.debug(`Loaded tool '${toolName}' from ${filePath}`);
      }
    }
    
    logger.info(`Successfully loaded ${registry.tools.size} CLI tools`);
    
  } catch (error) {
    logger.error('Failed to load CLI tools:', error);
  }
  
  return registry;
}

/**
 * Scans for tools and returns a summary result
 * 
 * @param options - Scanning options
 * @returns Scan result with statistics
 */
export async function scanTools(options: Partial<ToolScanOptions> = {}): Promise<ToolScanResult> {
  const opts = { ...DEFAULT_SCAN_OPTIONS, ...options };
  
  const result: ToolScanResult = {
    loaded: 0,
    failed: 0,
    failures: [],
    toolNames: []
  };
  
  try {
    // Scan for tool files
    const toolFiles = await scanDirectory(opts.baseDir, opts.pattern);
    
    // Load each tool file
    for (const filePath of toolFiles) {
      const registration = await loadToolFromFile(filePath);
      
      if (registration) {
        const toolName = registration.tool.name;
        
        // Check if tool is excluded
        if (EXCLUDED_TOOLS.has(toolName)) {
          // Don't count excluded tools as failed, but don't add them to results
          continue;
        }
        
        result.loaded++;
        result.toolNames.push(toolName);
      } else {
        result.failed++;
        result.failures.push({
          file: filePath,
          error: 'Failed to load tool registration'
        });
      }
    }
    
  } catch (error) {
    result.failed++;
    result.failures.push({
      file: opts.baseDir,
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  return result;
}

/**
 * Gets the tool registry instance
 * 
 * @remarks
 * This function provides access to the global tool registry.
 * The registry is loaded on first access and cached for subsequent calls.
 */
let globalRegistry: ToolRegistry | null = null;

export async function getToolRegistry(): Promise<ToolRegistry> {
  if (!globalRegistry) {
    // Load tools from the constants directory
    // Determine if running from build or src by checking this file's actual location
    const currentFileUrl = new URL(import.meta.url);
    const currentFilePath = currentFileUrl.pathname;
    const isBuilt = currentFilePath.includes('/build/') || currentFilePath.includes('/app/');

    const baseDir = isBuilt
      ? resolve(process.cwd(), 'build', 'constants', 'tool', 'mittwald-cli')
      : resolve(process.cwd(), 'src', 'constants', 'tool', 'mittwald-cli');

    logger.debug(`Tool registry: isBuilt=${isBuilt}, baseDir=${baseDir}`);

    globalRegistry = await loadTools({ baseDir });
  }

  return globalRegistry;
}

/**
 * Resets the global tool registry
 * 
 * @remarks
 * This function is primarily used for testing purposes to reset the registry state.
 */
export function resetToolRegistry(): void {
  globalRegistry = null;
}
