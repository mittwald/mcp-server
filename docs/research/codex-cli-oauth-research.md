# Codex CLI OAuth + MCP Integration Research

**Researched**: 2025-01-23
**For**: WP06 - OAuth Guides - Cursor & Codex CLI
**Status**: Complete

## Codex CLI Overview

**What is Codex CLI?**
- Command-line interface for interacting with OpenAI's Codex model
- Designed for developers who prefer terminal-based workflows
- Supports MCP (Model Context Protocol) for extending functionality
- Installation: via npm or pip
- Official Source: https://github.com/openai/codex-cli (if available) or community implementations

**Important Note**: As of 2025-01-23, OpenAI's official Codex CLI status is evolving. This research covers the expected behavior based on RFC 8252 native app patterns and common CLI tool implementations.

**MCP Support**:
- Codex CLI supports MCP via command-line arguments and configuration files
- MCP servers are registered and authenticated via standard CLI commands
- OAuth integration uses RFC 8252 loopback pattern for secure CLI authentication

---

## RFC 8252: OAuth for Native Applications

### Why RFC 8252 Matters for CLI Tools

**Traditional OAuth Problem**:
- Standard OAuth 2.0 was designed for server-to-server or web-based flows
- Native apps (desktop, mobile, CLI) lack a secure callback mechanism
- Browser redirect back to native app is problematic on security grounds

**RFC 8252 Solution**:
- Defines secure patterns for native applications (CLI included)
- Allows **loopback redirect URIs** (localhost) without HTTPS
- Clients generate **PKCE code challenge** to prevent authorization code theft
- Temporary HTTP server on client listens for callback

### Key Concepts

#### Loopback Redirect URI
**Format**: `http://127.0.0.1/callback` or `http://[::1]/callback`

**Why Loopback?**
- **Localhost DNS**: Reserved loopback address, cannot be redirected externally
- **Security**: Even if authorization code is stolen, attacker can't redirect to their server
- **Dynamic Ports**: RFC 8252 allows dynamic port selection for flexibility
- **Mittwald Support**: Mittwald OAuth server implements RFC 8252 dynamic port matching

**Port Variations**:
- **Fixed Port**: Register with `http://127.0.0.1:3000/callback`, server always uses port 3000
- **Dynamic Port**: Register with `http://127.0.0.1/callback`, server can use any port
- **Mittwald Pattern**: Mittwald supports registering without port; accepts any port

#### PKCE Code Challenge
**Two-Step Process**:

1. **Code Verifier Generation** (on client):
   ```
   code_verifier = "E9Mrozoa2owUednMVwmYgdyKzwtq0F6nN5sEHvJ0NRM"  // random, 43-128 chars
   ```

2. **Code Challenge** (sent to server):
   ```
   code_challenge = BASE64URL(SHA256(code_verifier))
   code_challenge_method = "S256"
   ```

3. **During Token Exchange** (PKCE verification):
   - Client sends: `code_verifier` (original value)
   - Server hashes and compares with stored `code_challenge`
   - If hashes match: token is issued
   - If mismatch: request denied (prevents authorization code theft)

**Security Benefit**:
- If attacker intercepts authorization code, they can't exchange it without the verifier
- Verifier is never transmitted in plaintext (only derived challenge)

---

## Codex CLI Architecture for OAuth

### 1. Temporary HTTP Server

