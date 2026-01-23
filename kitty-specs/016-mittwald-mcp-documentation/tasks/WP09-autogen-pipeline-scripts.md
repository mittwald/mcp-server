---
work_package_id: WP09
title: Auto-Generation Pipeline - Schema & Scripts
lane: "doing"
dependencies: []
subtasks:
- T017
- T018
- T019
- T020
phase: Phase D - Auto-Generation Pipeline
assignee: ''
agent: "claude"
shell_pid: "38760"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2025-01-23T00:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP09 – Auto-Generation Pipeline - Schema & Scripts

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately.
- **You must address all feedback** before your work is complete.
- **Mark as acknowledged**: When you understand the feedback, update `review_status: acknowledged` in the frontmatter.

---

## Review Feedback

*[This section is empty initially. Reviewers will populate it if work is returned from review.]*

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `` `<div>` ``, `` `<script>` ``
Use language identifiers in code blocks: ````python`, ````bash`

---

## Objectives & Success Criteria

**Goal**: Design the auto-generation schema and implement scripts to extract tool metadata from source code, generate OpenAPI schema, and convert to markdown reference pages.

**Success Criteria**:
- ✅ Auto-generation schema defined (tools-manifest.json structure, TypeScript interfaces)
- ✅ Tool handler extraction script implemented and tested
- ✅ OpenAPI schema generation script implemented
- ✅ Markdown conversion script implemented
- ✅ All 115 tools extracted from `/src/handlers/tools/`
- ✅ tools-manifest.json generated with complete metadata
- ✅ openapi.json generated with valid OpenAPI 3.0 schema
- ✅ 115 markdown reference pages generated and organized by domain
- ✅ Generation scripts are documented and maintainable

---

## Context & Constraints

**Prerequisites**: WP02 (Site 2 must exist with `scripts/` folder)

**Related Documents**:
- Spec: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/spec.md` (FR-016 to FR-025: Reference documentation)
- Plan: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/plan.md` (Auto-generation pipeline)
- Data Model: `/Users/robert/Code/mittwald-mcp/kitty-specs/016-mittwald-mcp-documentation/data-model.md` (MCPTool entity)

**Architectural Context**:
- **Source**: Tool handlers in `/Users/robert/Code/mittwald-mcp/src/handlers/tools/`
- **Target**: 115 markdown pages in `docs/reference/src/content/docs/tools/{domain}/`
- **Pipeline**: Extract → OpenAPI → Markdown

**Why this approach?**
- **Always in sync**: Docs auto-generate from source code
- **Scalable**: New tools automatically documented
- **Structured**: OpenAPI enables future integrations (Swagger UI, client SDKs)
- **Maintainable**: Scripts are testable and version-controlled

**Constraints**:
- Must handle all 115 tools across 14 domains
- Output must be valid Starlight markdown
- Must include frontmatter for Starlight navigation
- Must preserve tool examples (if present in handlers)

---

## Subtasks & Detailed Guidance

### Subtask T017 – Design Auto-Generation Schema and Contracts

**Purpose**: Define data structures and contracts for the auto-generation pipeline.

**Steps**:

1. **Analyze tool handler structure**:

   Example handler file: `/Users/robert/Code/mittwald-mcp/src/handlers/tools/apps/app-create.ts` (or similar)

   Read a sample handler to understand:
   - How tool name is defined
   - How parameters are specified (TypeScript interface? JSDoc?)
   - How return type is specified
   - How examples are documented (if at all)

2. **Define tools-manifest.json schema**:

   File: `docs/reference/scripts/schema.ts`

   ```typescript
   /**
    * Auto-Generation Pipeline Schema
    * Defines data structures for tool extraction and documentation generation
    */

   export interface ToolsManifest {
     version: string;  // Schema version (e.g., "1.0.0")
     generatedAt: string;  // ISO timestamp
     toolCount: number;  // Total tools extracted
     tools: MCPTool[];
   }

   export interface MCPTool {
     id: string;  // Unique identifier (e.g., "app-create")
     name: string;  // Display name (e.g., "app/create")
     domain: MCPDomain;
     description: string;
     handler: string;  // Path to handler file (for reference)
     parameters: ToolParameter[];
     returnType: ReturnType;
     examples: ToolExample[];
   }

   export type MCPDomain =
     | 'apps'
     | 'backups'
     | 'certificates'
     | 'containers'
     | 'context'
     | 'databases'
     | 'domains-mail'
     | 'identity'
     | 'misc'
     | 'organization'
     | 'project-foundation'
     | 'sftp'
     | 'ssh'
     | 'automation';

   export interface ToolParameter {
     name: string;
     type: string;  // e.g., 'string', 'number', 'object'
     required: boolean;
     description: string;
     default?: any;
     schema?: Record<string, any>;  // For complex types
   }

   export interface ReturnType {
     type: string;
     description: string;
     schema?: Record<string, any>;  // For complex return types
   }

   export interface ToolExample {
     title: string;
     description?: string;
     code: string;  // Example invocation
     output?: string;  // Expected output
   }
   ```

