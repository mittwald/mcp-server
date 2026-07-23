# Functional Use-Case Library

This directory is the canonical functional scenario library for Mittwald MCP.

Each JSON file defines a human-intent workflow that agents execute against deployed MCP endpoints during agent-native E2E testing.

## Scope

- Domains covered: identity, organization, project-foundation, apps, containers, databases, domains-mail, access-users, automation, backups
- Scenario IDs are stable and should be treated as external references (docs mappings, runbooks, reports).
- Scenarios are written from the human perspective ("what outcome I want"), not from tool/CLI internals.

## Where It Is Used

- Functional testing runbook: `docs/FUNCTIONAL-TESTING-OPERATIONS.md`
- Agent E2E execution: `evals/scripts/agent-e2e-runner.ts`
- Prompt corpus for live runs: `evals/prompts-fly-live/`
- Tutorial/use-case mapping guardrail: `scripts/docs-guardrails.ts`

## Scenario Format (Abbreviated)

```json
{
  "id": "domain-nnn-short-name",
  "title": "Human readable scenario title",
  "domain": "apps",
  "prompt": "Natural-language request from a human operator",
  "expectedTools": ["app/create", "project/get"],
  "successCriteria": ["..."],
  "cleanupRequirements": ["..."],
  "questionAnswers": ["..."]
}
```

## Authoring Rules

A prompt must describe a **business outcome**, not a tool sequence. Prescriptive prompts train the
agent to expect specific tools, which destroys the tool-discovery signal these scenarios exist to
measure.

- ❌ "Use the Mittwald MCP tools to first list all projects, then create a PHP application."
- ✅ "I need to deploy a PHP 8.2 web application so I can see it running in my project environment."

Never use in prompt text:

| Phrasing | Why |
|---|---|
| "Use the MCP/Mittwald tools" | Prescribes tool selection |
| "Call the …" / "Invoke …" | Explicitly invokes a tool |
| "First …, then …" (as instruction) | Dictates tool order |
| `mcp__mittwald__*` tool names | Removes the discovery element |
| "Using the API" | Exposes internal mechanics |

Each prompt should convey business context (why the user needs this), the desired outcome, and how
success is recognised. Beyond that:

- Keep prompts intent-based and realistic.
- Keep destructive scenarios paired with explicit cleanup requirements.
- Preserve existing IDs; add new scenarios as new IDs instead of renaming old ones.

## Execution

Use the operator runbook commands (preflight, full run, targeted rerun):

- `npm run eval:agent:preflight -- --agents=claude,codex,opencode`
- `npm run eval:agent:e2e -- --agents=claude --require-coverage=100`
