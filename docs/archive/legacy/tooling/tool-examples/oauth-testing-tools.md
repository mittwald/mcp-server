# OAuth Testing Toolkit (2025-09-27)

This note captures the recommended tooling for exercising the stateless Mittwald OAuth bridge and MCP server. It replaces the older MCP Jam/oidc-provider guidance.

## oauth2c (CLI)
- Install: `brew install cloudentity/tap/oauth2c` (or download binaries from GitHub releases).
- Dynamic registration is **not** handled automatically; register first:
  ```bash
  curl -s -X POST https://mittwald-oauth-server.fly.dev/register \
    -H "content-type: application/json" \
    -d '{
      "client_name": "automation",
      "redirect_uris": ["http://localhost:9876/callback"],
      "grant_types": ["authorization_code","refresh_token"],
      "token_endpoint_auth_method": "none",
      "scope": "user:read project:read app:read"
    }' > /tmp/oauth-register.json
  ```
- Then drive the full flow:
  ```bash
  oauth2c authorize https://mittwald-oauth-server.fly.dev \
    --client-id "$(jq -r .client_id /tmp/oauth-register.json)" \
    --redirect-uri "http://localhost:9876/callback" \
    --scope "user:read project:read app:read" \
    --resource "https://mittwald-mcp-fly2.fly.dev/mcp" \
    --use-pkce --browser --save /tmp/oauth-session.json

  oauth2c token https://mittwald-oauth-server.fly.dev \
    --session /tmp/oauth-session.json --format json
  ```

## Programmatic Clients
- **FastMCP + MCPAuth**: Python helper that mirrors ChatGPT/Claude flows; ensure the scope list matches `config/mittwald-scopes.json`.
- **Custom scripts**: Use `fetch`/`axios` to hit `/authorize`, `/mittwald/callback`, `/token` following PKCE requirements; verify the JWT’s `mittwald` claims.

## Mocking / Isolation
- Local development can run with the bridge’s in-memory store; for CI use Redis (`BRIDGE_STATE_STORE=redis`).
- `ghcr.io/navikt/mock-oauth2-server` remains useful for negative testing, but the Mittwald bridge is the primary integration surface.

## When to Use What
- Smoke tests / CI → oauth2c scripted + Redis-backed bridge.
- Manual debugging → oauth2c with `--verbose` to trace HTTP traffic.
- Regression on connectors → run oauth2c plus the MCP tool smoke scripts in `tests/postman/`.

Keep this document in sync with `tests/README.md` as we port the remaining end-to-end suites to the bridge.
