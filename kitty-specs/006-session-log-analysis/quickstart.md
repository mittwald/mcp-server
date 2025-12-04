# Quickstart: Session Log Analysis

**Feature**: 006-session-log-analysis
**Date**: 2025-12-04

## Prerequisites

- Node.js 20+
- npm or pnpm
- Session logs in `tests/functional/session-logs/005-mcp-functional-test/`

## Installation

```bash
# Navigate to functional tests directory
cd tests/functional

# Install dependencies
npm install
```

## Running the Analysis

### Full Analysis

```bash
# Run complete analysis pipeline
npm run analyze
```

This will:
1. Parse all 595 session logs
2. Detect confusion patterns
3. Build tool dependency graph
4. Generate domain reports
5. Create summary and recommendations

### Output Location

All artifacts are written to `tests/functional/analysis-output/`:

```
analysis-output/
├── corpus-index.json      # Session index
├── incidents.json         # Detected confusion patterns
├── dependencies.json      # Tool dependency graph
├── dependencies.dot       # Graphviz visualization
├── summary.md             # Corpus-wide report
├── recommendations.json   # Tool chain recommendations
├── recommendations.md     # Human-readable recommendations
└── reports/               # Per-domain reports
    ├── identity.md
    ├── organization.md
    └── ... (8 more)
```

## CLI Options

```bash
# Specify custom input/output directories
npx tsx src/analysis/cli.ts \
  --input ./session-logs/005-mcp-functional-test \
  --output ./analysis-output

# Analyze single domain only
npx tsx src/analysis/cli.ts --domain apps

# Enable verbose logging
npx tsx src/analysis/cli.ts --verbose
```

## Viewing Results

### Summary Report

Open `analysis-output/summary.md` in any Markdown viewer:

```bash
# VS Code
code analysis-output/summary.md

# Terminal (with glow)
glow analysis-output/summary.md
```

### Dependency Graph

Render the DOT file with Graphviz:

```bash
# Generate PNG
dot -Tpng analysis-output/dependencies.dot -o dependencies.png

# Generate SVG
dot -Tsvg analysis-output/dependencies.dot -o dependencies.svg

# Or use online viewer: https://dreampuf.github.io/GraphvizOnline/
```

### Domain Reports

Each domain has its own report in `analysis-output/reports/`:

```bash
# View apps domain analysis
cat analysis-output/reports/apps.md
```

## Understanding the Output

### Incidents

Each incident in `incidents.json` has:
- `type`: Category of confusion pattern
- `severity`: high/medium/low
- `tokenWaste`: Tokens spent on failed attempts
- `context.description`: Human-readable explanation

### Dependencies

The dependency graph shows:
- Which tools must be called before others
- Confidence scores based on observed patterns
- Grouping by functional domain

### Recommendations

Tool chains show:
- Common multi-step operations
- Optimal tool sequences
- Example prompts for LLMs

## Next Steps

After running analysis:

1. Review `summary.md` for corpus-wide patterns
2. Check domain reports for specific tool issues
3. Use `recommendations.json` to improve MCP tool descriptions
4. Reference `dependencies.dot` for user documentation

This analysis informs future sprints:
- MCP server improvements (tool descriptions, error messages)
- User documentation (common workflows, prerequisites)
