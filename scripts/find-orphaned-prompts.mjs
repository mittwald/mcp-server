#!/usr/bin/env node
/**
 * Find orphaned prompts - prompts that exist for tools not in current inventory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read tools inventory
const toolsInventory = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'evals', 'inventory', 'tools-current.json'), 'utf-8')
);

// Get set of current tool names
const currentTools = new Set(toolsInventory.tools.map(t => t.mcpName));

// Get all active prompts
const promptsDir = path.join(__dirname, '..', 'evals', 'prompts');
const orphanedPrompts = [];

function scanDirectory(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && item !== '_archived') {
      scanDirectory(fullPath);
    } else if (item.endsWith('.json') && item !== 'generation-manifest.json') {
      try {
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const toolName = content.input?.tool_name;

        if (toolName && !currentTools.has(toolName)) {
          orphanedPrompts.push({
            file: path.relative(promptsDir, fullPath),
            toolName,
            displayName: content.input?.display_name
          });
        }
      } catch (err) {
        console.warn(`Warning: Could not parse ${fullPath}`);
      }
    }
  }
}

scanDirectory(promptsDir);

console.log('🔍 Checking for orphaned prompts...\n');

if (orphanedPrompts.length === 0) {
  console.log('✅ No orphaned prompts found! All active prompts match current tool inventory.\n');
} else {
  console.log(`❌ Found ${orphanedPrompts.length} orphaned prompt(s):\n`);
  orphanedPrompts.forEach(p => {
    console.log(`  - ${p.file}`);
    console.log(`    Tool: ${p.displayName} (${p.toolName})`);
    console.log('');
  });
}

console.log(`Current tool inventory: ${currentTools.size} tools`);