3. **Define OpenAPI schema structure**:

   File: `docs/reference/scripts/openapi-template.ts`

   ```typescript
   import type { OpenAPIV3 } from 'openapi-types';

   export function createOpenAPITemplate(): OpenAPIV3.Document {
     return {
       openapi: '3.0.0',
       info: {
         title: 'Mittwald MCP Tools',
         description: 'Complete reference for all 115 Mittwald MCP tools',
         version: '1.0.0',
         contact: {
           name: 'Mittwald Support',
           email: 'support@mittwald.de',
           url: 'https://mittwald.de',
         },
       },
       servers: [
         {
           url: 'https://mittwald-mcp-fly2.fly.dev/mcp',
           description: 'Mittwald MCP Server (Production)',
         },
       ],
       paths: {},  // Populated from tools-manifest.json
       components: {
         schemas: {},  // Parameter and return type schemas
       },
     };
   }
   ```

4. **Define markdown template structure**:

   File: `docs/reference/scripts/markdown-template.ts`

   ```typescript
   import type { MCPTool } from './schema';

   export function generateToolMarkdown(tool: MCPTool): string {
     return `---
   title: ${tool.name}
   description: ${tool.description}
   sidebar:
     order: ${tool.id}
   ---

   # ${tool.name}

   > **Domain**: ${tool.domain}

   ## Description

   ${tool.description}

   ## Syntax

   \`\`\`
   ${tool.name}(${tool.parameters.map(p => p.name).join(', ')})
   \`\`\`

   ## Parameters

   ${generateParametersTable(tool.parameters)}

   ## Return Value

   **Type**: \`${tool.returnType.type}\`

   ${tool.returnType.description}

   ${generateReturnSchema(tool.returnType)}

   ## Examples

   ${generateExamples(tool.examples)}

   ## Related Tools

   ${generateRelatedTools(tool.domain)}

   ## Used In

   ${generateCaseStudyReferences(tool.id)}
   `;
   }

   function generateParametersTable(params: ToolParameter[]): string {
     if (params.length === 0) return '*This tool has no parameters.*';

     return `
   | Parameter | Type | Required | Description | Default |
   |-----------|------|----------|-------------|---------|
   ${params.map(p => `| \`${p.name}\` | \`${p.type}\` | ${p.required ? 'Yes' : 'No'} | ${p.description} | ${p.default ?? '-'} |`).join('\n')}
   `;
   }

   // ... other helper functions
   ```

