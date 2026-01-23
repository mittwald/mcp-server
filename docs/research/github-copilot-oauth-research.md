# GitHub Copilot OAuth + MCP Integration Research

**Researched**: 2026-01-23
**For**: WP05 - Getting-Started Guides
**Status**: Complete

---

## Executive Summary

GitHub Copilot (in VS Code, Visual Studio, JetBrains, Xcode) supports OAuth 2.0 authentication for remote MCP servers. Configuration differs from Claude Code: Copilot uses IDE-specific configuration files (`mcp.json`), not CLI commands. GitHub provides both web-based OAuth and Personal Access Token (PAT) authentication options. The coding agent does NOT yet support OAuth (PAT-based only).

---

## OAuth Callback Pattern

### Protocol & Standard

GitHub Copilot uses **IDE-integrated OAuth 2.0** with browser-based authorization. Copilot supports both:

1. **Dynamic Client Registration (DCR)** - Automatic client setup
2. **Client Credentials** - Manual client ID/secret configuration

### Authentication Flow (OAuth)

1. **User opens IDE with Copilot**
   - VS Code, Visual Studio, JetBrains, or Xcode

2. **User configures MCP server** in `mcp.json`:
   ```json
   {
     "mcpServers": {
       "mittwald": {
         "url": "https://mittwald-mcp-fly2.fly.dev/mcp"
       }
     }
   }
   ```

3. **Copilot discovers OAuth requirements**
   - Server responds with `401` + `WWW-Authenticate` header
   - Copilot reads OAuth metadata endpoint

4. **User authenticates**
   - "Auth" button appears in IDE next to server config
   - Click button → browser opens for OAuth
   - User logs in with Mittwald account
   - Grants permission

5. **Token stored and used**
   - IDE stores token securely
   - Subsequent API calls include Bearer token

### Callback URL Pattern

GitHub Copilot's callback URL varies by IDE and implementation:

| IDE | Callback Pattern |
|-----|-----------------|
| **VS Code** | IDE-handled callback (internal) |
| **Visual Studio** | IDE-handled callback (internal) |
| **JetBrains** | IDE-handled callback (internal) |
| **Xcode** | IDE-handled callback (internal) |

**Key point**: Unlike Claude Code with a fixed `https://claude.ai/api/mcp/auth_callback`, GitHub Copilot handles callbacks internally through the IDE. The OAuth server doesn't need to know the exact callback URL - it's discovered via DCR or provided in client credentials configuration.

### Dynamic Client Registration Support

**How DCR works in Copilot** (2025+):

1. IDE sends DCR request to Mittwald OAuth server
2. OAuth server registers IDE as client
3. OAuth server returns client_id (and optionally client_secret)
4. IDE uses client_id for OAuth flow
5. No manual client credentials needed

**Fallback if DCR fails**:
- If OAuth server doesn't support DCR
- Copilot falls back to client-credentials workflow
- User must manually provide client_id/client_secret in `mcp.json`

---

## PKCE Configuration

### PKCE Status

**PKCE**: Automatically handled by Copilot
**Code Challenge Method**: S256 (SHA-256)

### How it Works

- Copilot automatically generates PKCE parameters
- No manual configuration required
- Developer doesn't configure PKCE directly

### Configuration Location

- **No configuration needed** - fully automatic
- PKCE is transparent to the user

---

## MCP Server Registration

### Configuration-Based Setup (Not CLI)

Unlike Claude Code (CLI), GitHub Copilot uses **IDE configuration file** approach.

### Configuration File Format

**Location**: `~/.copilot/mcp.json` or `.copilot/mcp.json` (IDE-specific)

**Basic configuration**:
```json
{
  "mcpServers": {
    "mittwald": {
      "url": "https://mittwald-mcp-fly2.fly.dev/mcp"
    }
  }
}
```

