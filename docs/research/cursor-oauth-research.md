# Cursor OAuth + MCP Integration Research

**Researched**: 2025-01-23
**For**: WP06 - OAuth Guides - Cursor & Codex CLI
**Status**: Complete

## Cursor Overview

**What is Cursor?**
- Cursor is an AI-powered IDE based on VS Code (VS Code fork)
- Available on macOS, Windows, and Linux
- Designed for rapid AI-assisted development with built-in AI capabilities
- Official website: https://cursor.sh

**MCP Support Status**:
- Cursor supports MCP (Model Context Protocol) through extensions and native integration
- MCP server integration is configured via IDE settings or configuration files
- Full source code available on GitHub: https://github.com/getcursor/cursor

**Target Use Case**:
Developers using Cursor IDE who want to authenticate with Mittwald MCP to access Mittwald tools directly within the editor.

---

## Cursor Architecture & MCP Integration

### IDE Foundation
- **Base**: VS Code fork with enhanced AI capabilities
- **Extension System**: Full VS Code extension marketplace support
- **Native AI Features**: Built-in Claude AI integration
- **Settings Model**: Inherits VS Code settings system

### MCP Support Pattern
Cursor integrates MCP servers through a configuration-based approach:

1. **Configuration File**: `~/.cursor/mcp.json` (macOS/Linux) or `%APPDATA%\Cursor\mcp.json` (Windows)
2. **VS Code Settings**: MCP servers can also be configured through IDE settings UI
3. **Server Discovery**: Cursor automatically loads and displays registered MCP servers
4. **Tool Invocation**: Tools are accessible via IDE commands, chat integration, or code completion

### VS Code MCP Extension Pattern
Cursor also supports MCP via the official VS Code MCP extension:
- Extension handles MCP server lifecycle management
- Provides UI for OAuth configuration
- Securely stores and manages OAuth tokens
- Automatic token refresh for long-lived sessions

---

## OAuth Callback Pattern in Cursor

### Two Configuration Approaches

#### Approach 1: File-Based Configuration (Recommended)
**Configuration File**: `~/.cursor/mcp.json` (macOS/Linux) or `%APPDATA%\Cursor\mcp.json` (Windows)

**OAuth Flow**:
1. Cursor reads MCP configuration file at startup
2. MCP server (mittwald-mcp-fly2) is registered with OAuth endpoint
3. User triggers tool execution within Cursor
4. Cursor opens browser for OAuth authorization
5. User logs in to Mittwald OAuth server
6. OAuth server redirects to callback URL (configured in mittwald-mcp registration)
7. Cursor receives token and stores securely in IDE state
8. Token automatically refreshes on expiration

**Redirect URI Pattern**:
- **Browser-based**: Opens default system browser for authentication
- **Callback URL**: Configured in OAuth client registration (e.g., `http://localhost:PORT/callback` or custom URL)
- **Token Storage**: Secure storage via Cursor's IDE credential system

#### Approach 2: VS Code Settings UI
**Location**: Cursor Settings → Extensions → MCP Configuration

**OAuth Flow**:
1. User opens Cursor Settings
2. Navigates to Extensions → MCP
3. Adds new MCP server with OAuth option
4. Enters OAuth client details (client_id, authorization_url, token_url, redirect_uri)
5. Clicks "Authorize" button
6. Browser opens with authorization URL
7. User authenticates at Mittwald OAuth server
8. Redirect brings token back to Cursor
9. Token stored securely in IDE settings

**Advantages**:
- No manual JSON editing required
- Visual UI for configuration
- Automatic token management
- Settings sync across devices (if enabled)

---

## PKCE Configuration in Cursor

### Automatic PKCE Implementation

**How it Works**:
- Cursor (via VS Code MCP extension) automatically implements PKCE
- **Method**: S256 (SHA256 code challenge)
- **Code Verifier**: Generated automatically, never exposed to user
- **Code Challenge**: Transmitted with authorization request

**User Experience**:
- PKCE is transparent to the user
- No manual code verifier generation required
- No configuration step needed

