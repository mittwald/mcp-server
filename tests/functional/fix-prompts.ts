#!/usr/bin/env tsx
/**
 * Add autonomous tool usage instruction to all use case prompts
 */
import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';

const INSTRUCTION = " Use the available Mittwald MCP tools to complete this - discover any needed information yourself and make reasonable choices for parameters I didn't specify. Do not ask me questions - just use the tools to get it done.";

async function fixPrompts() {
  const files = await glob('use-case-library/**/*.json');
  console.log(`Found ${files.length} use case files`);

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const useCase = JSON.parse(content);

    // Skip if already has the instruction
    if (useCase.prompt.includes('Do not ask me questions')) {
      console.log(`✓ ${file} - already updated`);
      continue;
    }

    // Add instruction to prompt
    useCase.prompt = useCase.prompt.trim() + INSTRUCTION;

    // Write back
    await writeFile(file, JSON.stringify(useCase, null, 2) + '\n');
    console.log(`✓ ${file} - updated`);
  }

  console.log('\nAll prompts updated!');
}

fixPrompts().catch(console.error);
