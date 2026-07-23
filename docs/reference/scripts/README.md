# Auto-Generation Pipeline for MCP Tools Documentation

This directory contains scripts for automatically generating documentation for Mittwald MCP tools.

## Overview

The pipeline consists of 4 stages:

1. **Schema Definition** (`schema.ts`) - TypeScript interfaces for tool metadata
2. **Tool Extraction** (`extract-mcp-tools.ts`) - Scan and extract tool definitions
3. **OpenAPI Generation** (`generate-openapi.ts`) - Convert to OpenAPI 3.0 specification
4. **Markdown Conversion** (`convert-to-markdown.ts`) - Generate Starlight-compatible documentation

## Pipeline Diagram

```
src/constants/tool/mittwald-cli/
    ↓
extract-mcp-tools.ts
    ↓
tools-manifest.json
    ├→ generate-openapi.ts
    │   ↓
    │   openapi.json
    │
    └→ convert-to-markdown.ts
        ↓
        src/content/docs/tools/
            ├ index.md
            ├ app/
            │   ├ index.md
            │   ├ app-list.md
            │   ├ app-get.md
            │   ...
            ├ database/
            │   ├ index.md
            │   ├ database-mysql-create.md
            │   ...
```

## Files

### Schema Files

- **`schema.ts`** - TypeScript interfaces and domain definitions
  - `MCPTool` - Single tool definition
  - `ToolParameter` - Parameter metadata
  - `ReturnType` - Return value specification
  - `ToolsManifest` - Collection of all tools
  - `MCPDomain` - Union type of 17 tool domains

### Template Files

- **`openapi-template.ts`** - OpenAPI 3.0 base schema and path item creation
- **`markdown-template.ts`** - Markdown generation utilities for Starlight

### Executable Scripts

- **`extract-mcp-tools.ts`** - Extract tools from source
  - Input: `/src/constants/tool/mittwald-cli/**/*-cli.ts`
  - Output: `tools-manifest.json`

- **`generate-openapi.ts`** - Generate OpenAPI specification
  - Input: `tools-manifest.json`
  - Output: `openapi.json`

- **`convert-to-markdown.ts`** - Generate markdown documentation
  - Input: `tools-manifest.json`
  - Output: `src/content/docs/tools/**/*.md` (one page per tool, plus a domain index)

## Running the Pipeline

### Prerequisites

```bash
npm ci --prefix docs/reference
```

All four scripts resolve paths relative to the **repository root**, so run them from there.

### Full Pipeline (Recommended)

Run all scripts in order:

```bash
# From the repository root
npm run docs:generate
```

This command (defined in the root `package.json`) runs:
1. `extract-mcp-tools.ts`
2. `generate-openapi.ts`
3. `convert-to-markdown.ts`
4. `validate-coverage.ts`

### Individual Steps

```bash
# Extract tools only
npx tsx scripts/extract-mcp-tools.ts

# Generate OpenAPI from existing manifest
npx tsx scripts/generate-openapi.ts

# Generate markdown from existing manifest
npx tsx scripts/convert-to-markdown.ts
```

## Output Artifacts

### tools-manifest.json