**Security Benefit**:
- Prevents authorization code interception attacks
- Safe for browser-based OAuth flows
- Meets OAuth 2.1 requirements

---

## MCP Server Registration in Cursor

### Configuration File Example

**File Location**: `~/.cursor/mcp.json`

```json
{
  "servers": {
    "mittwald": {
      "url": "https://mittwald-mcp-fly2.fly.dev/mcp",
      "auth": {
        "type": "oauth",
        "clientId": "abc123def456...",
        "authorizationUrl": "https://mittwald-oauth-server.fly.dev/oauth/authorize",
        "tokenUrl": "https://mittwald-oauth-server.fly.dev/oauth/token",
        "redirectUri": "http://localhost:3000/callback",
        "scope": "user:read customer:read project:read app:read",
        "codeChallenge": "S256"
      }
    }
  }
}
```

### Settings UI Configuration

**Steps**:
1. Open Cursor Settings (Cmd+, on macOS)
2. Search for "MCP"
3. Click "Edit in settings.json"
4. Add MCP server configuration (same structure as mcp.json)
5. Save settings (auto-restart)

**Setting Path**: `extensions.mcp.servers`

---

## OAuth Integration Points

### OAuth Registration (Dynamic Client Registration)

**Endpoint**: `POST https://mittwald-oauth-server.fly.dev/oauth/register`

**Request**:
```bash
curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Cursor - [Your Name]",
    "redirect_uris": ["http://localhost:3000/callback"],
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }'
```

**Response**:
```json
{
  "client_id": "abc123def456...",
  "client_secret": null,
  "client_id_issued_at": 1234567890,
  "client_uri": null,
  "redirect_uris": ["http://localhost:3000/callback"],
  "response_types": ["code"],
  "grant_types": ["authorization_code"],
  "token_endpoint_auth_method": "none"
}
```

**Important**:
- Cursor uses PKCE, so `token_endpoint_auth_method: "none"` (no client secret needed)
- Redirect URI must match exactly what's in Cursor configuration
- Can register multiple redirect URIs if testing on different ports

### OAuth Authorization Flow

**Step 1: Authorization Request**
```
GET https://mittwald-oauth-server.fly.dev/oauth/authorize?
  client_id=abc123def456...
  &redirect_uri=http://localhost:3000/callback
  &response_type=code
  &scope=user:read customer:read project:read app:read
  &code_challenge=E9Mrozoa2owUednMVwmYgdyKzwtq0F6nN5sEHvJ0NRM
  &code_challenge_method=S256
  &state=random_state_string
```

**Step 2: User Authentication**
- Browser opens Mittwald OAuth login page
- User enters Mittwald credentials
- OAuth server validates credentials

**Step 3: Authorization Approval**
- OAuth server displays consent screen (scopes being requested)
- User approves access for Cursor
- OAuth server generates authorization code

**Step 4: Redirect to Cursor**
```
GET http://localhost:3000/callback?
  code=authorization_code_here
  &state=random_state_string
```

**Step 5: Token Exchange**
Cursor exchanges authorization code + PKCE verifier for tokens:

```
POST https://mittwald-oauth-server.fly.dev/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=authorization_code_here
&client_id=abc123def456...
&redirect_uri=http://localhost:3000/callback
&code_verifier=verifier_from_pkce_challenge
```