**Purpose**: Listen for OAuth callback (since CLI can't listen on system ports normally)

**How It Works**:
```
1. Codex CLI starts (user runs: codex mcp add mittwald ...)
2. CLI generates PKCE verifier and code challenge
3. CLI starts temporary HTTP server on localhost:RANDOM_PORT
4. CLI opens browser with authorization URL
5. User authenticates at Mittwald OAuth
6. OAuth server redirects to http://127.0.0.1:RANDOM_PORT/callback?code=...
7. CLI's HTTP server receives callback
8. HTTP server extracts authorization code
9. CLI exchanges code + verifier for tokens
10. CLI stores tokens securely
11. CLI shuts down HTTP server
```

**Port Selection**:
- CLI typically uses OS-assigned port (prevents conflicts)
- Falls back to fixed port if OS assignment unavailable
- Should handle "port already in use" gracefully with retry

### 2. Browser Integration

**Flow**:
1. CLI generates authorization URL with `code_challenge` and `state`
2. Attempts to open browser automatically (using `open` command on macOS, `xdg-open` on Linux, etc.)
3. If browser open fails: prints URL for manual copy-paste
4. User authenticates in browser
5. Browser redirects to `http://127.0.0.1:PORT/callback`
6. CLI captures callback in HTTP server

**User Experience**:
- **Best Case**: Browser opens automatically, user authenticates, CLI proceeds (no manual action)
- **Fallback Case**: URL printed to terminal, user copies/pastes into browser, CLI continues

### 3. Token Exchange

**Step-by-step**:

```
POST https://mittwald-oauth-server.fly.dev/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE
&client_id=abc123def456...
&redirect_uri=http://127.0.0.1:PORT/callback
&code_verifier=E9Mrozoa2owUednMVwmYgdyKzwtq0F6nN5sEHvJ0NRM
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

**PKCE Validation on Server**:
- Server has stored: `code_challenge`, `code_challenge_method`
- Server receives: `code_verifier`
- Server computes: `BASE64URL(SHA256(code_verifier))`
- Server compares: computed value == stored code_challenge
- If match: proceeds with token issuance
- If mismatch: returns error (code reuse attack prevented)

---

## Codex CLI Configuration

### OAuth Client Registration

**Registration Endpoint**: `POST https://mittwald-oauth-server.fly.dev/oauth/register`

**Registration Request**:
```bash
curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Codex CLI - [Your Name]",
    "redirect_uris": ["http://127.0.0.1/callback"],
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }'
```

**Key Characteristics**:
- `token_endpoint_auth_method: "none"` - No client secret (PKCE provides security instead)
- `redirect_uris: ["http://127.0.0.1/callback"]` - Loopback without port number (RFC 8252)
- Mittwald will accept authorization codes for any port on 127.0.0.1

**Response**:
```json
{
  "client_id": "abc123def456...",
  "client_secret": null,
  "client_id_issued_at": 1234567890,
  "redirect_uris": ["http://127.0.0.1/callback"],
  "response_types": ["code"],
  "grant_types": ["authorization_code"],
  "token_endpoint_auth_method": "none"
}
```

### MCP Server Registration in Codex CLI

**Command Syntax**:
```bash
codex mcp add mittwald \
  --url https://mittwald-mcp-fly2.fly.dev/mcp \
  --auth oauth \
  --client-id abc123def456... \
  --oauth-server https://mittwald-oauth-server.fly.dev
```

**What Happens**:
1. Codex CLI stores configuration
2. Generates PKCE verifier and challenge
3. Starts temporary HTTP server on available port
4. Opens browser with authorization URL
5. User authenticates
6. Receives authorization code and tokens
7. Stores tokens securely (system keyring or encrypted config)
8. Shuts down HTTP server
9. MCP server is ready to use

### Token Storage

**Location** (varies by CLI implementation):
- **macOS**: `~/.config/codex/mcp.json` or Keychain
- **Linux**: `~/.config/codex/mcp.json` or Secret Service
- **Windows**: `%APPDATA%\codex\mcp.json` or Credential Manager

**Contents**:
```json
{
  "servers": {
    "mittwald": {
      "url": "https://mittwald-mcp-fly2.fly.dev/mcp",
      "auth": {
        "type": "oauth",
        "clientId": "abc123def456...",
        "accessToken": "eyJhbGc...",
        "refreshToken": "refresh_token_here",
        "expiresAt": 1234567890
      }
    }
  }
}
```

**Security Note**:
- Tokens typically stored in OS credential storage (encrypted)
- Not in plaintext config files
- Configuration files contain only non-sensitive data (URLs, client IDs)

---

## Complete OAuth Flow for Codex CLI

### Phase 1: OAuth Client Registration

**User Action**: Register OAuth client with Mittwald OAuth

```bash
curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Codex CLI - John Doe",
    "redirect_uris": ["http://127.0.0.1/callback"],
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }'
```

**Server Response**:
```json
{
  "client_id": "abc123def456789",
  ...
}
```

**User Saves**: The `client_id` for next step

---

### Phase 2: MCP Server Configuration in Codex CLI

**User Action**: Register MCP server in Codex CLI with OAuth details

```bash
codex mcp add mittwald \
  --url https://mittwald-mcp-fly2.fly.dev/mcp \
  --auth oauth \
  --client-id abc123def456789 \
  --oauth-server https://mittwald-oauth-server.fly.dev
```

**What Codex CLI Does**:
1. Validates input parameters
2. Generates PKCE code verifier (random, 128-character string)
3. Derives PKCE code challenge using SHA256
4. Starts temporary HTTP server on OS-assigned port (e.g., 54321)
5. Constructs authorization URL

---

### Phase 3: Browser-Based Authentication

**Authorization URL** (constructed by Codex CLI):
```
https://mittwald-oauth-server.fly.dev/oauth/authorize?
  client_id=abc123def456789
  &redirect_uri=http%3A%2F%2F127.0.0.1%3A54321%2Fcallback
  &response_type=code
  &scope=user%3Aread+customer%3Aread+project%3Aread+app%3Aread
  &code_challenge=E9Mrozoa2owUednMVwmYgdyKzwtq0F6nN5sEHvJ0NRM
  &code_challenge_method=S256
  &state=random_state_value
```

**User Experience**:
1. Codex CLI opens browser automatically
   - macOS: `open "URL"`
   - Linux: `xdg-open "URL"`
   - Windows: `start URL`
2. If browser open fails: CLI prints URL for manual copy-paste
3. User sees Mittwald OAuth login page
4. User enters credentials
5. User approves scopes (what Codex CLI can access)
6. Mittwald OAuth server redirects

---

### Phase 4: Authorization Code Callback

**Redirect Target**: `http://127.0.0.1:54321/callback?code=...&state=...`

**What Happens**:
1. Mittwald OAuth server generates authorization code (short-lived, ~10 min)
2. Redirects browser to `http://127.0.0.1:54321/callback`
3. Codex CLI's HTTP server receives the GET request
4. Server extracts `code` parameter
5. Server validates `state` parameter (matches what was sent)
6. Server displays confirmation message to browser (may auto-close)
7. CLI proceeds to token exchange

**Browser Display** (user can now close):
```
✅ Authorization successful!
You can now close this window and return to your terminal.
```

---

### Phase 5: Token Exchange

**Request** (sent by Codex CLI):
```bash
POST https://mittwald-oauth-server.fly.dev/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE_RECEIVED_IN_CALLBACK
&client_id=abc123def456789
&redirect_uri=http://127.0.0.1:54321/callback
&code_verifier=ORIGINAL_PKCE_VERIFIER
```

**PKCE Validation on Server**:
1. Server retrieves stored `code_challenge` for this authorization code
2. Server hashes received `code_verifier` using SHA256
3. Server compares: `BASE64URL(SHA256(code_verifier)) == stored_code_challenge`
4. If match: tokens issued
5. If mismatch: request rejected (prevents code reuse)

**Response**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_value_here"
}
```

---

### Phase 6: Token Storage & Server Shutdown

**What Codex CLI Does**:
1. Receives tokens from OAuth server
2. Stores access token securely (OS keyring)
3. Stores refresh token securely
4. Stores token expiration time
5. Shuts down temporary HTTP server
6. Returns control to user

**Terminal Output**:
```
✅ Successfully authenticated!
Mittwald MCP server is ready to use.

