# Agent E2E Playbook

This playbook is for full MCP tool validation from inside coding agents, with a hard coverage gate.

## Goal

- Validate every tool prompt under `evals/prompts/**.json`.
- Require real MCP tool calls from agent CLIs (no HTTP bypass scripts).
- Fail the run unless coverage target is met (default: `100%`).

## Commands

### 1) Preflight

```bash
npm run eval:agent:preflight -- --agents=claude,codex,opencode
```

This verifies:
- agent CLI is callable
- mittwald MCP tool exposure is available
- probe tool call (`mcp__mittwald__mittwald_user_get`) is possible

### 2) Full run (hard gate)

```bash
npm run eval:agent:e2e -- \
  --agents=claude,codex,opencode \
  --require-coverage=100 \
  --coverage-mode=all-agents
```

### 3) Report

```bash
npm run eval:agent:report
```

## Authentication Hand-off

When preflight fails for auth, use these remediation paths:

- Claude:
  - Start `claude`
  - Authenticate mittwald server via `/mcp`
  - Ensure `.mcp.json` points to the intended deployed MCP endpoint

- Codex:
  - Add server if needed:
    - `codex mcp add mittwald --url https://mcp.mittwald.de/mcp`
  - Authenticate:
    - `codex mcp login mittwald`

- Opencode:
  - Configure MCP server via `opencode mcp add`
  - Authenticate via `opencode mcp auth mittwald`

## Useful scope-limited runs

```bash
# single agent, small sample
npm run eval:agent:e2e -- --agents=claude --max-tools=10

# selected domains
npm run eval:agent:e2e -- --agents=claude --domains=identity,databases

# selected tools
npm run eval:agent:e2e -- --agents=claude --tools=mcp__mittwald__mittwald_user_get,mcp__mittwald__mittwald_project_list
```

## Output layout

Runs are written to:

`evals/results/agent-e2e/<run-id>/`

Key artifacts:
- `summary.json` and `summary.md`
- `results/<agent>/<domain>/*.json`
- `raw/<agent>/<domain>/*`