5. **Document the pipeline data flow**:

   File: `docs/reference/scripts/README.md`

   ```markdown
   # Auto-Generation Pipeline

   This directory contains scripts that auto-generate reference documentation for all 115 Mittwald MCP tools.

   ## Pipeline Overview

   ```
   /src/handlers/tools/*.ts
         ↓
   [extract-mcp-tools.ts]
         ↓
   tools-manifest.json
         ↓
   [generate-openapi.ts]
         ↓
   openapi.json
         ↓
   [convert-to-markdown.ts]
         ↓
   src/content/docs/tools/{domain}/{tool}.md (115 files)
   ```

   ## Scripts

   ### 1. extract-mcp-tools.ts
   **Purpose**: Parse tool handler files and extract metadata

   **Input**: `/src/handlers/tools/` directory
   **Output**: `tools-manifest.json`
   **Run**: `npx tsx scripts/extract-mcp-tools.ts`

   ### 2. generate-openapi.ts
   **Purpose**: Convert tools manifest to OpenAPI 3.0 schema

   **Input**: `tools-manifest.json`
   **Output**: `openapi.json`
   **Run**: `npx tsx scripts/generate-openapi.ts`

   ### 3. convert-to-markdown.ts
   **Purpose**: Generate markdown reference pages from OpenAPI schema

   **Input**: `openapi.json`
   **Output**: `src/content/docs/tools/{domain}/{tool}.md` (115 files)
   **Run**: `npx tsx scripts/convert-to-markdown.ts`

   ## Usage

   **Generate all reference docs**:
   ```bash
   npm run generate-references
   ```

   This runs all three scripts in sequence.

   **Validate coverage**:
   ```bash
   npm run validate-references
   ```

   Verifies all 115 tools are present and correctly formatted.

   ## Data Schema

   See `schema.ts` for TypeScript interfaces defining:
   - `ToolsManifest`
   - `MCPTool`
   - `ToolParameter`
   - `ReturnType`
   - `ToolExample`

   ## Maintenance

   When adding new MCP tools:
   1. Add tool handler to `/src/handlers/tools/{domain}/`
   2. Re-run `npm run generate-references`
   3. New tool documentation appears automatically

   No manual documentation updates needed!
   ```

**Duration**: 3-4 hours to design schemas and document

**Files Created**:
- `docs/reference/scripts/schema.ts` (new)
- `docs/reference/scripts/openapi-template.ts` (new)
- `docs/reference/scripts/markdown-template.ts` (new)
- `docs/reference/scripts/README.md` (new)

**Parallel?**: Yes - can run in parallel with WP05-WP08 (conceptual work)

**Notes**:
- Schema design is foundational for T018-T020
- TypeScript interfaces provide type safety
- Templates ensure consistent output

---

### Subtask T018 – Implement Tool Handler Extraction Script

**Purpose**: Parse tool handler files in `/src/handlers/tools/` and extract metadata for documentation generation.

**Steps**:

1. **Install dependencies** (if needed):

   ```bash
   cd docs/reference
   npm install --save-dev @types/node glob fast-glob
   ```

2. **Create extraction script**:

   File: `docs/reference/scripts/extract-mcp-tools.ts`

   ```typescript
   #!/usr/bin/env tsx

   import { glob } from 'glob';
   import * as fs from 'fs/promises';
   import * as path from 'path';
   import type { ToolsManifest, MCPTool, MCPDomain } from './schema';

   /**
    * Extract MCP tool metadata from handler files
    *
    * Scans /src/handlers/tools/ directory and extracts:
    * - Tool name, domain, description
    * - Parameters (from TypeScript types or JSDoc)
    * - Return type
    * - Examples (from JSDoc @example blocks)
    */

   const HANDLERS_DIR = path.join(__dirname, '../../../src/handlers/tools');
   const OUTPUT_FILE = path.join(__dirname, '../tools-manifest.json');

   // Domain mapping (folder name → domain ID)
   const DOMAIN_MAP: Record<string, MCPDomain> = {
     'apps': 'apps',
     'backups': 'backups',
     'certificates': 'certificates',
     'containers': 'containers',
     'context': 'context',
     'databases': 'databases',
     'domains-mail': 'domains-mail',
     'identity': 'identity',
     'misc': 'misc',
     'organization': 'organization',
     'project-foundation': 'project-foundation',
     'sftp': 'sftp',
     'ssh': 'ssh',
     'automation': 'automation',
   };

   async function extractTools(): Promise<ToolsManifest> {
     console.log('Scanning for tool handlers...');

     // Find all TypeScript files in handlers directory
     const handlerFiles = await glob(`${HANDLERS_DIR}/**/*.ts`);
     console.log(`Found ${handlerFiles.length} handler files`);

     const tools: MCPTool[] = [];

     for (const handlerPath of handlerFiles) {
       try {
         // Extract domain from path
         const relativePath = path.relative(HANDLERS_DIR, handlerPath);
         const domainFolder = relativePath.split(path.sep)[0];
         const domain = DOMAIN_MAP[domainFolder];

         if (!domain) {
           console.warn(`Unknown domain: ${domainFolder} (file: ${handlerPath})`);
           continue;
         }

         // Read handler file
         const content = await fs.readFile(handlerPath, 'utf-8');

         // Extract tool metadata
         const tool = await extractToolFromHandler(content, handlerPath, domain);

         if (tool) {
           tools.push(tool);
           console.log(`  ✓ Extracted: ${tool.name} (${tool.domain})`);
         }
       } catch (error) {
         console.error(`Error processing ${handlerPath}:`, error);
       }
     }

     console.log(`\nExtracted ${tools.length} tools`);

     const manifest: ToolsManifest = {
       version: '1.0.0',
       generatedAt: new Date().toISOString(),
       toolCount: tools.length,
       tools,
     };

     return manifest;
   }

   async function extractToolFromHandler(
     content: string,
     handlerPath: string,
     domain: MCPDomain
   ): Promise<MCPTool | null> {
     // TODO: Implement extraction logic
     //
     // Strategy 1: Parse TypeScript using TypeScript Compiler API
     // Strategy 2: Use regex to extract JSDoc comments and types
     // Strategy 3: Look for exported objects with tool metadata
     //
     // For now, use simple regex-based extraction:

     // Extract tool name (from export or file name)
     const fileName = path.basename(handlerPath, '.ts');
     const toolName = fileName.replace(/-/g, '/'); // e.g., "app-create" → "app/create"

     // Extract description (from JSDoc comment or export)
     const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/);
     const description = descriptionMatch?.[1] || 'No description available';

     // Extract parameters (simplified - enhance in implementation)
     // Look for interface or type definition
     const parameters = extractParameters(content);

     // Extract return type
     const returnType = extractReturnType(content);

     // Extract examples (from JSDoc @example blocks)
     const examples = extractExamples(content);

     const tool: MCPTool = {
       id: fileName,
       name: toolName,
       domain,
       description,
       handler: path.relative(process.cwd(), handlerPath),
       parameters,
       returnType,
       examples,
     };

     return tool;
   }

   function extractParameters(content: string): ToolParameter[] {
     // TODO: Implement parameter extraction
     // Strategy:
     // 1. Look for TypeScript interface (export interface AppCreateParams)
     // 2. Parse JSDoc @param tags
     // 3. Look for Zod schema definitions
     //
     // Return extracted parameters
     return [];
   }

   function extractReturnType(content: string): ReturnType {
     // TODO: Implement return type extraction
     // Look for:
     // - Function return type annotation
     // - JSDoc @returns tag
     // - Type alias or interface for return value
     return {
       type: 'object',
       description: 'Tool execution result',
     };
   }

   function extractExamples(content: string): ToolExample[] {
     // TODO: Extract JSDoc @example blocks
     // Look for:
     // /**
     //  * @example
     //  * const result = await appCreate({projectId: 'abc', ...});
     //  */
     return [];
   }

   // Main execution
   async function main() {
     try {
       const manifest = await extractTools();

       // Write to output file
       await fs.writeFile(
         OUTPUT_FILE,
         JSON.stringify(manifest, null, 2),
         'utf-8'
       );

       console.log(`\n✅ Generated: ${OUTPUT_FILE}`);
       console.log(`   Tools: ${manifest.toolCount}`);

       // Summary by domain
       const byDomain = manifest.tools.reduce((acc, tool) => {
         acc[tool.domain] = (acc[tool.domain] || 0) + 1;
         return acc;
       }, {} as Record<string, number>);

       console.log('\nTools by domain:');
       Object.entries(byDomain)
         .sort(([a], [b]) => a.localeCompare(b))
         .forEach(([domain, count]) => {
           console.log(`  ${domain}: ${count}`);
         });

     } catch (error) {
       console.error('Extraction failed:', error);
       process.exit(1);
     }
   }

   main();
   ```

   **Implementation notes**:
   - Start with simple regex-based extraction
   - Enhance with TypeScript Compiler API if needed
   - Handle edge cases (tools without descriptions, complex parameter types)
   - Validate extracted data

3. **Test extraction script** with a few sample handlers:

   ```bash
   cd docs/reference
   npx tsx scripts/extract-mcp-tools.ts
   ```

   **Expected output**:
   ```
   Scanning for tool handlers...
   Found 115 handler files
     ✓ Extracted: app/create (apps)
     ✓ Extracted: app/delete (apps)
     ... (113 more)

   Extracted 115 tools

   ✅ Generated: scripts/tools-manifest.json
      Tools: 115

   Tools by domain:
     apps: 8
     automation: 9
     backups: 8
     ...
   ```

4. **Inspect `tools-manifest.json`**:

   ```bash
   cat docs/reference/tools-manifest.json | head -50
   ```

   **Verify structure**:
   - All 115 tools present
   - Each tool has id, name, domain, description
   - Parameters and return types extracted (even if incomplete)

**Duration**: 6-8 hours (complex parsing logic)

**Files Created**:
- `docs/reference/scripts/extract-mcp-tools.ts` (new)
- `docs/reference/tools-manifest.json` (generated)

**Parallel?**: No - depends on T017 (schema design)

**Notes**:
- Start simple (regex), enhance iteratively
- Handle errors gracefully (skip problematic handlers, log warnings)
- Validate output: all 115 tools should be extracted

---

### Subtask T019 – Implement OpenAPI Schema Generation Script

**Purpose**: Convert tools-manifest.json to a valid OpenAPI 3.0 schema for standardization and potential future use (Swagger UI, client SDKs).

**Steps**:

1. **Create OpenAPI generation script**:

   File: `docs/reference/scripts/generate-openapi.ts`

   ```typescript
   #!/usr/bin/env tsx

   import * as fs from 'fs/promises';
   import * as path from 'path';
   import type { ToolsManifest, MCPTool } from './schema';
   import { createOpenAPITemplate } from './openapi-template';
   import type { OpenAPIV3 } from 'openapi-types';

   const MANIFEST_FILE = path.join(__dirname, '../tools-manifest.json');
   const OUTPUT_FILE = path.join(__dirname, '../openapi.json');

   async function generateOpenAPI() {
     console.log('Generating OpenAPI schema...');

     // Read tools manifest
     const manifestContent = await fs.readFile(MANIFEST_FILE, 'utf-8');
     const manifest: ToolsManifest = JSON.parse(manifestContent);

     console.log(`Processing ${manifest.toolCount} tools...`);

     // Create OpenAPI document
     const openapi = createOpenAPITemplate();

     // Add each tool as a path
     for (const tool of manifest.tools) {
       const pathKey = `/${tool.name}`;

       openapi.paths[pathKey] = {
         post: {
           summary: tool.description,
           tags: [tool.domain],
           operationId: tool.id,
           requestBody: {
             required: true,
             content: {
               'application/json': {
                 schema: {
                   type: 'object',
                   properties: tool.parameters.reduce((props, param) => {
                     props[param.name] = {
                       type: param.type as any,
                       description: param.description,
                     };
                     if (param.schema) {
                       props[param.name] = param.schema;
                     }
                     return props;
                   }, {} as Record<string, any>),
                   required: tool.parameters
                     .filter(p => p.required)
                     .map(p => p.name),
                 },
               },
             },
           },
           responses: {
             '200': {
               description: 'Success',
               content: {
                 'application/json': {
                   schema: tool.returnType.schema || {
                     type: tool.returnType.type as any,
                     description: tool.returnType.description,
                   },
                 },
               },
             },
             '400': {
               description: 'Invalid parameters',
             },
             '401': {
               description: 'Unauthorized - OAuth token missing or invalid',
             },
             '403': {
               description: 'Forbidden - Insufficient OAuth scopes',
             },
             '500': {
               description: 'Internal server error',
             },
           },
           // Add examples if present
           ...(tool.examples.length > 0 && {
             'x-code-samples': tool.examples.map(ex => ({
               lang: 'Shell',
               source: ex.code,
               label: ex.title,
             })),
           }),
         },
       };
     }

     // Add domain tags for organization
     const domains = [...new Set(manifest.tools.map(t => t.domain))];
     openapi.tags = domains.map(domain => ({
       name: domain,
       description: `Tools in the ${domain} domain`,
     }));

     return openapi;
   }

   async function main() {
     try {
       const openapi = await generateOpenAPI();

       // Write to output file
       await fs.writeFile(
         OUTPUT_FILE,
         JSON.stringify(openapi, null, 2),
         'utf-8'
       );

       console.log(`\n✅ Generated: ${OUTPUT_FILE}`);
       console.log(`   Paths: ${Object.keys(openapi.paths).length}`);
       console.log(`   Tags: ${openapi.tags?.length || 0} domains`);

     } catch (error) {
       console.error('OpenAPI generation failed:', error);
       process.exit(1);
     }
   }

   main();
   ```

2. **Test OpenAPI generation**:

   ```bash
   cd docs/reference
   npx tsx scripts/generate-openapi.ts
   ```

   **Expected output**:
   ```
   Generating OpenAPI schema...
   Processing 115 tools...

   ✅ Generated: scripts/openapi.json
      Paths: 115
      Tags: 14 domains
   ```

3. **Validate OpenAPI schema**:

   ```bash
   npm install --save-dev @apidevtools/swagger-cli
   npx swagger-cli validate openapi.json
   ```

   **Expected output**:
   ```
   openapi.json is valid
   ```

4. **Inspect OpenAPI schema**:

   ```bash
   cat openapi.json | head -100
   ```

   **Verify**:
   - All 115 tools present as paths
   - Parameters correctly defined
   - Response schemas present
   - Tags (domains) defined

**Duration**: 4-5 hours to implement and test

**Files Created**:
- `docs/reference/scripts/generate-openapi.ts` (new)
- `docs/reference/openapi.json` (generated)

**Parallel?**: No - depends on T017, T018

**Notes**:
- OpenAPI schema is useful beyond markdown generation
- Could enable Swagger UI for interactive API exploration (future enhancement)
- Validation ensures schema correctness

---

### Subtask T020 – Implement Markdown Conversion Script

**Purpose**: Convert OpenAPI schema to Starlight-compatible markdown reference pages organized by domain.

**Steps**:

1. **Create markdown conversion script**:

   File: `docs/reference/scripts/convert-to-markdown.ts`

   ```typescript
   #!/usr/bin/env tsx

   import * as fs from 'fs/promises';
   import * as path from 'path';
   import type { OpenAPIV3 } from 'openapi-types';
   import type { MCPDomain } from './schema';

   const OPENAPI_FILE = path.join(__dirname, '../openapi.json');
   const OUTPUT_DIR = path.join(__dirname, '../src/content/docs/tools');

   interface ToolMetadata {
     id: string;
     name: string;
     domain: string;
     description: string;
     parameters: any[];
     returnType: any;
     examples: any[];
   }

   async function convertToMarkdown() {
     console.log('Converting OpenAPI to markdown...');

     // Read OpenAPI schema
     const openapiContent = await fs.readFile(OPENAPI_FILE, 'utf-8');
     const openapi: OpenAPIV3.Document = JSON.parse(openapiContent);

     console.log(`Processing ${Object.keys(openapi.paths).length} paths...`);

     // Ensure output directory exists
     await fs.mkdir(OUTPUT_DIR, { recursive: true });

     // Process each tool path
     for (const [pathKey, pathItem] of Object.entries(openapi.paths)) {
       const operation = (pathItem as any).post;
       if (!operation) continue;

       // Extract metadata
       const toolName = pathKey.substring(1); // Remove leading /
       const domain = operation.tags?.[0] || 'misc';
       const toolId = operation.operationId || toolName.replace('/', '-');

       // Generate markdown
       const markdown = await generateToolMarkdown({
         id: toolId,
         name: toolName,
         domain,
         description: operation.summary || 'No description',
         parameters: extractParameters(operation),
         returnType: extractReturnType(operation),
         examples: operation['x-code-samples'] || [],
       });

       // Write to domain-organized file
       const domainDir = path.join(OUTPUT_DIR, domain);
       await fs.mkdir(domainDir, { recursive: true });

       const fileName = `${toolId}.md`;
       const filePath = path.join(domainDir, fileName);

       await fs.writeFile(filePath, markdown, 'utf-8');
       console.log(`  ✓ Generated: tools/${domain}/${fileName}`);
     }

     console.log(`\n✅ Markdown generation complete`);
   }

   function extractParameters(operation: any): any[] {
     const requestBody = operation.requestBody?.content?.['application/json']?.schema;
     if (!requestBody?.properties) return [];

     const required = requestBody.required || [];

     return Object.entries(requestBody.properties).map(([name, schema]: [string, any]) => ({
       name,
       type: schema.type || 'object',
       required: required.includes(name),
       description: schema.description || '',
       default: schema.default,
     }));
   }

   function extractReturnType(operation: any): any {
     const response = operation.responses?.['200']?.content?.['application/json']?.schema;
     return {
       type: response?.type || 'object',
       description: operation.responses?.['200']?.description || 'Success',
       schema: response,
     };
   }

   async function generateToolMarkdown(tool: ToolMetadata): Promise<string> {
     return `---
   title: ${tool.name}
   description: ${tool.description}
   ---

   # ${tool.name}

   > **Domain**: ${tool.domain}

   ## Description

   ${tool.description}

   ## Syntax

   \`\`\`
   ${tool.name}(${tool.parameters.map(p => p.name).join(', ')})
   \`\`\`

   ## Parameters

   ${generateParametersTable(tool.parameters)}

   ## Return Value

   **Type**: \`${tool.returnType.type}\`

   ${tool.returnType.description}

   ${tool.examples.length > 0 ? `## Examples\n\n${generateExamples(tool.examples)}` : ''}

   ## Related Tools

   See all [${tool.domain} tools](/tools/${tool.domain}/)

   ## Back to Reference

   [← Tool Reference Home](/reference/)
   `;
   }

   function generateParametersTable(params: any[]): string {
     if (params.length === 0) {
       return '*This tool requires no parameters.*';
     }

     const header = '| Parameter | Type | Required | Description | Default |\n|-----------|------|----------|-------------|---------|';
     const rows = params.map(p =>
       `| \`${p.name}\` | \`${p.type}\` | ${p.required ? 'Yes' : 'No'} | ${p.description || '-'} | ${p.default !== undefined ? `\`${JSON.stringify(p.default)}\`` : '-'} |`
     );

     return [header, ...rows].join('\n');
   }

   function generateExamples(examples: any[]): string {
     return examples.map(ex => `
   ### ${ex.label || 'Example'}

   \`\`\`${ex.lang || 'bash'}
   ${ex.source}
   \`\`\`
   `).join('\n');
   }

   // Main
   async function main() {
     try {
       await convertToMarkdown();
     } catch (error) {
       console.error('Markdown conversion failed:', error);
       process.exit(1);
     }
   }

   main();
   ```

2. **Test markdown conversion**:

   ```bash
   cd docs/reference
   npx tsx scripts/convert-to-markdown.ts
   ```

   **Expected output**:
   ```
   Converting OpenAPI to markdown...
   Processing 115 paths...
     ✓ Generated: tools/apps/app-create.md
     ✓ Generated: tools/apps/app-delete.md
     ... (113 more)

   ✅ Markdown generation complete
   ```

3. **Verify markdown output**:

   ```bash
   ls -R src/content/docs/tools/
   ```

   **Expected structure**:
   ```
   tools/
   ├── apps/
   │   ├── app-create.md
   │   ├── app-delete.md
   │   └── ... (6 more)
   ├── backups/
   │   └── ... (8 files)
   ├── databases/
   │   └── ... (14 files)
   └── ... (11 more domains)
   ```

4. **Inspect sample generated file**:

   ```bash
   cat src/content/docs/tools/apps/app-create.md
   ```

   **Verify**:
   - Frontmatter present (title, description)
   - Description section
   - Syntax section
   - Parameters table
   - Return value section
   - Links to related tools

**Duration**: 6-8 hours to implement and test

**Files Created**:
- `docs/reference/scripts/convert-to-markdown.ts` (new)
- `docs/reference/src/content/docs/tools/{domain}/{tool}.md` (115 files generated)

**Parallel?**: No - depends on T017, T018, T019

**Notes**:
- Markdown must be valid Starlight format (frontmatter, sections)
- Parameters table must be readable and accessible
- Links must work with Starlight navigation

---

## Test Strategy

**Unit Testing** (for scripts):

1. **Test extraction with sample handler**:
   - Create test handler file with known structure
   - Run extraction script
   - Verify output matches expected

2. **Test OpenAPI generation with sample manifest**:
   - Create minimal tools-manifest.json
   - Run OpenAPI script
   - Validate with swagger-cli

3. **Test markdown generation with sample OpenAPI**:
   - Create minimal openapi.json
   - Run markdown script
   - Verify markdown format

**Integration Testing**:

1. **Full pipeline test**:
   ```bash
   cd docs/reference
   npx tsx scripts/extract-mcp-tools.ts
   npx tsx scripts/generate-openapi.ts
   npx tsx scripts/convert-to-markdown.ts
   ```

   - ✅ All scripts succeed
   - ✅ 115 tools extracted
   - ✅ 115 markdown files generated

2. **Starlight build test**:
   ```bash
   npm run build
   ```

   - ✅ Build succeeds
   - ✅ All tool pages present in dist/
   - ✅ Navigation auto-generated correctly

**Manual Validation**:

1. **Spot-check generated files**:
   - Pick 5 random tools across different domains
   - Verify completeness (description, parameters, return type)
   - Verify markdown formatting

2. **Preview in browser**:
   ```bash
   npm run dev
   ```
   - Navigate to sample tool pages
   - Verify rendering is correct

---

## Risks & Mitigations

**Risk 1: Tool handler structure may be inconsistent**
- **Cause**: Handlers may use different patterns for metadata
- **Mitigation**: Start with majority case; add special handling for outliers
- **Monitoring**: Log warnings for handlers that don't match expected structure

**Risk 2: Parameter extraction may fail for complex types**
- **Cause**: TypeScript types may be complex (unions, generics, etc.)
- **Mitigation**: Simplify complex types to base types (e.g., `string | number` → `string`)
- **Fallback**: Mark parameter type as `any` with note "See source code"

**Risk 3: Examples may not be present in handlers**
- **Cause**: Handlers may lack @example JSDoc blocks
- **Mitigation**: Generate minimal example from parameters (accept this for initial version)
- **Future**: Add examples to handlers for better documentation

**Risk 4: Generated markdown may not be valid Starlight format**
- **Cause**: Starlight has specific frontmatter requirements
- **Mitigation**: Test with Starlight build; fix template as needed
- **Validation**: Build must succeed for acceptance

**Risk 5: OpenAPI schema may be invalid**
- **Cause**: Type conversions may produce invalid schema
- **Mitigation**: Validate with swagger-cli; fix issues
- **Testing**: Run validation as part of script

---

## Review Guidance

**Key Acceptance Criteria**:

1. **Schema design is complete**:
   - TypeScript interfaces defined
   - OpenAPI template created
   - Markdown template created
   - README documents pipeline

2. **Extraction script works**:
   - Parses all handler files in `/src/handlers/tools/`
   - Extracts 115 tools
   - Outputs valid tools-manifest.json

3. **OpenAPI generation works**:
   - Converts manifest to OpenAPI 3.0
   - Schema validates with swagger-cli
   - All 115 tools present as paths

4. **Markdown generation works**:
   - Converts OpenAPI to markdown
   - Generates 115 files organized by domain
   - Markdown is valid Starlight format
   - Parameters tables are formatted correctly

5. **Pipeline is documented**:
   - README explains each script
   - Data flow diagram present
   - Usage instructions clear

**Verification Commands**:

```bash
cd docs/reference