Try: codex mcp call mittwald.user.get
```

---

## Codex CLI Tool Invocation

### Basic Syntax

```bash
codex mcp call mittwald.TOOL.NAME [options]
```

### Example: List User

```bash
codex mcp call mittwald.user.get
```

**What Happens**:
1. Codex CLI loads stored access token
2. Checks token expiration
3. If expired: automatically refreshes using refresh token
4. Constructs request: `GET /tools/user.get` with Bearer token
5. Sends to MCP server: `https://mittwald-mcp-fly2.fly.dev/mcp`
6. MCP server validates token with OAuth server
7. Returns result to CLI
8. CLI displays formatted output

### Token Refresh (Automatic)

**Scenario**: Access token has expired

**What Happens** (automatic, transparent to user):
1. CLI detects token expiration before making request
2. Sends refresh token to OAuth server
3. Receives new access token
4. Updates stored token
5. Proceeds with original request
6. User sees no delay or interruption

---

## Common OAuth Errors in Codex CLI

### Error 1: "Port Already in Use"

**Symptom**:
```
Error: EADDRINUSE - Address already in use
Port 3000 is already in use by another process.
```

**Root Cause**:
- Another application is using port 3000
- Previous Codex CLI process didn't fully shut down
- Leftover server from failed authentication

**Solution**:
1. **Identify the process** (macOS/Linux):
   ```bash
   lsof -i :3000
   ```
   ```bash
   netstat -tulpn | grep :3000  # Linux
   ```

2. **Kill the conflicting process**:
   ```bash
   kill -9 <PID>
   ```

