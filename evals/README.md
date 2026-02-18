# Agent-Native E2E (Current)

`evals/` now contains only the current agent-native E2E path.

Operator start point:
- `docs/FUNCTIONAL-TESTING-OPERATIONS.md`

## Scope

- Prompt corpus for deployed Fly MCP: `evals/prompts-fly-live/`
- Runner + auth/bootstrap + reporting: `evals/scripts/`
- Run artifacts: `evals/results/agent-e2e/`

Legacy scenario-runner and multi-run orchestration artifacts were removed from this directory.

## Commands

```bash
# Configure agent MCP endpoints/auth bootstrap (default target: fly)
npm run eval:agent:auth -- --target=fly

# Check agent readiness (CLI + MCP tool visibility + auth)
npm run eval:agent:preflight -- --agents=claude,codex,opencode

# Execute tool E2E inside agents with coverage gate
npm run eval:agent:e2e -- --agents=claude --require-coverage=100

# Show latest single-run summary
npm run eval:agent:report

# Aggregate exact outcomes across all historical runs
npm run eval:agent:results -- --agent=claude
```
