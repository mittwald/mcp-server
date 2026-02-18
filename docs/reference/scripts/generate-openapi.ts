#!/usr/bin/env node

/**
 * @file Generate OpenAPI 3.0 schema from tools manifest
 * @module docs/reference/scripts/generate-openapi
 *
 * @remarks
 * Converts the tools-manifest.json into a valid OpenAPI 3.0 specification.
 * The resulting OpenAPI spec can be used for API documentation, code generation,
 * and testing.
 */

import { readFile, writeFile } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import type { ToolsManifest, MCPTool } from './schema.js';
import {
  createOpenAPITemplate,
  createOpenAPIPathItem,
  type OpenAPISchema,
} from './openapi-template.js';
import { MCP_DOMAINS } from './schema.js';

/**
 * Converts a JSON Schema type to OpenAPI type
 */
function convertSchemaType(jsonSchemaType: string): string {
  const typeMap: Record<string, string> = {
    string: 'string',
    number: 'number',
    integer: 'integer',
    boolean: 'boolean',
    object: 'object',
    array: 'array',
  };

  return typeMap[jsonSchemaType] || 'string';
}

/**
 * Creates an OpenAPI request schema from tool parameters
 */
function createRequestSchema(tool: MCPTool): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const param of tool.parameters) {
    properties[param.name] = {
      type: convertSchemaType(param.type),
      description: param.description,
      ...(param.enum && { enum: param.enum }),
      ...(param.default !== undefined && { default: param.default }),
    };

    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    type: 'object',
    properties,
    ...(required.length > 0 && { required }),
  };
}

/**
 * Creates OpenAPI paths from tools
 */
function createOpenAPIPaths(tools: MCPTool[]): Record<string, any> {
  const paths: Record<string, any> = {};

  for (const tool of tools) {
    // Create path like /tools/{toolName}
    const pathKey = `/tools/${tool.name}`;
    const requestSchema = createRequestSchema(tool);

    paths[pathKey] = createOpenAPIPathItem(
      tool.name,
      tool.title,
      tool.description,
      tool.domain,
      requestSchema
    );
  }

  return paths;
}

/**
 * Creates OpenAPI tags from domains
 */
function createOpenAPITags(manifest: ToolsManifest): Array<{ name: string; description: string }> {
  const tags: Array<{ name: string; description: string }> = [];

  for (const domain of MCP_DOMAINS) {
    const metadata = manifest.domains[domain];
    if (metadata && metadata.toolCount > 0) {
      tags.push({
        name: domain,
        description: metadata.description,
      });
    }
  }

  // Add default tags
  tags.push(
    { name: 'Tools', description: 'MCP Tool definitions and operations' },
    { name: 'Domains', description: 'Tool domain information' },
    { name: 'Manifests', description: 'Tool manifest operations' }
  );

  return tags;
}

/**
 * Validates the generated OpenAPI schema
 */
function validateOpenAPISchema(schema: OpenAPISchema): boolean {
  // Check required fields
  if (!schema.openapi || !schema.info || !schema.paths) {
    console.error('Missing required OpenAPI fields');
    return false;
  }

  // Check that version format is correct
  if (!/^\d+\.\d+\.\d+$/.test(schema.openapi)) {
    console.error(`Invalid OpenAPI version: ${schema.openapi}`);
    return false;
  }

  // Check that all paths have POST operations
  for (const [path, pathItem] of Object.entries(schema.paths)) {
    if (!pathItem.post) {
      console.error(`Path ${path} missing POST operation`);
      return false;
    }
  }

  return true;
}

/**
 * Main function to generate OpenAPI schema
 */
async function main() {
  // Get current working directory (must be run from project root)
  const cwd = process.cwd();
  const manifestPath = join(cwd, 'docs/reference/tools-manifest.json');

  console.log(`Reading manifest from ${manifestPath}`);

  // Read manifest
  const manifestContent = await readFile(manifestPath, 'utf-8');
  const manifest: ToolsManifest = JSON.parse(manifestContent);

  console.log(`Loaded manifest with ${manifest.totalTools} tools`);

  // Create OpenAPI schema
  const openapi = createOpenAPITemplate();

  // Add paths from tools
  const allTools: MCPTool[] = [];
  for (const domain of MCP_DOMAINS) {
    allTools.push(...manifest.tools[domain] || []);
  }

  console.log(`Generating OpenAPI paths for ${allTools.length} tools`);
  openapi.paths = createOpenAPIPaths(allTools);

  // Add tags
  openapi.tags = createOpenAPITags(manifest);

  // Validate schema
  if (!validateOpenAPISchema(openapi)) {
    throw new Error('Generated OpenAPI schema failed validation');
  }

  // Write OpenAPI file
  const outputPath = join(cwd, 'docs/reference/openapi.json');
  await writeFile(outputPath, JSON.stringify(openapi, null, 2));
  console.log(`Wrote OpenAPI schema to ${outputPath}`);

  // Print summary
  console.log('\nOpenAPI Summary:');
  console.log(`  OpenAPI Version: ${openapi.openapi}`);
  console.log(`  Total Paths: ${Object.keys(openapi.paths).length}`);
  console.log(`  Total Tags: ${openapi.tags.length}`);
  console.log(`  Info Title: ${openapi.info.title}`);
  console.log(`  Servers: ${openapi.servers.length}`);
}

main().catch((error) => {
  console.error('Failed to generate OpenAPI schema:', error);
  process.exit(1);
});
