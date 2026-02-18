# Claude Code OAuth + MCP Integration Research

**Researched**: 2026-01-23
**For**: WP05 - Getting-Started Guides
**Status**: Complete

---

## Executive Summary

Claude Code (Anthropic's CLI tool) supports OAuth 2.0 authentication for remote MCP servers through an interactive browser-based flow. The OAuth pattern uses HTTP-based server registration with automatic token management. Authentication tokens are securely stored and automatically refreshed.

---

## OAuth Callback Pattern

### Protocol & Standard

Claude Code uses **HTTP-based OAuth 2.0** with browser-based authorization, NOT RFC 8252 loopback pattern.

### Authentication Flow

1. **User adds remote MCP server**:
   ```bash
   claude mcp add --transport http mittwald https://mittwald-mcp-fly2.fly.dev/mcp
   ```

2. **Authentication trigger**:
   - User runs `/mcp` command within Claude Code
   - Or performs first API call requiring OAuth

3. **Browser opens automatically**:
   - Claude Code opens default browser
   - Directs user to OAuth authorization server
   - User logs in and grants permission

4. **Token exchange**:
   - Authorization server redirects with auth code
   - Claude Code exchanges code for access token
   - Token is stored securely

5. **API calls use token**:
   - Subsequent API calls include Bearer token
   - Tokens auto-refresh when expired

### Callback URL Pattern

Claude Code's OAuth callback is:
- **URL**: `https://claude.ai/api/mcp/auth_callback`
- **OAuth Client Name**: `Claude`
- **Pattern**: Web-based (not loopback/native app)

This means the Mittwald OAuth server must accept `https://claude.ai/api/mcp/auth_callback` as a valid redirect URI.

### Redirect URI Registration

**Method**: Dynamic Client Registration (DCR) - RFC 7591

Claude Code does NOT require manual redirect URI registration. Instead:

1. Claude Code discovers OAuth server metadata
2. Uses Dynamic Client Registration to register itself
3. Provides its fixed callback URL (`https://claude.ai/api/mcp/auth_callback`)
4. OAuth server registers Claude as a client

**Important**: The Mittwald OAuth server must support DCR and accept Claude's callback URL without manual pre-registration.

---

## PKCE Configuration

### PKCE Status

**PKCE**: Automatically handled by Claude Code
**Code Challenge Method**: S256 (SHA-256)

### How it Works

- Claude Code automatically generates code verifier and challenge
- No manual configuration required
- Developer doesn't see PKCE details

### Configuration Location

- **No configuration needed** - fully automatic
- PKCE is transparent to the user

---

## MCP Server Registration

### Claude Code MCP Command Syntax

**Basic command**:
```bash
claude mcp add --transport http <name> <url>
```

**Example for Mittwald**:
```bash
claude mcp add --transport http mittwald https://mittwald-mcp-fly2.fly.dev/mcp
```

### Breaking Down the Command

| Part | Meaning |
|------|---------|
| `claude mcp add` | Add new MCP server |
| `--transport http` | Server uses HTTP protocol |
| `mittwald` | Server name (displayed in Claude Code) |
| `https://mittwald-mcp-fly2.fly.dev/mcp` | Server URL |

### Scopes (Optional)

Register at different scope levels:

```bash
# Local scope (private, default)
claude mcp add --transport http mittwald --scope local https://mittwald-mcp-fly2.fly.dev/mcp

# Project scope (shared in .mcp.json)
claude mcp add --transport http mittwald --scope project https://mittwald-mcp-fly2.fly.dev/mcp

# User scope (across all projects)
claude mcp add --transport http mittwald --scope user https://mittwald-mcp-fly2.fly.dev/mcp
```

### Configuration Storage

- **User scope** (`~/.claude.json`): Available across all projects
- **Project scope** (`.mcp.json`): Shared with team members
- **Local scope** (default): Private to current user

### Credentials & Token Storage

**Where tokens are stored**:
- Claude Code stores OAuth tokens in **secure system keychain**
- Tokens are NOT stored in plain text configuration files
- Only the server URL is visible in `.claude.json` or `~/.claude.json`

**Authentication flow**:
1. First use triggers `/mcp` command or browser opens automatically
2. User authorizes in browser
3. Token is stored securely
4. Subsequent calls use stored token automatically

---

## Common OAuth Errors & Solutions

### Error 1: "Failed to authenticate with server"

**Symptoms**:
- OAuth authorization doesn't complete
- Browser window closes unexpectedly
- No access token obtained

**Causes**:
- Browser integration disabled
- Firewall blocking callback URL
- Default browser not set

**Solutions**:
```bash
# Ensure default browser is set in system settings
# If browser doesn't open, Claude Code will provide URL to copy manually

# Retry authentication:
# 1. Run /mcp command in Claude Code
# 2. Click "Re-authenticate" or "Clear authentication"
# 3. Authorize in browser when it opens
```

### Error 2: "Redirect URI mismatch"

**Symptoms**:
- OAuth server rejects callback
- Error: "redirect_uri not registered" or similar
- Message from OAuth server

**Causes**:
- Mittwald OAuth server doesn't recognize `https://claude.ai/api/mcp/auth_callback`
- Dynamic Client Registration not working
- OAuth server configuration missing Claude's callback URL

**Solutions**:
1. Verify Mittwald OAuth server supports Dynamic Client Registration (RFC 7591)
2. Ensure Mittwald OAuth metadata endpoint includes DCR support
3. Check that Claude's callback URL is accepted by Mittwald OAuth
4. Contact Mittwald support if DCR not working

**Manual workaround** (if DCR fails):
- Pre-register Claude Code manually with Mittwald OAuth
- Use client credentials flow instead

### Error 3: "PKCE validation failed"

**Symptoms**:
- OAuth authorization fails during token exchange
- Error mentions "code_verifier" or "code_challenge"

**Causes**:
- Mittwald OAuth server rejecting PKCE S256 challenge
- PKCE support not enabled on OAuth server
- Network issue during code exchange

**Solutions**:
1. Update Claude Code to latest version
2. Verify Mittwald OAuth server supports PKCE (RFC 7636)
3. Retry authentication (`/mcp` command)
4. Check OAuth server logs for PKCE details

### Error 4: "Access token expired"

**Symptoms**:
- API calls fail with 401 Unauthorized
- Previously working, now getting auth errors

**Causes**:
- OAuth token has expired (typical: 1 hour)
- Refresh token invalid or expired
- Credentials revoked on OAuth server

**Solutions**:
```bash
# Claude Code automatically refreshes tokens
# If refresh fails, re-authenticate:

# In Claude Code, run:
/mcp

# Click "Clear authentication" or "Re-authenticate"
# Then re-run the failing command
```

### Error 5: "Server returned invalid OAuth metadata"

**Symptoms**:
- Error when discovering OAuth endpoints
- Message: "Cannot read OAuth configuration"

**Causes**:
- Mittwald OAuth server metadata endpoint not working
- Missing `.well-known/oauth-authorization-server` endpoint
- Invalid JSON in metadata response

**Solutions**:
1. Test metadata endpoint manually:
   ```bash
   curl https://mittwald-oauth-server.fly.dev/.well-known/oauth-authorization-server
   ```
2. Verify response contains:
   - `authorization_endpoint`
   - `token_endpoint`
   - `registration_endpoint` (for DCR)
3. Check OAuth server is running and accessible
4. Verify firewall allows access to OAuth server

---

## Token Management

### Token Lifecycle

1. **Token obtained** during OAuth authorization
2. **Token stored** securely in system keychain
3. **Token used** for API calls (automatic Bearer token)
4. **Token refreshed** automatically when expired
5. **Token cleared** when user revokes access via `/mcp` menu

### Token Refresh

- **Automatic**: Claude Code handles refresh transparently
- **Condition**: Token is refreshed when expired
- **Failure handling**: If refresh fails, user must re-authenticate

### Revocation

User can revoke access via `/mcp` menu in Claude Code:
- Clears stored token
- Requires re-authentication for next API call
- Does NOT unregister server from Claude Code

---

## MCP Server Discovery

### How Claude Code Discovers OAuth Requirements

1. Claude Code makes initial request to MCP server
2. Server responds with `401 Unauthorized` + `WWW-Authenticate` header
3. Header points to OAuth metadata endpoint
4. Claude Code discovers OAuth configuration
5. Browser opens for user authorization

### Metadata Endpoint Format

Mittwald OAuth server should provide:

```json
{
  "issuer": "https://mittwald-oauth-server.fly.dev",
  "authorization_endpoint": "https://mittwald-oauth-server.fly.dev/authorize",
  "token_endpoint": "https://mittwald-oauth-server.fly.dev/token",
  "registration_endpoint": "https://mittwald-oauth-server.fly.dev/register",
  "scopes_supported": ["user:read", "app:read", "project:read", ...],
  "code_challenge_methods_supported": ["S256"],
  "grant_types_supported": ["authorization_code"],
  ...
}
```

Available at: `https://mittwald-oauth-server.fly.dev/.well-known/oauth-authorization-server`

---

## Server Management Commands

```bash
# List all MCP servers
claude mcp list

# Get details about a specific server
claude mcp get mittwald

# Remove a server
claude mcp remove mittwald

# Check authentication status
/mcp    # (within Claude Code)
```

---

## Testing OAuth Flow

### Manual Testing Steps

1. **Add server**:
   ```bash
   claude mcp add --transport http mittwald https://mittwald-mcp-fly2.fly.dev/mcp
   ```

2. **Start Claude Code**:
   ```bash
   claude
   ```

3. **Trigger authentication**:
   - Type `/mcp` to open MCP menu
   - Or start using Mittwald tools

4. **Observe browser**:
   - Browser opens automatically
   - User logs into Mittwald
   - User grants permissions
   - Browser redirects to callback

5. **Verify in Claude Code**:
   - `/mcp` shows "Authenticated" status
   - Mittwald server is listed and connected
   - Can now call MCP tools

### Example Test Commands

After authentication:
```bash
# List available Mittwald tools (should work if authenticated)
claude mcp call mittwald.user.get

# Expected response: Current user information
```

---

## Sources & References

### Official Documentation
- **Claude Code Docs**: https://code.claude.com/docs/en/mcp
- **Claude OAuth for MCP**: https://platform.claude.com/docs/en/agent-sdk/mcp

### Standards Referenced
- **OAuth 2.0 Authorization Code Flow**: RFC 6749
- **PKCE (Proof Key for Code Exchange)**: RFC 7636
- **Dynamic Client Registration**: RFC 7591
- **MCP Protocol**: https://modelcontextprotocol.io

### Community Resources
- **MCP Catalog**: https://mcpcat.io
- **FastMCP**: https://gofastmcp.com

---

## Summary Table

| Aspect | Detail |
|--------|--------|
| **Callback Pattern** | HTTP-based web (not RFC 8252 loopback) |
| **Callback URL** | `https://claude.ai/api/mcp/auth_callback` |
| **Registration Method** | Dynamic Client Registration (DCR) |
| **PKCE** | Automatic (S256) |
| **Token Storage** | Secure system keychain |
| **Token Refresh** | Automatic |
| **CLI Command** | `claude mcp add --transport http <name> <url>` |
| **Configuration Files** | `~/.claude.json` (user) or `.mcp.json` (project) |
| **Authentication** | Browser-based OAuth flow |
| **Time to Auth** | <1 minute (includes browser redirect) |

---

## Key Takeaways for Getting-Started Guide

1. **No loopback server needed** - Authentication is browser-based
2. **No manual PKCE configuration** - Fully automatic with S256
3. **No static redirect URI** - Uses Claude's fixed callback URL
4. **Mittwald must support DCR** - For automatic client registration
5. **Secure token storage** - Users don't handle tokens directly
6. **Simple command** - Just `claude mcp add --transport http mittwald <url>`

---

**Document Status**: Ready for guide writing
**Next Step**: Write WP06 - Claude Code Getting-Started Guide
