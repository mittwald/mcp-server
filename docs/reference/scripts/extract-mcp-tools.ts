#!/usr/bin/env node

/**
 * @file Extract MCP tool definitions from source files
 * @module docs/reference/scripts/extract-mcp-tools
 *
 * @remarks
 * Scans the /src/constants/tool/mittwald-cli directory and extracts tool
 * definitions into a tools-manifest.json file. Each tool definition file
 * exports a ToolRegistration object containing the tool metadata.
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, resolve, dirname, relative } from 'path';
import { pathToFileURL } from 'url';
import type { MCPTool, ToolsManifest, MCPDomain } from './schema.js';
import { MCP_DOMAINS, DOMAIN_TITLES, DOMAIN_DESCRIPTIONS } from './schema.js';

/**
 * Scans a directory recursively for tool definition files
 */
async function scanDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        files.push(...(await scanDirectory(fullPath)));
      } else if (entry.isFile() && entry.name.endsWith('-cli.ts')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }

  return files;
}

/**
 * Extracts domain from file path
 * e.g., /src/constants/tool/mittwald-cli/app/list-cli.ts -> 'app'
 */
function extractDomain(filePath: string): MCPDomain | null {
  const parts = filePath.split('/');
  const toolDirIndex = parts.lastIndexOf('mittwald-cli');

  if (toolDirIndex === -1 || toolDirIndex + 1 >= parts.length) {
    return null;
  }

  const potentialDomain = parts[toolDirIndex + 1];
  if (MCP_DOMAINS.includes(potentialDomain as MCPDomain)) {
    return potentialDomain as MCPDomain;
  }

  return null;
}

/**
 * Dynamically imports a tool definition file and extracts the tool
 */
async function extractToolFromFile(filePath: string): Promise<MCPTool | null> {
  try {
    const domain = extractDomain(filePath);
    if (!domain) {
      // Skip files with unrecognized domains
      return null;
    }

    // Skip index files (they're not tool definitions)
    if (filePath.endsWith('index-cli.ts')) {
      return null;
    }

    // Load the file
    const fileUrl = pathToFileURL(filePath).href;
    const module = await import(fileUrl);
    const registration = module.default;

    if (!registration || !registration.tool) {
      // Skip files that don't have a tool registration
      return null;
    }

    const toolDef = registration.tool;

    // Extract parameters from inputSchema
    const parameters = [];
    if (toolDef.inputSchema && toolDef.inputSchema.properties) {
      for (const [name, schema] of Object.entries(toolDef.inputSchema.properties)) {
        const schemaDef = schema as Record<string, unknown>;
        parameters.push({
          name,
          type: (schemaDef.type as string) || 'string',
          description: (schemaDef.description as string) || '',
          required: toolDef.inputSchema.required?.includes(name) || false,
          enum: (schemaDef.enum as string[]) || undefined,
          default: schemaDef.default,
        });
      }
    }

    // Create MCPTool object
    const tool: MCPTool = {
      name: toolDef.name,
      title: toolDef.title || toolDef.name,
      description: toolDef.description || '',
      domain,
      parameters,
      returnType: {
        type: 'object',
        description: 'Tool execution result with status, message, and data',
        example: {
          status: 'success',
          message: 'Operation completed successfully',
          data: null,
          metadata: {
            durationMs: 0,
          },
        },
      },
      requiresAuth: true,
      requiredScopes: [],
      tags: [domain],
    };

    return tool;
  } catch (error) {
    console.error(`Error extracting tool from ${filePath}:`, error);
    return null;
  }
}

/**
 * Creates domain metadata
 */
function createDomainMetadata(
  domain: MCPDomain,
  toolCount: number
): Record<MCPDomain, any> {
  return {
    [domain]: {
      name: domain,
      title: DOMAIN_TITLES[domain],
      description: DOMAIN_DESCRIPTIONS[domain],
      toolCount,
    },
  };
}

/**
 * Main function to extract all tools
 */
async function main() {
  // Get current working directory (must be run from project root)
  const cwd = process.cwd();
  const toolsDir = join(cwd, 'src/constants/tool/mittwald-cli');

  console.log(`Scanning tools directory: ${toolsDir}`);

  // Scan for tool files
  const toolFiles = await scanDirectory(toolsDir);
  console.log(`Found ${toolFiles.length} tool definition files`);

  // Extract tools from files
  const tools: MCPTool[] = [];
  for (const filePath of toolFiles) {
    const tool = await extractToolFromFile(filePath);
    if (tool) {
      tools.push(tool);
    }
  }

  console.log(`Extracted ${tools.length} tools`);

  // Organize tools by domain
  const toolsByDomain: Record<MCPDomain, MCPTool[]> = {};
  const domainMetadata: Record<MCPDomain, any> = {};

  for (const domain of MCP_DOMAINS) {
    toolsByDomain[domain] = [];
  }

  for (const tool of tools) {
    toolsByDomain[tool.domain].push(tool);
  }

  // Create domain metadata
  for (const domain of MCP_DOMAINS) {
    const count = toolsByDomain[domain].length;
    domainMetadata[domain] = {
      name: domain,
      title: DOMAIN_TITLES[domain],
      description: DOMAIN_DESCRIPTIONS[domain],
      toolCount: count,
      tags: [domain],
    };
  }

  // Create manifest
  const manifest: ToolsManifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalTools: tools.length,
    tools: toolsByDomain as any,
    domains: domainMetadata as any,
  };

  // Write manifest file
  const outputPath = join(cwd, 'docs/reference/tools-manifest.json');
  await writeFile(outputPath, JSON.stringify(manifest, null, 2));
  console.log(`Wrote manifest to ${outputPath}`);

  // Print summary
  console.log('\nTool Summary by Domain:');
  for (const domain of MCP_DOMAINS) {
    const count = toolsByDomain[domain].length;
    if (count > 0) {
      console.log(`  ${domain.padEnd(15)} : ${count} tools`);
    }
  }

  console.log(`\nTotal: ${tools.length} tools extracted`);
}

main().catch((error) => {
  console.error('Failed to extract tools:', error);
  process.exit(1);
});
