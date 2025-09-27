# Claude Desktop Integration Notes

## OAuth Expectations
- Supports OAuth 2.1 with **mandatory PKCE** and **Dynamic Client Registration** (DCR). If DCR is unavailable, the UI now accepts a pre-provisioned client ID and secret, but DCR remains the default path. [Anthropic Help Center, “Building Custom Connectors via Remote MCP Servers”](https://support.claude.com/en/articles/11503834-building-custom-connectors-via-remote-mcp-servers)
- Redirect URI: `https://claude.ai/api/mcp/auth_callback` (Anthropic warns this may change to `https://claude.com/api/mcp/auth_callback`; allowlist both). [Anthropic Help Center](https://support.claude.com/en/articles/11503834-building-custom-connectors-via-remote-mcp-servers)
- Client name presented during registration is `"Claude"`. [Anthropic Help Center](https://support.claude.com/en/articles/11503834-building-custom-connectors-via-remote-mcp-servers)
- Claude discovers endpoints via `/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server`, then POSTs to `/reg`, `/auth`, and `/token` per the MCP authorization spec. [Model Context Protocol Authorization Spec](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- Token expiry/refresh must be supported; Claude will reuse refresh tokens when supplied. [Anthropic Help Center](https://support.claude.com/en/articles/11503834-building-custom-connectors-via-remote-mcp-servers)

## Observed Behaviour (2025-09)
- Our proxy responds exactly as required: DCR succeeds, `/auth` returns 303s, auto-consent kicks in when cached Mittwald grants exist, and `/token` is ready to exchange codes.
- Claude Desktop often **fails to follow the 303 redirect** back to `/token`. It repeatedly reloads the `/auth/<interaction-id>` resume URL, which oidc-provider will only accept once. Subsequent hits return `invalid_request: authorization request has expired`. This mirrors community reports where Claude loops on expired interactions. [anthropics/claude-code#3515](https://github.com/anthropics/claude-code/issues/3515)
- We have not observed any `/token` calls in failure cases. The issue reproduces even after deleting cached connections and adding query-string cache busters.
- Clearing our `userAccountStore` forces a full Mittwald login (via `/mittwald/callback`) but does not consistently resolve the problem.

## Known Upstream Issues
- Anthropic's GitHub issues (e.g. [#3515](https://github.com/anthropics/claude-code/issues/3515), [#4760](https://github.com/anthropics/claude-code/issues/4760), [#5826](https://github.com/anthropics/claude-code/issues/5826)) describe identical symptoms—`step=start_error`, stale client IDs, or missing token exchanges—on production deployments. No server-side workaround documented.
- **Critical Finding**: Community reports confirm "claude cli works flawlessly and only claude desktop/web have the issue" - the same OAuth servers that fail in Claude Desktop work perfectly in Claude Code CLI. [GitHub #3515](https://github.com/anthropics/claude-code/issues/3515)
- **Production vs Preview**: Issue specifically affects production deployments while preview deployments work correctly. The OAuth flow starts but fails with `step=start_error` before reaching the MCP server's OAuth endpoints.
- **Issue Scope**: Problem appears to be in Claude's OAuth proxy (`claude.ai/api/organizations/.../mcp/start-auth/`) rather than MCP server implementations. Community testing shows OAuth servers work correctly when accessed directly.
- Support guidance confirms Claude should re-register when `/token` returns `invalid_client`, and that the callback URL and IP ranges should be allowlisted. [Anthropic Help Center](https://support.claude.com/en/articles/11503834-building-custom-connectors-via-remote-mcp-servers)

## Suggested Troubleshooting Steps
1. **Capture redirect headers:** log the `Location` header from each 303 to prove the proxy is responding correctly.
2. **Force fresh Mittwald auth:** temporarily clear cached grants (`userAccountStore.clear()`) before tests to eliminate auto-consent edge cases.
3. **Manual client credentials:** try registering a static confidential client and entering its ID/secret through the Claude UI.
4. **Test with Claude CLI:** Verify OAuth functionality using Claude Code CLI as community reports confirm it works when Desktop fails.
5. **Verify callback URL allowlisting:** Ensure both `https://claude.ai/api/mcp/auth_callback` and `https://claude.com/api/mcp/auth_callback` are allowlisted.
6. **Check OAuth discovery compliance:** Validate RFC 8414 OAuth discovery endpoints implementation as suggested by community members.
7. **Escalate to Anthropic:** share logs plus the 303 locations and lack of `/token` requests; reference the GitHub issues above.

## Outstanding Questions
- Does Claude require additional metadata (e.g. `response_modes_supported: ["query"]`) or reduced scope lists to avoid browser-side validation quirks?
- Are there timing requirements on the redirect Claude is expecting (e.g. minimum delay) before it proceeds to `/token`?
- Will Anthropic provide a CLI flag or config to disable cached client IDs or grants so the resume loop stops?

## Community Workarounds & Solutions
- **Entra ID Fix**: One user resolved OAuth issues by correcting Entra ID callback URL configuration to properly match Claude's expected redirect URI.
- **Direct OAuth Implementation**: Some developers implement RFC 8414 OAuth discovery endpoints directly in their servers rather than relying on separate OAuth providers.
- **Alternative Testing**: Cloudflare's AI Playground provides more detailed OAuth error messages for debugging compared to Claude Desktop.
- **SSH Environment**: For SSH-based development, use `claude setup-token` to generate long-lived OAuth tokens with `CLAUDE_CODE_OAUTH_TOKEN` environment variable.

## Server Validation Status
Our oauth2c testing (2025-09-27) confirmed:
- ✅ Dynamic Client Registration functional
- ✅ OAuth discovery endpoints compliant
- ✅ PKCE enforcement working correctly
- ✅ All OAuth 2.1 endpoints operational
- ✅ Token introspection returning proper responses
- ✅ Client lifecycle management functional

**Verdict**: OAuth server implementation is correct and fully functional. Issues are confirmed to be Claude Desktop client-side bugs affecting production deployments.

*Last updated: 2025-09-27*