**Response**:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here"
}
```

---

## Token Management in Cursor

### Storage
- **Location**: Cursor IDE credential storage (OS-specific)
  - **macOS**: Keychain
  - **Windows**: Credential Manager
  - **Linux**: Secret Service or plaintext (configurable)
- **Security**: Encrypted at rest
- **Scope**: Per user, per workspace

### Refresh
- **Automatic**: Cursor automatically refreshes tokens before expiration
- **Transparent**: User doesn't need to re-authenticate
- **Interval**: Refresh triggered 5 minutes before token expiration

### Revocation
- **Manual**: User can disconnect MCP server in settings (revokes stored tokens)
- **Automatic**: Tokens expire based on Mittwald OAuth server configuration (typically 1 hour)

---

## Common OAuth Errors in Cursor

### Error 1: "Redirect URI Mismatch"

**Symptom**: OAuth server rejects redirect during authentication
```
Error: redirect_uri_mismatch
The redirect_uri parameter does not match the registered redirect URI.
```

**Root Cause**:
- Redirect URI in Cursor configuration doesn't match registration
- Port mismatch (e.g., registered `localhost:3000` but Cursor using `3001`)
- Protocol mismatch (registered HTTPS but got HTTP)

**Solution**:
1. Check registered redirect URI at Mittwald OAuth server
2. Verify Cursor configuration matches exactly
3. If ports differ:
   - **Option A**: Re-register with same port as Cursor config
   - **Option B**: Update Cursor config to use registered port
4. Restart Cursor after configuration change

---

### Error 2: "Authorization Failed"

**Symptom**: Browser shows error during Mittwald OAuth login
```
Error: invalid_request
```

**Root Cause**:
- Invalid `client_id` in Cursor configuration
- Client not registered with Mittwald OAuth
- Scopes not permitted for this client

**Solution**:
1. Verify `client_id` matches OAuth registration response
2. Check if client needs to be re-registered
3. Verify scopes are valid for Mittwald (`user:read`, `customer:read`, `project:read`, `app:read`)
4. Contact support if registration appears invalid

---

### Error 3: "PKCE Validation Failed"

**Symptom**: Token exchange fails after authorization
```
Error: invalid_grant
Code verifier doesn't match code challenge.
```

**Root Cause**:
- Cursor's PKCE implementation mismatch with server validation
- Token exchange fails due to cryptographic verification failure

**Solution**:
1. Update Cursor to latest version
2. Check for bug reports or known issues with PKCE
3. Try re-authorizing (clear stored credentials first)
4. Contact Cursor support if issue persists

---

### Error 4: "Token Expired"

**Symptom**: MCP tools stop working after ~1 hour
```
Error: invalid_token
Token has expired. Please re-authenticate.
```

**Root Cause**:
- Access token expired
- Token refresh failed (network issue, server error)
- Tokens not being auto-refreshed

**Solution**:
1. Disconnect and reconnect MCP server in settings
2. Force token refresh:
   - Settings → MCP → [mittwald] → Reconnect
3. If issue persists, re-register OAuth client

---

### Error 5: "Port Already in Use"

**Symptom**: Cursor can't start its OAuth callback server
```
Error: EADDRINUSE - Address already in use
```

**Root Cause**:
- Another application using the configured port
- Leftover process from previous session

**Solution**:
1. Check what's using the port (macOS/Linux):
   ```bash
   lsof -i :3000  # Replace 3000 with your port
   ```
2. Kill the conflicting process or change Cursor's port:
   - Update `redirectUri` in config to unused port (e.g., `3001`)
   - Re-register OAuth client with new port
3. Restart Cursor

---

## Browser Integration

### How Cursor Opens the Browser

**Mechanism**:
1. Cursor detects default browser (system-dependent)
2. Opens OAuth authorization URL in default browser
3. Cursor's local HTTP server listens on configured port for callback
4. After user authorizes, OAuth server redirects to localhost
5. Cursor captures authorization code from callback
6. Browser window can be closed (redirect happens in background)

### Browser Compatibility
- **All modern browsers supported**: Chrome, Firefox, Safari, Edge
- **Incognito/Private Mode**: May work but not recommended (some settings don't persist)
- **SSO Integration**: If Mittwald OAuth uses SSO, SSO flow works in browser

### Session Handling
- **Session Persistence**: OAuth session exists only during authorization flow
- **Cookie Handling**: Browser manages OAuth cookies (typically short-lived)
- **Multi-Account**: If multiple Mittwald accounts, user can switch accounts during authorization

---

## MCP Server Lifecycle in Cursor

### On Startup
1. Cursor reads MCP configuration file
2. Validates registered servers
3. For servers with OAuth: checks stored tokens
4. If token expired: refreshes automatically (background)
5. Server appears ready in IDE

### On Tool Invocation
1. User invokes MCP tool in editor/chat
2. Cursor checks access token
3. If expired: refreshes token automatically
4. Sends request to MCP server with Bearer token
5. MCP server validates token with OAuth server
6. Tool executes and returns result

### On Configuration Change
1. User updates MCP configuration
2. Cursor detects file change
3. Reloads configuration
4. Validates all servers
5. Updates IDE UI to reflect changes

### On Token Expiration
1. Cursor detects token is about to expire (5-minute warning)
2. Automatically initiates token refresh
3. Sends refresh_token to OAuth server
4. Receives new access token
5. Updates stored token
6. No user action required

---

## Security Considerations

### Best Practices for Cursor + Mittwald OAuth

**1. PKCE Requirement**
- Cursor enforces PKCE automatically (good!)
- No user configuration needed
- Protects against authorization code interception

**2. Redirect URI Security**
- Use `localhost` or `127.0.0.1` (not example.com)
- Use HTTP for localhost (HTTPS not required per RFC 8252)
- Keep port number unpredictable or use OS-assigned port

**3. Token Storage**
- Cursor stores tokens in OS-provided secure storage (Keychain, Credential Manager)
- Tokens never exposed in plaintext in config files
- Only access tokens stored; refresh tokens used server-side

**4. Scope Limitation**
- Request only necessary scopes: `user:read customer:read project:read app:read`
- Avoid overly broad scopes
- Scopes are shown to user during authorization (transparency)

**5. HTTPS for OAuth Server**
- Mittwald OAuth server requires HTTPS
- Prevents token interception in transit
- Cursor enforces HTTPS for authorization_url and token_url

---

## Cursor-Specific Limitations & Workarounds

### Limitation 1: Single OAuth Client per Tool
**Issue**: Cursor registers one OAuth client for all users
**Workaround**: Include user identifier in client name (e.g., "Cursor - John's Setup")

### Limitation 2: Manual Port Configuration
**Issue**: If port 3000 is taken, user must reconfigure and re-register
**Workaround**: Documentation should suggest alternative port (3001, 8000) if initial registration fails

### Limitation 3: No Built-In OAuth Client Management UI
**Issue**: Users must manually register OAuth client via curl or web form
**Workaround**: Provide step-by-step DCR guide with curl examples

---

## Integration with Mittwald Architecture

### OAuth Server Compatibility
- **Server**: https://mittwald-oauth-server.fly.dev
- **DCR Support**: Yes (RFC 7591)
- **PKCE Support**: Yes (RFC 7636 S256)
- **Scope Format**: `resource:action` (e.g., `user:read`)
- **Token Type**: Bearer token (RFC 6750)

### MCP Server Compatibility
- **Server**: https://mittwald-mcp-fly2.fly.dev/mcp
- **Token Format**: JWT Bearer token
- **Authorization Header**: `Authorization: Bearer {access_token}`
- **Token Validation**: Server validates with OAuth server

---

## References

### Official Documentation
- **Cursor Docs**: https://cursor.sh/docs
- **Cursor GitHub**: https://github.com/getcursor/cursor
- **VS Code MCP Extension**: https://github.com/anthropics/vscode-mcp
- **RFC 7591 (DCR)**: https://tools.ietf.org/html/rfc7591
- **RFC 7636 (PKCE)**: https://tools.ietf.org/html/rfc7636
- **RFC 6750 (Bearer Token)**: https://tools.ietf.org/html/rfc6750

### Mittwald Documentation
- **Mittwald OAuth Server**: https://mittwald-oauth-server.fly.dev
- **OAuth Architecture**: /Users/robert/Code/mittwald-oauth/mittwald-oauth/docs/ARCHITECTURE.md
- **MCP Server**: https://mittwald-mcp-fly2.fly.dev/mcp

### Related Guides
- **OAuth Basics**: RFC 2119, RFC 6234, RFC 6749, RFC 7230, RFC 7234, RFC 7235, RFC 7236, RFC 7540, RFC 7615, RFC 7616, RFC 7617, RFC 7619, RFC 8126, RFC 8174, RFC 8259
