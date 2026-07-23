# Functional Test Assets

`tests/functional/` holds the canonical use-case library used by the agent-native E2E framework.
There is no vitest suite here.

## Contents

- `use-case-library/` — stable human-intent scenario definitions grouped by domain

The scenarios are executed by:

- `evals/scripts/agent-e2e-runner.ts`
- `evals/AGENT-E2E-PLAYBOOK.md`

`scripts/docs-guardrails.ts` also validates that every tutorial in the Setup & Guides site maps to
scenario IDs defined here.

## Operator Entry Point

- `docs/FUNCTIONAL-TESTING-OPERATIONS.md`
