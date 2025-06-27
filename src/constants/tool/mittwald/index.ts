/**
 * @file Mittwald MCP tools aggregation
 * @module constants/tool/mittwald
 * 
 * @remarks
 * This module exports all Mittwald MCP tools for cronjob, filesystem, and file operations.
 * Total: 26 tools (10 cronjob + 5 filesystem + 11 file)
 */

export { MITTWALD_CRONJOB_TOOLS } from './cronjob/index.js';
export { MITTWALD_FILESYSTEM_TOOLS } from './filesystem/index.js';
export { MITTWALD_FILE_TOOLS } from './file/index.js';

import { MITTWALD_CRONJOB_TOOLS } from './cronjob/index.js';
import { MITTWALD_FILESYSTEM_TOOLS } from './filesystem/index.js';
import { MITTWALD_FILE_TOOLS } from './file/index.js';

/**
 * All Mittwald MCP tools combined
 */
export const MITTWALD_TOOLS = [
  ...MITTWALD_CRONJOB_TOOLS,
  ...MITTWALD_FILESYSTEM_TOOLS,
  ...MITTWALD_FILE_TOOLS
];