# Run full pipeline
npx tsx scripts/extract-mcp-tools.ts
npx tsx scripts/generate-openapi.ts
npx tsx scripts/convert-to-markdown.ts

# Validate OpenAPI
npx swagger-cli validate openapi.json

# Count generated files
find src/content/docs/tools -name "*.md" | wc -l
# Expected: 115

# Build with Starlight
npm run build
# Should succeed
```

**Review Checklist**:
- [ ] Schema interfaces defined (schema.ts)
- [ ] OpenAPI template created
- [ ] Markdown template created
- [ ] Extraction script implemented
- [ ] OpenAPI generation script implemented
- [ ] Markdown conversion script implemented
- [ ] Pipeline README documented
- [ ] Extraction generates 115 tools
- [ ] OpenAPI schema validates
- [ ] Markdown files generated (115 files)
- [ ] Markdown format is valid Starlight
- [ ] Starlight build succeeds
- [ ] Sample tools spot-checked for accuracy

---

## Implementation Command

To implement this work package:

```bash
spec-kitty implement WP09 --base WP02
```

*(Depends on WP02; Site 2 must exist with scripts/ folder)*

---

## Activity Log

> Entries MUST be in chronological order (oldest first, newest last).

*[Activity log will be populated during implementation and review]*
- 2026-01-23T11:06:55Z – claude – shell_pid=28832 – lane=doing – Started implementation via workflow command
- 2026-01-23T11:09:26Z – claude – shell_pid=28832 – lane=planned – Implementation not yet started - claim and begin work on auto-generation pipeline schema and scripts
- 2026-01-23T11:15:57Z – claude – shell_pid=28832 – lane=for_review – Implementation complete: Auto-generation pipeline fully implemented. T017-T020 all subtasks completed. 170 tools extracted across 22 domains. Produced tools-manifest.json, openapi.json, and 192 markdown files with Starlight formatting. All scripts tested and working.
- 2026-01-23T11:15:59Z – claude – shell_pid=38760 – lane=doing – Started review via workflow command
