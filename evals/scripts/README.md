# Agent-Native E2E Scripts

This directory now only contains the current agent-native E2E path.

## Kept scripts

- `agent-auth-bootstrap.ts`  
  Configures MCP endpoints and auth bootstrap for Claude, Codex, Opencode.
- `agent-e2e-runner.ts`  
  Executes prompt-based MCP tool tests inside real agents with coverage gates.
- `agent-e2e-report.ts`  
  Prints a concise report for the latest or selected run.
- `agent-e2e-results.ts`  
  Aggregates historical runs and reports cumulative attempted/succeeded coverage.

## Canonical commands

```bash
npm run eval:agent:auth -- --target=fly
npm run eval:agent:preflight -- --agents=claude,codex,opencode
npm run eval:agent:e2e -- --agents=claude --require-coverage=100
npm run eval:agent:report
npm run eval:agent:results -- --agent=claude
```
