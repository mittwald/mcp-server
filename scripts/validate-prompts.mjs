#!/usr/bin/env node
/**
 * Validate eval prompts against v2.0.0 template requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, '..', 'evals', 'prompts');

const VALIDATION_RULES = [
  {
    name: 'Has CALL tool directly language',
    check: (prompt) => prompt.input.prompt.includes('**IMPORTANT**: You must CALL the MCP tool directly')
  },
  {
    name: 'Has DO NOT write script warning',
    check: (prompt) => prompt.input.prompt.includes('**DO NOT**:')
  },
  {
    name: 'Has DO section',
    check: (prompt) => prompt.input.prompt.includes('**DO**:')
  },
  {
    name: 'eval_version is 2.0.0',
    check: (prompt) => prompt.metadata?.eval_version === '2.0.0'
  },
  {
    name: 'Has valid domain',
    check: (prompt) => typeof prompt.metadata?.domain === 'string' && prompt.metadata.domain.length > 0
  },
  {
    name: 'Has valid tier (0-4)',
    check: (prompt) => {
      const tier = prompt.metadata?.tier;
      return typeof tier === 'number' && tier >= 0 && tier <= 4;
    }
  },
  {
    name: 'Has ISO 8601 created_at',
    check: (prompt) => {
      const date = prompt.metadata?.created_at;
      return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(date);
    }
  },
  {
    name: 'Has tags array',
    check: (prompt) => Array.isArray(prompt.metadata?.tags) && prompt.metadata.tags.length >= 2
  },
  {
    name: 'Has success_indicators array',
    check: (prompt) => Array.isArray(prompt.metadata?.success_indicators) && prompt.metadata.success_indicators.length > 0
  },
  {
    name: 'Has self_assessment_required true',
    check: (prompt) => prompt.metadata?.self_assessment_required === true
  },
  {
    name: 'Has self-assessment markers in prompt',
    check: (prompt) => prompt.input.prompt.includes('<!-- SELF_ASSESSMENT_START -->')
  }
];

function validatePrompt(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const prompt = JSON.parse(content);

  const results = VALIDATION_RULES.map(rule => ({
    rule: rule.name,
    passed: rule.check(prompt)
  }));

  const allPassed = results.every(r => r.passed);

  return {
    filePath,
    toolName: prompt.input?.display_name || path.basename(filePath),
    allPassed,
    results
  };
}

function scanDirectory(dir, results = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && item !== '_archived') {
      scanDirectory(fullPath, results);
    } else if (item.endsWith('.json')) {
      try {
        const result = validatePrompt(fullPath);
        results.push(result);
      } catch (err) {
        console.warn(`⚠️  Could not validate ${fullPath}: ${err.message}`);
      }
    }
  }

  return results;
}

function main() {
  console.log('🔍 Validating eval prompts against v2.0.0 template...\n');

  const results = scanDirectory(PROMPTS_DIR);

  const passed = results.filter(r => r.allPassed);
  const failed = results.filter(r => !r.allPassed);

  console.log(`✅ Passed: ${passed.length}/${results.length}`);

  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}/${results.length}\n`);
    console.log('Failed prompts:');

    failed.forEach(f => {
      console.log(`\n  ${f.toolName} (${path.relative(PROMPTS_DIR, f.filePath)})`);
      f.results.filter(r => !r.passed).forEach(r => {
        console.log(`    ❌ ${r.rule}`);
      });
    });
  } else {
    console.log('🎉 All prompts passed validation!');
  }

  console.log(`\nTotal prompts validated: ${results.length}`);
}

main();
