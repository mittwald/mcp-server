# Functional Test Assets

`tests/functional/` now contains only the canonical use-case library used by the current agent-native E2E framework.

## Canonical Contents

- `use-case-library/` - stable human-intent scenario definitions grouped by domain

Legacy harness scripts and one-off execution artifacts were removed in favor of:

- `evals/scripts/agent-e2e-runner.ts`
- `evals/scripts/agent-e2e-results.ts`
- `evals/AGENT-E2E-PLAYBOOK.md`
- `docs/FUNCTIONAL-TESTING-OPERATIONS.md`

## Operator Entry Point

Start here for customer-operated testing:

- `docs/FUNCTIONAL-TESTING-OPERATIONS.md`
