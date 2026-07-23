# Tool Reference Docs Site

This directory contains the API/tool reference site for Mittwald MCP.

Every page under `src/content/docs/tools/` is generated from the tool registry in
`src/constants/tool/mittwald-cli/`. Do not edit those pages by hand — regenerate them.

## Regenerating the Tool Pages

Run from the repository root:

```bash
npm run docs:generate
```

That runs the four stages in order — `extract-mcp-tools.ts` (`tools-manifest.json`),
`generate-openapi.ts` (`openapi.json`), `convert-to-markdown.ts`
(`src/content/docs/tools/**`) and `validate-coverage.ts` (`coverage-report.json`) — and fails if
the generated pages and the manifest disagree.

Tools excluded from the server's registry (`EXCLUDED_TOOLS_WITH_REASONS` in
`src/utils/tool-scanner.ts`) are skipped, so the reference only documents tools clients can
actually call. When a domain gains or loses all of its tools, update the sidebar in
`astro.config.mjs` accordingly.

## Build and Run

```bash
cd docs/reference
npm ci
npm run dev
```

```bash
cd docs/reference
npm run build
```

Build output goes to `dist/`.

## Canonical Operator Instructions

Customer handover entrypoint:

- `docs/OPERATIONS-START-HERE.md`

Use this runbook for building/spot-checking both docs sites together:

- `docs/DOCS-SITES-OPERATIONS.md`
