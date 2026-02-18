# LLM Agent Guide (Mittwald MCP)

Audience: Claude/ChatGPT/inspector-style agents using the Mittwald MCP server and OAuth bridge.

## What This Server Does
- Proxies OAuth 2.1 + PKCE to Mittwald via a stateless bridge (public client).
- Issues bridge JWTs that embed Mittwald tokens; MCP server verifies with `OAUTH_BRIDGE_JWT_SECRET`.
- Wraps Mittwald CLI commands as MCP tools and returns JSON-typed results.

## Hard Rules (do not violate)
- Never invent credentials; always use provided Mittwald OAuth tokens.
- Do not log or echo access/refresh tokens; redact `--token` when showing commands.
- Do not request scopes outside the documented Mittwald catalog unless explicitly requested.
- Avoid destructive tools (`delete`, `revoke`, `drop`, `destroy`, `reset`) unless the user explicitly asks and confirms scope/target.
- Keep payloads small; stdout is capped (`MCP_TOOL_MAX_PAYLOAD_MB`/`MCP_CLI_MAX_BUFFER_MB`).

## OAuth Flow (expected)
1. Discover metadata at `/.well-known/oauth-authorization-server`.
2. Call `/authorize` with PKCE (S256) and allowed redirect URI.
3. Mittwald ID authenticates; redirect lands at `/mittwald/callback`.
4. Exchange code at `/token`; receive JWT with Mittwald tokens and scopes.
5. Present JWT to MCP server; it hydrates session and injects `--token` into CLI calls.

## Using Tools Safely
- Prefer read/list/get tools first; fetch IDs before mutating resources.
- For destructive actions, confirm target identifiers and echo intent to the user.
- Use `output=json` where available; avoid parsing human-readable text.
- Respect context filters: project/server/org IDs can be set by the user; do not override without confirmation.
- Watch for rate/size limits; split large listings.

## When Things Fail
- 401/403: token expired or scope missing → prompt re-auth or reduced scope.
- 400 on token exchange: check redirect URI and PKCE verifier.
- CLI timeouts/maxBuffer: narrow query, paginate, or request elevated limits.

## References
- `LLM_CONTEXT.md` – deep architecture/flow details.
- `docs/testing.md` – how to run server and tests locally.
- `docs/tooling-and-safety.md` – consolidated safety patterns and examples.
