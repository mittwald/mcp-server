# Setup & Guides Docs Site

This directory contains the human-perspective documentation site for Mittwald MCP:

- getting connected
- how-to playbooks
- tutorials
- runbooks
- explainers

## Build and Run

```bash
cd docs/setup-and-guides
npm ci
npm run dev
```

```bash
cd docs/setup-and-guides
npm run build
```

Build output goes to `dist/`.

## Canonical Operator Instructions

Use this runbook for building/spot-checking both docs sites together:

- `docs/DOCS-SITES-OPERATIONS.md`
