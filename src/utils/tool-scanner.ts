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
 * These tools are deactivated for security and multi-tenancy reasons
 */
export const EXCLUDED_TOOLS_WITH_REASONS: Record<string, string> = {
  'mittwald_login_reset': 'security reasons in multi-tenant environment',
  'mittwald_login_token': 'security reasons in multi-tenant environment',
  'mittwald_org_delete': 'organization deletion is irreversible and no org/create tool exists for safe testing'
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
          logger.info(`Tool '${toolName}' is excluded from registry (deactivated for multi-tenancy)`);
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
    // Use build directory if running from compiled JS, otherwise use src directory
    const isBuilt = process.cwd().includes('/app') || process.argv[0].includes('build');
    const baseDir = isBuilt 
      ? resolve(process.cwd(), 'build', 'constants', 'tool', 'mittwald-cli')
      : resolve(process.cwd(), 'src', 'constants', 'tool', 'mittwald-cli');
    
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
