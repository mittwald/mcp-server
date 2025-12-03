# Tooling & Safety Guide

## Scope & Audience
Current guidance for MCP tools wrapping the Mittwald CLI. Use this instead of the archived tool-examples/safety docs (see `docs/archive/legacy/tooling/` for historical detail).

## Core Safety Patterns
- **Confirm intent for destructive ops**: require explicit user confirmation for delete/revoke/drop/destroy/reset actions; echo target IDs.
- **Redact credentials**: never log secrets; use credential redactors for commands and responses.
- **Use JSON outputs**: prefer `--output json` to avoid brittle parsing.
- **Respect context**: honor user-provided project/server/org IDs; do not override without consent.
- **Resource caps**: stdout payloads are limited; paginate or filter large listings.
- **Timeouts**: keep commands bounded; prefer targeted queries over broad scans.

## Tool Authoring Checklist
- Define schemas for inputs/outputs; validate before invoking CLI.
- Provide safe defaults (read/list before mutate).
- Ensure `--token` injection comes from session; never accept arbitrary tokens from input.
- Add tests for edge/error cases (missing IDs, malformed flags, denied scopes).

## Examples & References
- Archived detailed examples and audits live in `docs/archive/legacy/tooling/tool-examples/`.
- Credential handling standard: `docs/CREDENTIAL-SECURITY.md`.
- Coverage expectations: `docs/coverage.md`.
