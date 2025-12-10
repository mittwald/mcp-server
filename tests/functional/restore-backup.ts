#!/usr/bin/env node
/**
 * Backup Recovery Script - Production Site Restoration
 *
 * Discovers available backups and restores from the most recent one before today
 */

import { createSessionRunner } from './src/harness/session-runner.js';
import type { SessionResult } from './src/types/index.js';

const prompt = `You are helping with an urgent production site recovery. A deployment failed and broke the site.
Your task is to:
1. List all available backups for the production project using the backup/list tool
2. Identify the most recent backup from before today (yesterday or earlier)
3. Show me the backup details
4. Restore the project from that backup using the backup/restore tool

Discover the project ID and backup ID yourself from the tool responses. Use reasonable defaults:
- Choose the production/main project
- Choose the most recent backup that's from before today
- Restore both files and database

Execute the restore operation immediately without asking for confirmation. The site is broken and needs to be recovered ASAP.`;

async function main(): Promise<void> {
  const runner = createSessionRunner();

  console.log('🚀 Starting production backup recovery...\n');

  const sessionConfig = {
    prompt,
    workingDir: process.cwd(),
    mcpConfig: './config/mcp-server.json',
    timeoutMs: 120000, // 2 minutes for recovery operations
    env: {
      CLAUDE_CODE_OAUTH_TOKEN: process.env.CLAUDE_CODE_OAUTH_TOKEN || '',
    },
  };

  try {
    const { sessionId, stream, result, kill } = await runner.spawn(sessionConfig);

    console.log(`📋 Session ID: ${sessionId}\n`);
    console.log('='.repeat(80));
    console.log('STREAMING OUTPUT:');
    console.log('='.repeat(80) + '\n');

    // Stream and display all events
    for await (const event of stream) {
      if (event.type === 'text') {
        const content = event.content as Record<string, unknown>;
        if (content.text && typeof content.text === 'string') {
          console.log(content.text);
        }
      } else if (event.type === 'tool-call') {
        const content = event.content as Record<string, unknown>;
        console.log(`\n🔧 Tool Call: ${content.name}`);
        if (content.params) {
          console.log(`   Parameters: ${JSON.stringify(content.params, null, 2)}`);
        }
      } else if (event.type === 'tool-result') {
        const content = event.content as Record<string, unknown>;
        console.log(`✅ Tool Result: ${content.name}`);
        if (content.result) {
          const resultStr = typeof content.result === 'string'
            ? content.result
            : JSON.stringify(content.result, null, 2);
          console.log(`   ${resultStr.substring(0, 500)}${resultStr.length > 500 ? '...' : ''}`);
        }
      } else if (event.type === 'error') {
        const content = event.content as Record<string, unknown>;
        console.error(`\n❌ Error: ${content.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('FINAL RESULT:');
    console.log('='.repeat(80) + '\n');

    const sessionResult: SessionResult = await result;

    console.log(`Status: ${sessionResult.status}`);
    console.log(`Duration: ${sessionResult.metrics.durationMs}ms`);
    console.log(`Cost: $${sessionResult.metrics.totalCostUsd.toFixed(4)}`);
    console.log(`Turns: ${sessionResult.metrics.numTurns}`);

    if (sessionResult.error) {
      console.error(`\n❌ Error: ${sessionResult.error}`);
      process.exit(1);
    }

    if (sessionResult.result) {
      console.log(`\n✅ Recovery Complete!\n${sessionResult.result}`);
    }

    console.log('\n✨ Production site restoration process completed successfully!');
    process.exit(sessionResult.status === 'passed' ? 0 : 1);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
