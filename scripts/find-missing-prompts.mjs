#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read tools inventory
const toolsInventory = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'evals', 'inventory', 'tools-current.json'), 'utf-8')
);

// Get tools in core domains
const TARGET_DOMAINS = ['apps', 'databases', 'project-foundation', 'organization'];
const targetTools = toolsInventory.tools.filter(t => TARGET_DOMAINS.includes(t.domain));

// Get all existing prompts
const promptsDir = path.join(__dirname, '..', 'evals', 'prompts');
const existingPrompts = new Set();

function scanDirectory(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && item !== '_archived') {
      scanDirectory(fullPath);
    } else if (item.endsWith('.json')) {
      try {
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        if (content.input?.tool_name) {
          existingPrompts.add(content.input.tool_name);
        }
      } catch (err) {
        console.warn(`Warning: Could not parse ${fullPath}`);
      }
    }
  }
}

scanDirectory(promptsDir);

// Find missing tools
const missingTools = targetTools.filter(t => !existingPrompts.has(t.mcpName));

console.log('Missing prompts for core domains:');
console.log('=====================================\n');

if (missingTools.length === 0) {
  console.log('✅ All tools have prompts!\n');
} else {
  missingTools.forEach(t => {
    console.log(`  - ${t.displayName} (${t.mcpName})`);
    console.log(`    Domain: ${t.domain}`);
  });
  console.log(`\nTotal missing: ${missingTools.length}`);
}

console.log(`\nCore domains summary:`);
console.log(`  Total tools: ${targetTools.length}`);
console.log(`  Existing prompts: ${targetTools.length - missingTools.length}`);
console.log(`  Missing prompts: ${missingTools.length}`);