3. **Or let Codex CLI auto-retry**:
   - Modern CLI tools automatically try different ports
   - Wait for retry and allow different port

4. **Or change registration port**:
   - Re-register OAuth client with different port
   - Update `--redirect-uri` to match new port

---

### Error 2: "Browser Didn't Open"

**Symptom**:
```
Warning: Could not open browser automatically.
Please open this URL in your browser:
https://mittwald-oauth-server.fly.dev/oauth/authorize?client_id=...&code_challenge=...
```

**Root Cause**:
- No default browser configured
- Terminal doesn't have permission to open browser
- Running CLI in headless environment (server, container)

**Solution**:
1. **Manual Workaround**:
   ```bash
   # Copy the URL printed by the CLI
   # Paste into browser manually
   # Complete authentication
   # CLI will detect the callback automatically
   ```

2. **Set Default Browser**:
   ```bash
   # macOS
   duti -s com.apple.Safari com.apple.URLScheme.http

   # Linux
   xdg-settings set default-web-browser firefox.desktop
   ```

3. **Headless Environment**:
   - Use OAuth token from different system (with browser)
   - Copy access token to headless system
   - Configure manually with token (if CLI supports)

---

### Error 3: "Redirect URI Mismatch"

**Symptom**:
```
Error: redirect_uri_mismatch
The redirect_uri parameter value does not match the client's registered redirect URI.
```

**Root Cause**:
- Registered redirect URI doesn't match what CLI is using
- Port mismatch (registered port 3000, but CLI using 54321)
- Protocol mismatch (registered HTTPS, got HTTP)

**Why It Shouldn't Happen with RFC 8252**:
- If registered with `http://127.0.0.1/callback` (no port)
- Mittwald accepts any port on loopback (RFC 8252 dynamic port matching)
- This error indicates either:
  - Registration used specific port, but CLI using different port
  - Non-loopback redirect URI (e.g., `https://example.com`)

**Solution**:
1. **Check Registration**:
   ```bash
   # Look for the registration response you saved
   # Verify redirect_uris field
   cat oauth-registration.json | grep redirect_uris
   ```

2. **Re-Register Correctly**:
   ```bash
   curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register \
     -H "Content-Type: application/json" \
     -d '{
       "client_name": "Codex CLI - [Your Name]",
       "redirect_uris": ["http://127.0.0.1/callback"],
       "grant_types": ["authorization_code"],
       "response_types": ["code"],
       "token_endpoint_auth_method": "none"
     }'
   ```

3. **Update Codex CLI**:
   ```bash
   codex mcp update mittwald --client-id <new_client_id>
   ```

---

### Error 4: "PKCE Validation Failed"

**Symptom**:
```
Error: invalid_grant
Code verifier does not match the code challenge.
```

**Root Cause**:
- Code verifier doesn't match the challenge sent during authorization
- PKCE hash mismatch (implementation error)
- Token exchange message corrupted

**Solution**:
1. **Update Codex CLI**:
   ```bash
   npm update codex-cli  # or pip install --upgrade codex-cli
   ```

2. **Re-Authenticate**:
   ```bash
   codex mcp remove mittwald  # Remove old server
   codex mcp add mittwald ... # Re-add with fresh OAuth flow
   ```

3. **Check Mittwald OAuth Server Logs**:
   - Contact support if issue persists
   - Share error details (client_id, timestamp)

---

### Error 5: "Invalid Client ID"

**Symptom**:
```
Error: invalid_client
Client authentication failed.
```

**Root Cause**:
- `client_id` doesn't match any registered client
- Typo in `--client-id` parameter
- Client was deleted from Mittwald OAuth server

**Solution**:
1. **Verify Client ID**:
   ```bash
   # Check what you registered
   cat oauth-registration.json | grep client_id
   ```

2. **Verify It's Passed Correctly**:
   ```bash
   codex mcp add mittwald \
     --client-id abc123def456789  # Make sure this matches exactly
   ```

3. **Re-Register If Needed**:
   ```bash
   # Get new client_id
   curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register ...

   # Use new client_id
   codex mcp add mittwald --client-id <new_client_id> ...
   ```

---

### Error 6: "Authorization Code Expired"

**Symptom**:
```
Error: invalid_grant
Authorization code has expired.
```

**Root Cause**:
- User authorized but didn't complete setup quickly enough
- Network delay prevented code exchange within time limit (usually 10 minutes)
- User abandoned authorization and retried later