**With manual client credentials** (if DCR doesn't work):
```json
{
  "mcpServers": {
    "mittwald": {
      "url": "https://mittwald-mcp-fly2.fly.dev/mcp",
      "authentication": {
        "clientId": "your-client-id",
        "clientSecret": "your-client-secret"
      }
    }
  }
}
```

**With headers** (for static tokens):
```json
{
  "mcpServers": {
    "mittwald": {
      "url": "https://mittwald-mcp-fly2.fly.dev/mcp",
      "headers": {
        "Authorization": "Bearer your-token"
      }
    }
  }
}
```

### IDE-Specific Setup Instructions

#### Visual Studio Code
1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Search "MCP: Configure MCP Servers"
3. Edit `mcp.json` in editor
4. Add mittwald server entry
5. Save file
6. Copilot will offer OAuth authentication

#### Visual Studio (2024.14+)
1. Open GitHub Copilot Chat panel
2. Switch to Agent mode
3. Click tools icon
4. Add new server
5. **Server ID**: `mittwald`
6. **Type**: HTTP/SSE
7. **URL**: `https://mittwald-mcp-fly2.fly.dev/mcp`
8. Save and authenticate

#### JetBrains IDEs
1. Go to Settings/Preferences → Tools → GitHub Copilot
2. MCP Servers section
3. Add new server
4. **Name**: mittwald
5. **URL**: `https://mittwald-mcp-fly2.fly.dev/mcp`
6. Save and authenticate

#### Xcode
1. Preferences → GitHub Copilot
2. MCP Servers
3. Add server
4. **URL**: `https://mittwald-mcp-fly2.fly.dev/mcp`
5. Save and authenticate

### Credentials & Token Storage

**Where tokens are stored**:
- IDE-specific secure storage (varies by IDE)
- VS Code: Uses system credential manager
- Visual Studio: VS credential manager
- JetBrains: IDE credential storage
- Xcode: Keychain

**Authentication flow**:
1. User clicks "Auth" button next to server in IDE
2. Browser opens with OAuth authorization
3. User logs in and grants permissions
4. IDE stores token securely
5. Subsequent API calls use stored token

### OAuth vs PAT Authentication

**OAuth** (Recommended):
- Automatic with DCR
- Browser-based authorization
- User-friendly
- Time-limited tokens

**Personal Access Token** (PAT):
- Manual setup
- Static token
- Use in `Authorization: Bearer <PAT>` header
- Works for authentication but not recommended long-term

---

## Common OAuth Errors & Solutions

### Error 1: "Failed to authenticate with server"

**Symptoms**:
- "Auth" button in IDE doesn't work
- Browser doesn't open
- OAuth flow doesn't complete

**Causes**:
- IDE not connected to internet
- Firewall blocking OAuth server
- OAuth server unreachable
- IDE browser integration disabled

**Solutions**:
```bash
# 1. Verify OAuth server is reachable:
curl https://mittwald-oauth-server.fly.dev/.well-known/oauth-authorization-server

# 2. Check mcp.json is valid JSON:
# Open in IDE and check for syntax errors

# 3. Retry authentication:
# - Remove server from mcp.json
# - Add again
# - Click Auth button
```

### Error 2: "Redirect URI mismatch"

**Symptoms**:
- OAuth error about redirect_uri
- Server rejects OAuth callback
- Error: "redirect_uri not registered"

**Causes**:
- Mittwald OAuth doesn't support DCR
- OAuth server not configured for IDE callback
- Client credentials not registered

**Solutions**:

**If using DCR**:
1. Verify Mittwald OAuth supports RFC 7591
2. Check metadata endpoint: `https://mittwald-oauth-server.fly.dev/.well-known/oauth-authorization-server`
3. Ensure `registration_endpoint` is present
4. Retry authentication

**If DCR fails, use manual credentials**:
1. Register client manually with Mittwald OAuth:
   ```bash
   curl -X POST https://mittwald-oauth-server.fly.dev/register \
     -H "Content-Type: application/json" \
     -d '{
       "client_name": "GitHub Copilot - [IDE Name]",
       "redirect_uris": ["http://localhost:3000/callback"],
       "grant_types": ["authorization_code"],
       "token_endpoint_auth_method": "none"
     }'
   ```

2. Get `client_id` from response

3. Add to `mcp.json`:
   ```json
   {
     "mcpServers": {
       "mittwald": {
         "url": "https://mittwald-mcp-fly2.fly.dev/mcp",
         "authentication": {
           "clientId": "your-client-id"
         }
       }
     }
   }
   ```

4. Retry authentication

### Error 3: "Invalid OAuth metadata"

**Symptoms**:
- Error about OAuth configuration
- "Cannot read OAuth endpoints"
- Metadata endpoint returns error

**Causes**:
- OAuth server metadata endpoint broken
- Invalid JSON in response
- `.well-known/oauth-authorization-server` not configured

**Solutions**:
1. Test metadata endpoint:
   ```bash
   curl -i https://mittwald-oauth-server.fly.dev/.well-known/oauth-authorization-server
   # Should return 200 with valid JSON
   ```

2. Check response contains:
   - `issuer`
   - `authorization_endpoint`
   - `token_endpoint`
   - `registration_endpoint` (for DCR)

3. If broken, check Mittwald OAuth server is running

4. Verify OAuth server supports Copilot (may need new endpoints)

### Error 4: "PKCE validation failed"

**Symptoms**:
- OAuth fails during token exchange
- Error mentions code_verifier/code_challenge
- Generic "authorization failed"

**Causes**:
- Mittwald OAuth doesn't support PKCE
- PKCE parameters invalid
- Code exchange fails

**Solutions**:
1. Verify Mittwald OAuth supports PKCE (RFC 7636)
2. Check `/token` endpoint accepts `code_verifier`
3. Retry (IDE will attempt again)
4. If persists, contact Mittwald support

### Error 5: "Access token expired"

**Symptoms**:
- Copilot stops working after some time
- API calls fail with 401
- "Not authenticated" message

**Causes**:
- OAuth token expired (typical: 1 hour)
- Refresh token invalid
- Credentials revoked on OAuth server

**Solutions**:
```bash
# 1. Re-authenticate:
# - Click "Auth" button in IDE again
# - Or restart IDE

# 2. If issue persists:
# - Remove server from mcp.json
# - Remove from IDE
# - Add back fresh
# - Re-authenticate
```

---

## Coding Agent Limitations

### Important: Coding Agent Doesn't Support OAuth

As of 2026, GitHub Copilot's **coding agent does NOT support OAuth** for MCP servers.

**Limitation**: Coding agent requires PAT or static authentication tokens, not OAuth.

**For OAuth servers**:
- Use Copilot Chat (conversational mode)
- Coding agent requires PAT-based servers

**Solution for Mittwald**:
- Provide both OAuth (for Chat) and PAT (for Coding Agent)
- Or provide PAT-based access for coding agent users

---

## Token Management

### Token Lifecycle

1. **Token obtained** during OAuth authorization
2. **Token stored** securely by IDE
3. **Token used** for API calls (automatic Bearer token)
4. **Token refreshed** automatically when expired (if refresh_token available)
5. **Token cleared** when user revokes access

### Token Refresh

- **Automatic**: IDE handles refresh transparently (if supported)
- **Manual**: User may need to re-authenticate if refresh fails

### Revocation

- User can revoke access in IDE settings
- IDE removes stored token
- Requires re-authentication for next use

---

## IDE Configuration Files

### VS Code
- **Location**: `~/.copilot/mcp.json`
- **Scope**: Global for all VS Code instances
- **Format**: JSON

### Visual Studio
- **Location**: IDE settings (UI-based configuration)
- **Scope**: Per-machine
- **Format**: IDE settings storage

### JetBrains
- **Location**: IDE-specific config directory
- **Scope**: Per IDE instance
- **Format**: IDE settings

### Xcode
- **Location**: Xcode build settings / Keychain
- **Scope**: Project-specific
- **Format**: Xcode configuration

---

## Server Discovery & Metadata

### How Copilot Discovers OAuth

1. IDE connects to MCP server URL
2. Server responds with `401 Unauthorized`
3. Response includes `WWW-Authenticate` header
4. Header points to OAuth metadata endpoint
5. Copilot fetches metadata from endpoint
6. Shows OAuth authentication option to user

### Required OAuth Metadata

Mittwald OAuth should provide at: `https://mittwald-oauth-server.fly.dev/.well-known/oauth-authorization-server`

```json
{
  "issuer": "https://mittwald-oauth-server.fly.dev",
  "authorization_endpoint": "https://mittwald-oauth-server.fly.dev/authorize",
  "token_endpoint": "https://mittwald-oauth-server.fly.dev/token",
  "registration_endpoint": "https://mittwald-oauth-server.fly.dev/register",
  "scopes_supported": ["user:read", "app:read", "project:read", ...],
  "code_challenge_methods_supported": ["S256"],
  "grant_types_supported": ["authorization_code"],
  "response_types_supported": ["code"],
  "token_endpoint_auth_methods_supported": ["none", "client_secret_basic"],
  ...
}
```

---

## Testing OAuth Flow in Copilot

### Manual Testing Steps

1. **Create/edit `mcp.json`**:
   ```json
   {
     "mcpServers": {
       "mittwald": {
         "url": "https://mittwald-mcp-fly2.fly.dev/mcp"
       }
     }
   }
   ```

2. **Open IDE** with Copilot enabled

3. **Look for "Auth" button** next to mittwald server

4. **Click "Auth"**:
   - Browser opens
   - User logs into Mittwald
   - Grant permissions
   - Browser redirects

5. **Verify in IDE**:
   - "Auth" button changes (shows authenticated state)
   - Can now use mittwald tools in Copilot Chat
   - For coding agent: PAT required (not OAuth)

### Example Test in Copilot Chat

After authentication:
```
@mittwald List my projects
```

Expected: Returns list of Mittwald projects the user has access to.

---

## Differences from Claude Code

| Aspect | Claude Code | GitHub Copilot |
|--------|-------------|----------------|
| **Setup Method** | CLI command | IDE configuration file |
| **Configuration File** | `~/.claude.json` | `mcp.json` (IDE-specific) |
| **Callback URL** | `https://claude.ai/api/mcp/auth_callback` | IDE-handled (internal) |
| **DCR Support** | Yes, automatic | Yes, with fallback |
| **PKCE** | S256, automatic | S256, automatic |
| **Token Storage** | System keychain | IDE credential manager |
| **Chat Support** | Yes | Yes |
| **Coding Agent Support** | N/A | Chat only (not agent) |
| **PAT Support** | Limited | Yes, full support |

---

## Sources & References

### Official Documentation
- **GitHub Copilot MCP Setup**: https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/set-up-the-github-mcp-server
- **GitHub MCP Server**: https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/use-the-github-mcp-server
- **Copilot Coding Agent with MCP**: https://docs.github.com/copilot/how-tos/agents/copilot-coding-agent/extending-copilot-coding-agent-with-mcp

### Enhanced OAuth Support
- **2025 Changelog**: GitHub Blog - Enhanced MCP OAuth support for JetBrains, Eclipse, and Xcode
- **IDEs Supported**: VS Code, Visual Studio, JetBrains, Xcode

### Standards Referenced
- **OAuth 2.0**: RFC 6749
- **PKCE**: RFC 7636
- **Dynamic Client Registration**: RFC 7591
- **MCP Protocol**: https://modelcontextprotocol.io

---

## Summary Table

| Aspect | Detail |
|--------|--------|
| **Setup Method** | IDE configuration file (`mcp.json`) |
| **Callback Pattern** | IDE-internal (not fixed URL) |
| **Registration Method** | Dynamic Client Registration (with fallback) |
| **PKCE** | Automatic (S256) |
| **Token Storage** | IDE credential manager |
| **Token Refresh** | Automatic (if supported) |
| **Configuration Format** | JSON in IDE settings |
| **Authentication** | Browser-based OAuth or PAT |
| **Chat Support** | Yes, fully supported |
| **Coding Agent Support** | PAT only (not OAuth) |

---

## Key Takeaways for Getting-Started Guide

1. **IDE-based setup** - Use `mcp.json`, not CLI
2. **DCR recommended** - Automatic, no manual credentials needed
3. **Browser-based OAuth** - IDE handles callback internally
4. **PKCE automatic** - No manual configuration
5. **IDE-specific locations** - Configuration file location varies by IDE
6. **Coding agent limitation** - Use PAT for coding agent, OAuth for chat
7. **Token management** - IDE handles storage and refresh

---

**Document Status**: Ready for guide writing
**Next Step**: Write WP08 - GitHub Copilot Getting-Started Guide

---

**Important Note for Guide Writers**:

When writing GitHub Copilot guide, clarify:
1. Guide is for **Copilot Chat** (OAuth), not coding agent (PAT only)
2. Configuration differs by IDE (VS Code vs Visual Studio vs JetBrains vs Xcode)
3. Can provide multiple IDE sections or single generic section
4. Link to official IDE-specific docs for detailed UI walkthrough
5. Emphasize "Auth" button in IDE for OAuth authentication
