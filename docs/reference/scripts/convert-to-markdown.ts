#!/usr/bin/env node

/**
 * @file Convert OpenAPI schema to Starlight-compatible markdown
 * @module docs/reference/scripts/convert-to-markdown
 *
 * @remarks
 * Generates individual markdown files for each tool organized by domain.
 * Output directory structure:
 *   src/content/docs/tools/
 *     app/
 *       index.md (domain overview)
 *       app-list.md (individual tools)
 *       app-get.md
 *       ...
 *     database/
 *       ...
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import type { ToolsManifest, MCPTool } from './schema.js';
import {
  generateMarkdown,
  generateDomainIndex,
  generateToolsReadme,
} from './markdown-template.js';
import { MCP_DOMAINS } from './schema.js';

/**
 * Converts tool name to markdown filename
 * e.g., 'mittwald_app_list' -> 'app-list.md'
 */
function toolNameToFilename(toolName: string): string {
  // Remove 'mittwald_' prefix if present
  let name = toolName;
  if (name.startsWith('mittwald_')) {
    name = name.substring(9); // Remove 'mittwald_'
  }

  // Replace underscores with hyphens
  return name.replace(/_/g, '-') + '.md';
}

/**
 * Ensures a directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || (error as any).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Main function to convert manifest to markdown
 */
async function main() {
  // Get current working directory (must be run from project root)
  const cwd = process.cwd();
  const manifestPath = join(cwd, 'docs/reference/tools-manifest.json');
  const outputBaseDir = join(cwd, 'docs/reference/src/content/docs/tools');

  console.log(`Reading manifest from ${manifestPath}`);

  // Read manifest
  const manifestContent = await readFile(manifestPath, 'utf-8');
  const manifest: ToolsManifest = JSON.parse(manifestContent);

  console.log(`Loaded manifest with ${manifest.totalTools} tools`);

  // Ensure output directory exists
  await ensureDir(outputBaseDir);

  let totalFilesWritten = 0;
  const domainCounts: Record<string, number> = {};

  // Generate markdown for each domain
  for (const domain of MCP_DOMAINS) {
    const tools = manifest.tools[domain] || [];

    if (tools.length === 0) {
      continue;
    }

    console.log(`\nGenerating markdown for domain: ${domain} (${tools.length} tools)`);
    domainCounts[domain] = tools.length;

    // Create domain directory
    const domainDir = join(outputBaseDir, domain);
    await ensureDir(domainDir);

    // Generate domain index
    const indexContent = generateDomainIndex(domain, tools);
    const indexPath = join(domainDir, 'index.md');
    await writeFile(indexPath, indexContent);
    console.log(`  Wrote domain index: ${domain}/index.md`);
    totalFilesWritten++;

    // Generate markdown for each tool
    for (const tool of tools) {
      const filename = toolNameToFilename(tool.name);
      const filePath = join(domainDir, filename);
      const content = generateMarkdown(tool, domain);

      await writeFile(filePath, content);
      totalFilesWritten++;
    }

    console.log(`  Generated ${tools.length} tool files for ${domain}`);
  }

  // Generate tools README
  const readmeContent = generateToolsReadme(manifest.totalTools, domainCounts);
  const readmePath = join(outputBaseDir, 'index.md');
  await ensureDir(dirname(readmePath));
  await writeFile(readmePath, readmeContent);
  console.log(`\nWrote main tools README: tools/index.md`);
  totalFilesWritten++;

  // Print summary
  console.log('\n=== Markdown Generation Summary ===');
  console.log(`Total files written: ${totalFilesWritten}`);
  console.log(`Domains: ${Object.keys(domainCounts).length}`);

  for (const [domain, count] of Object.entries(domainCounts).sort()) {
    console.log(`  ${domain.padEnd(15)} : ${count} tools + 1 index = ${count + 1} files`);
  }

  console.log(`\nOutput directory: ${outputBaseDir}`);
}

main().catch((error) => {
  console.error('Failed to convert to markdown:', error);
  process.exit(1);
});