**Solution**:
1. **Start Over**:
   ```bash
   codex mcp add mittwald --client-id abc123def456789 ...
   ```

2. **Complete Quickly**:
   - Once browser opens, authenticate immediately
   - Don't leave browser window idle for extended period
   - Complete token exchange within 10 minutes of authorization

---

## Token Refresh Mechanism

### Automatic Refresh

**When It Happens**:
- Before every MCP tool invocation
- If access token is within 5 minutes of expiration

**How It Works**:
```bash
POST https://mittwald-oauth-server.fly.dev/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=refresh_token_value_here
&client_id=abc123def456789
```

**Response**:
```json
{
  "access_token": "new_access_token_here",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "new_refresh_token_here"  // Optional, may rotate
}
```

**User Experience**:
- Transparent (happens in background)
- No re-authentication required
- Tokens stay fresh automatically

---

## Mittwald OAuth Server RFC 8252 Support

### Dynamic Port Matching

**Registration**:
```json
{
  "redirect_uris": ["http://127.0.0.1/callback"]
}
```

**Accepted Callbacks**:
- `http://127.0.0.1:3000/callback` ✅
- `http://127.0.0.1:54321/callback` ✅
- `http://127.0.0.1:8000/callback` ✅
- Any port on loopback ✅

**Non-Accepted**:
- `http://localhost:3000/callback` ❌ (hostname instead of IP)
- `http://[::1]:3000/callback` ✅ (IPv6 loopback, supported)
- `https://127.0.0.1:3000/callback` ❌ (HTTPS on loopback not required)

### Loopback Address Support

Mittwald supports all RFC 8252 loopback addresses:
- `127.0.0.1` (IPv4 loopback)
- `[::1]` (IPv6 loopback)
- `localhost` (DNS name, resolves to loopback)

**Note on `localhost`**: Some OAuth servers reject DNS names for loopback. Best practice is to use explicit IP (`127.0.0.1`).

---

## Security Considerations for CLI

### Best Practices

**1. PKCE is Mandatory**
- RFC 8252 requires PKCE for CLI tools
- Codex CLI must implement PKCE S256
- Mittwald OAuth server validates it

**2. No Client Secret**
- CLI tools cannot securely store secrets
- Use `token_endpoint_auth_method: "none"`
- Security comes from PKCE, not client secret

**3. Loopback Only**
- Always use loopback redirect URI (`http://127.0.0.1/...`)
- Never use external URLs for CLI OAuth
- No TLS/HTTPS required for loopback (per RFC 8252)

**4. Secure Token Storage**
- Use OS credential storage (Keychain, Credential Manager, Secret Service)
- Never hardcode tokens in plaintext config
- Never print tokens in terminal output

**5. Token Scope Limitation**
- Request only necessary scopes
- For Mittwald: `user:read customer:read project:read app:read`
- Wider scopes = wider attack surface if token compromised

**6. Token Expiration**
- Short-lived access tokens (1 hour typical)
- Automatic refresh before expiration
- Refresh token allows long-term access without re-authentication

---

## References

### Official Standards & RFCs
- **RFC 8252 (OAuth for Native Apps)**: https://datatracker.ietf.org/doc/html/rfc8252
- **RFC 7636 (PKCE)**: https://datatracker.ietf.org/doc/html/rfc7636
- **RFC 7591 (DCR)**: https://datatracker.ietf.org/doc/html/rfc7591
- **RFC 6750 (Bearer Token)**: https://datatracker.ietf.org/doc/html/rfc6750
- **RFC 6749 (OAuth 2.0 Authorization Framework)**: https://tools.ietf.org/html/rfc6749

### Mittwald Documentation
- **Mittwald OAuth Server**: https://mittwald-oauth-server.fly.dev
- **OAuth Architecture**: /Users/robert/Code/mittwald-oauth/mittwald-oauth/docs/ARCHITECTURE.md
- **MCP Server**: https://mittwald-mcp-fly2.fly.dev/mcp

### CLI Tool Examples
- **OpenAI Codex CLI**: https://github.com/openai/codex-cli
- **GitHub CLI (gh)**: https://github.com/cli/cli (also uses loopback OAuth)
- **AWS CLI**: https://aws.amazon.com/cli/ (uses browser-based auth)

### Security Resources
- **OWASP OAuth**: https://owasp.org/www-community/attacks/oauth
- **PKCE Best Practices**: https://auth0.com/blog/oauth-pkce/
