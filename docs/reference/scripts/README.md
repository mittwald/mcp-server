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
  - Output: `src/content/docs/tools/**/*.md` (115+ files)

## Running the Pipeline

### Prerequisites

```bash
cd /Users/robert/Code/mittwald-mcp/docs/reference
npm install
```

### Full Pipeline (Recommended)

Run all scripts in order:

```bash
# From the mittwald-mcp root directory
npm run docs:generate
```

This command (defined in package.json) runs:
1. `extract-mcp-tools.ts`
2. `generate-openapi.ts`
3. `convert-to-markdown.ts`

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
  "generatedAt": "2024-01-23T12:00:00.000Z",
  "totalTools": 115,
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

## Tool Domains (17 total)

| Domain | Title | Tools |
|--------|-------|-------|
| app | Apps | 8 |
| backup | Backups | 8 |
| certificate | Certificates | 2 |
| container | Containers | 10 |
| context | Context | 3 |
| cronjob | Cron Jobs | 9 |
| database | Databases | 14 |
| domain | Domains | 8 |
| extension | Extensions | 4 |
| org | Organizations | 7 |
| project | Projects | 10 |
| registry | Registries | 3 |
| sftp | SFTP | 6 |
| ssh | SSH | 6 |
| stack | Stacks | 2 |
| user | Users | 7 |
| volume | Volumes | 5 |

**Total: 115 tools**

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
4. New tool automatically appears in documentation

### Updating Tool Documentation

1. Update `description` or `inputSchema` in tool definition
2. Run `npm run docs:generate`
3. Markdown files automatically regenerated with new content

### Adding a New Domain

1. Create new directory under `src/handlers/tools/mittwald-cli/{newdomain}/`
2. Add domain name to `MCPDomain` type in `schema.ts`
3. Add domain entry to `DOMAIN_TITLES` and `DOMAIN_DESCRIPTIONS`
4. Run `npm run docs:generate`
5. New domain automatically included in documentation

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
