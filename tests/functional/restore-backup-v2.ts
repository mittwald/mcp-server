#!/usr/bin/env node
/**
 * Backup Recovery Script - Production Site Restoration (Interactive Mode)
 *
 * Discovers available backups and restores from the most recent one before today
 */

import { createSessionRunner } from './src/harness/session-runner.js';
import type { SessionResult } from './src/types/index.js';

const mainPrompt = `You are helping with urgent production site recovery. A deployment failed and broke the site.
Use the Mittwald MCP tools to complete the following:

1. First, use the project/list tool to find the production project
2. Then use the backup/list tool to list all available backups for that project
3. Identify the most recent backup from before today
4. Finally, use the backup/restore tool to restore from that backup

Work through these steps one at a time, analyzing tool responses carefully.
Discover the project ID and backup ID from the tool responses. Use the most recent backup from before today.
Complete the restoration immediately.`;

async function main(): Promise<void> {
  const runner = createSessionRunner();

  console.log('🚀 Starting production backup recovery...\n');

  const sessionConfig = {
    prompt: mainPrompt,
    workingDir: process.cwd(),
    mcpConfig: './config/mcp-server.json',
    timeoutMs: 180000, // 3 minutes
    interactive: true, // Use interactive mode to keep stdin open
    env: {
      CLAUDE_CODE_OAUTH_TOKEN: process.env.CLAUDE_CODE_OAUTH_TOKEN || '',
    },
  };

  try {
    const { sessionId, stream, result, kill, stdin } = await runner.spawn(sessionConfig);

    console.log(`📋 Session ID: ${sessionId}\n`);
    console.log('='.repeat(80));
    console.log('RECOVERY PROCESS:');
    console.log('='.repeat(80) + '\n');

    let hasToolOutput = false;

    // Stream all events
    for await (const event of stream) {
      if (event.type === 'text') {
        const content = event.content as Record<string, unknown>;
        if (content.text && typeof content.text === 'string') {
          console.log(content.text);
        }
      } else if (event.type === 'tool-call') {
        hasToolOutput = true;
        const content = event.content as Record<string, unknown>;
        console.log(`\n📤 Tool Call: ${content.name}`);
        if (content.params) {
          console.log(`   Parameters: ${JSON.stringify(content.params, null, 2)}`);
        }
      } else if (event.type === 'tool-result') {
        hasToolOutput = true;
        const content = event.content as Record<string, unknown>;
        console.log(`\n📥 Tool Result:`);
        if (content.result) {
          const resultStr = typeof content.result === 'string'
            ? content.result
            : JSON.stringify(content.result, null, 2);
          // Show first 1000 chars
          console.log(`   ${resultStr.substring(0, 1000)}${resultStr.length > 1000 ? '\n   ...(truncated)' : ''}`);
        }
      } else if (event.type === 'error') {
        const content = event.content as Record<string, unknown>;
        console.error(`\n❌ Error: ${content.message}`);
      }
    }

    // Close stdin to signal completion
    if (stdin) {
      stdin.end();
    }

    console.log('\n' + '='.repeat(80));
    console.log('SESSION RESULT:');
    console.log('='.repeat(80) + '\n');

    const sessionResult: SessionResult = await result;

    console.log(`Status: ${sessionResult.status}`);
    console.log(`Duration: ${(sessionResult.metrics.durationMs / 1000).toFixed(2)}s`);
    console.log(`Cost: $${sessionResult.metrics.totalCostUsd.toFixed(4)}`);
    console.log(`Turns: ${sessionResult.metrics.numTurns}`);

    if (!hasToolOutput) {
      console.warn('\n⚠️  Warning: No tool calls were made. The MCP server may not be properly configured.');
      console.log('\nPlease verify:');
      console.log('1. The MCP server is running at: https://mittwald-mcp-fly2.fly.dev/mcp');
      console.log('2. CLAUDE_CODE_OAUTH_TOKEN is properly set');
      console.log('3. The mcp-server.json configuration is correct');
    }

    if (sessionResult.error) {
      console.error(`\n❌ Error: ${sessionResult.error}`);
      process.exit(1);
    }

    if (sessionResult.result) {
      console.log(`\n✅ Result:\n${sessionResult.result}`);
    }

    if (hasToolOutput && sessionResult.status === 'passed') {
      console.log('\n✨ Production site restoration process completed successfully!');
    }

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
