# MCP Tool Scope Filtering Plan (2025-09-27)

## Goal
- Filter every MCP tool list/response so a user sees only the tools covered by the Mittwald OAuth scopes currently granted to their session. Each connected client should have a tailored tool catalogue matching its authorization.

## Motivation
- Presenting the full, unfiltered tool registry creates confusion (users see actions they cannot execute) and increases the chance of hitting “permission denied” errors at runtime.
- Upcoming deployments may request different scope bundles per client or tenant. We need infrastructure that gracefully supports heterogeneous scope sets without manual reconfiguration.
- Aligns the MCP server with least-privilege principles, improving the user experience for ChatGPT/Claude connectors and simplifying compliance reviews.

## Architecture & Work Streams

1. **Tool Metadata Enhancements**
   - Extend `ToolRegistration` (see `src/types/tool-registry.ts`) to include a `requiredScopes: string[]` field.
   - Annotate every CLI-backed tool under `src/constants/tool/mittwald-cli/**` with the Mittwald scopes needed to execute its command, matching the `mw` documentation.
   - Provide helper utilities to normalize scope names (support future namespace changes like `org:read`).

2. **Session Scope Retrieval**
   - Ensure `sessionManager` persists Mittwald scopes (already stored in `scopes`/`scope` fields) and expose a helper `getSessionScopes(sessionId)`.
   - Add guards for missing/empty scope arrays so list responses default to the safest behaviour (e.g., return only scope-less tools or an empty list).

3. **Scoped Tool Listing**
   - Update the MCP server handler in `src/server/mcp.ts` to wrap `handleListTools` inside `runWithSessionContext`, mirroring tool execution.
   - Modify `handleListTools` in `src/handlers/tool-handlers.ts` to:
     - Retrieve `sessionId` via `getCurrentSessionId()`.
     - Load session metadata and determine granted scopes.
     - Filter the tool registry so that each tool’s `requiredScopes` ⊆ granted scopes.
     - Maintain support for category filtering (`CONFIG.ALLOWED_TOOL_CATEGORIES`).

4. **Scoped Tool Execution Safeguards**
   - Add defensive checks in `handleToolCall` to revalidate scopes before execution and return a structured error if authorization is insufficient (prevents race conditions if scopes change mid-session).
   - Log scope mismatches for observability.

5. **Testing & Validation**
   - Unit tests: verify the filter logic for different scope sets, including users with no scopes, partial scopes, and full access.
   - Integration tests: simulate sessions via `runWithSessionContext` and ensure only authorized tools appear.
   - Regression tests for existing functionality (tool filtering, context tools) to prevent accidental breakage.

6. **Documentation & Migration**
   - Update `ARCHITECTURE.md` to describe per-user tool filtering and scope metadata.
   - Document how to assign `requiredScopes` when adding new tools.
   - Communicate rollout steps (redeploy MCP server; no bridge changes required).

## Open Questions
- Do we need a “public” tool list endpoint for clients prior to authentication? (Current plan assumes tool discovery happens post OAuth.)
- Should we surface to the user which scope is missing when a tool is filtered out, or keep the catalogue opaque?
- How do we handle tools that require *any* of multiple scopes (OR conditions)? We may need to support complex expressions in `requiredScopes`.

## Next Steps
1. Implement metadata + filtering logic.
2. Add tests and update documentation.
3. Deploy MCP server and confirm connector UX improvement.
