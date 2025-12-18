#!/usr/bin/env tsx
/**
 * Helper script to migrate a tool handler from CLI spawning to library calls
 * Usage: tsx scripts/migrate-tool-handler.ts <handler-file> <library-function> <tool-name>
 */

import { readFileSync, writeFileSync } from 'fs';

const handlerFile = process.argv[2];
const libraryFunction = process.argv[3];
const toolName = process.argv[4];

if (!handlerFile || !libraryFunction || !toolName) {
  console.error('Usage: tsx scripts/migrate-tool-handler.ts <handler-file> <library-function> <tool-name>');
  process.exit(1);
}

console.log(`Migrating ${handlerFile} to use ${libraryFunction}...`);

// Template for migrated handler
const template = `import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { ${libraryFunction}, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

// TODO: Add interface for args based on tool requirements

export const handler: MittwaldCliToolHandler<any> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: '${toolName}',
      cliCommand: 'mw',
      cliArgs: [], // TODO: Build CLI args from handler
      libraryFn: async () => {
        return await ${libraryFunction}({
          // TODO: Map args to library options
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: '${toolName}',
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
      });
    }

    // Return library result
    return formatToolResponse(
      'success',
      'Operation completed',
      validation.libraryOutput.data,
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP05] Unexpected error', { error, tool: '${toolName}' });
    return formatToolResponse('error', \`Failed: \${error instanceof Error ? error.message : String(error)}\`);
  }
};`;

console.log('Template generated. Manual migration required for:');
console.log('1. Args interface definition');
console.log('2. CLI args building');
console.log('3. Library function parameter mapping');
console.log('4. Response message customization');
