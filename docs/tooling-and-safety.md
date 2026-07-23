# Tooling & Safety Guide

Guidance for MCP tools that wrap Mittwald operations. The hard requirements — tool annotations,
scope handling, and the "return connection data, don't execute" rule — live in `CLAUDE.md`; this
page collects the day-to-day patterns.

## Core Safety Patterns

- **Confirm intent for destructive ops**: require an explicit `confirm: true` for
  delete/revoke/drop/destroy/reset actions, log the attempt with `logger.warn()`, and echo the
  target IDs back to the user. Mark the tool `destructiveHint: true`.
- **Redact credentials**: never log secrets. Use `src/utils/credential-redactor.ts` for commands and
  `src/utils/credential-response.ts` for responses.
- **Generate secrets properly**: `src/utils/credential-generator.ts`, never ad-hoc randomness.
- **Respect context**: honour user-provided project/server/org IDs; never override without consent.
  Context parameters are only injected into tools whose schema declares them (see the context-flag
  map in `ARCHITECTURE.md`).
- **Resource caps**: tool payloads are capped (`MCP_TOOL_MAX_PAYLOAD_MB`); paginate or filter large
  listings rather than returning everything.
- **Timeouts**: keep operations bounded; prefer targeted queries over broad scans.

## Tool Authoring Checklist

- Define an `inputSchema` and validate before doing any work.
- Declare `title` and the three annotation hints — `tests/unit/tools/tool-annotations.test.ts`
  enforces this.
- Provide safe defaults (read/list before mutate).
- Take the Mittwald token from the session, never from tool input.
- Prefer a `@mittwald-mcp/cli-core` library call over spawning `mw`.
- Add tests for edge and error cases (missing IDs, malformed input, denied scopes).

## References

- Credential handling standard: `docs/CREDENTIAL-SECURITY.md`
- CLI coverage expectations: `docs/coverage.md`
- Regression suite: `tests/security/credential-leakage.test.ts`