Complete catalog of all MCP tools with metadata:

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-07-23T09:00:00.000Z",
  "totalTools": 116,
  "tools": {
    "app": [...],
    "database": [...],
    ...
  },
  "domains": {
    "app": {
      "name": "app",
      "title": "Apps",
      "description": "Manage applications in projects",
      "toolCount": 8,
      "tags": ["app"]
    },
    ...
  }
}
```

### openapi.json

Valid OpenAPI 3.0 specification with all tools as endpoints:

```json
{
  "openapi": "3.0.0",
  "info": { ... },
  "paths": {
    "/tools/mittwald_app_list": { ... },
    "/tools/mittwald_app_get": { ... },
    ...
  }
}
```

### src/content/docs/tools/**/*.md

Starlight-compatible markdown files organized by domain:

```
tools/
├── index.md (main reference)
├── app/
│   ├── index.md
│   ├── app-list.md
│   ├── app-get.md
│   ├── app-create.md
│   ├── app-update.md
│   ├── app-delete.md
│   └── ...
├── database/
│   ├── index.md
│   ├── database-mysql-list.md
│   ├── database-mysql-create.md
│   └── ...
├── org/
│   ├── index.md
│   ├── org-list.md
│   └── ...
└── ...
```

## Tool Domains

The domain list and per-domain counts are derived from the registry at generation time — read them
from `tools-manifest.json` or the output of `extract-mcp-tools.ts` rather than from a table here.
Tools excluded by `EXCLUDED_TOOLS_WITH_REASONS` in `src/utils/tool-scanner.ts` are skipped, so the
reference documents only the tools a client can actually call.

When a domain gains its first tool or loses its last one, update the sidebar in
`docs/reference/astro.config.mjs` to match.

## Implementation Details

### Tool Extraction Process

1. Scans `/src/constants/tool/mittwald-cli/` recursively
2. Finds all `*-cli.ts` files (tool definitions)
3. Dynamically imports each file via ES modules
4. Extracts `ToolRegistration` object
5. Maps to `MCPTool` interface
6. Organizes by domain
7. Writes `tools-manifest.json`

### Tool Definition Format

Each tool definition file exports:

```typescript
const tool: Tool = {
  name: 'mittwald_app_list',
  title: 'List Apps',
  description: 'List installed apps in a project.',
  inputSchema: {
    type: 'object',
    properties: { ... },
    required: [...]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppListCli,
  schema: tool.inputSchema
};

export default registration;
```

The extraction script:
- Reads tool name and title
- Parses inputSchema to extract parameters
- Infers domain from directory structure
- Creates MCPTool metadata

### Markdown Generation

For each tool:
1. Generate Starlight-compatible frontmatter
2. Generate Overview section
3. Generate Parameters section (table)
4. Generate Return Type section
5. Generate Examples section (if available)
6. Generate Deprecation notice (if deprecated)

For each domain:
1. Generate index.md with tool listings
2. Link to individual tool pages

### OpenAPI Generation

For each tool:
1. Create `/tools/{toolName}` path
2. Add POST operation
3. Parse inputSchema to OpenAPI parameters
4. Add success and error responses
5. Add domain-based tags

## Maintenance

### Adding a New Tool

1. Create `src/constants/tool/mittwald-cli/{domain}/{name}-cli.ts`
2. Export `ToolRegistration` with `Tool` definition
3. Run `npm run docs:generate` to rebuild documentation

A tool listed in `EXCLUDED_TOOLS_WITH_REASONS` (`src/utils/tool-scanner.ts`) is deliberately left
out of the reference — the server does not register it.

### Updating Tool Documentation

1. Update `description` or `inputSchema` in tool definition
2. Run `npm run docs:generate`
3. Markdown files automatically regenerated with new content

### Adding a New Domain

1. Create new directory under `src/constants/tool/mittwald-cli/{newdomain}/`
2. Add domain name to `MCPDomain` type in `schema.ts`
3. Add domain entry to `DOMAIN_TITLES` and `DOMAIN_DESCRIPTIONS`
4. Add a sidebar entry in `docs/reference/astro.config.mjs`
5. Run `npm run docs:generate`

## Validation

The pipeline includes built-in validation:

- **Tool Extraction**: Checks for required fields in ToolRegistration
- **OpenAPI Generation**: Validates OpenAPI 3.0 schema compliance
- **Markdown Generation**: Verifies all output directories created successfully

## Development

### Updating Templates

- Edit `openapi-template.ts` to change OpenAPI structure
- Edit `markdown-template.ts` to change markdown output format
- Re-run pipeline to apply changes to all tools

### Debugging

Enable verbose logging by checking tool counts and error messages:

```bash
# Extract only, see what's found
npx tsx scripts/extract-mcp-tools.ts 2>&1 | tee extract.log

# Generate OpenAPI, see schema validation
npx tsx scripts/generate-openapi.ts 2>&1 | tee openapi.log

# Generate markdown, see file generation
npx tsx scripts/convert-to-markdown.ts 2>&1 | tee markdown.log
```

## Notes

- All scripts use ES modules (import/export syntax)
- TypeScript is transpiled on-the-fly by tsx
- All output is deterministic (same input = same output)
- Generated files have no manual edits (regenerate to update)
- Manifest format is versioned for future compatibility
