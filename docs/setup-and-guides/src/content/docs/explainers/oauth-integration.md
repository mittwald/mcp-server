---
title: How OAuth Integration Works
description: Understanding OAuth 2.1, PKCE, and secure authentication for Mittwald MCP
sidebar:
  order: 3
---

# How OAuth Integration Works

**OAuth 2.1** is the secure authorization protocol used by Mittwald MCP. It enables your tools to access Mittwald resources **without you sharing your password**.

This explainer covers the "why" and "how" of OAuth for Mittwald. For step-by-step setup, see [Getting Started](/getting-started/).

---

## The Core Problem OAuth Solves

### Without OAuth: The Password Problem

**Scenario**: You want Claude Code to access your Mittwald resources.

**Naive approach** (INSECURE):
1. Give your Mittwald password to Claude Code
2. Claude Code stores your password
3. Claude Code uses password to call Mittwald API

**Problems**:
- **Password exposure**: Tool has your actual password (worst-case security)
- **All-or-nothing access**: Tool can do anything you can do
- **No revocation**: Can't revoke access without changing password
- **Password reuse risk**: Same password used elsewhere

This doesn't work for API access.

### With OAuth: The Token Solution

**Better approach** (SECURE):
1. You authenticate with Mittwald directly (in browser)
2. You grant Claude Code specific permissions
3. Mittwald issues a temporary access token to Claude Code
4. Claude Code uses the token (not your password) to access Mittwald
5. You can revoke the token anytime without changing password

**Advantages**:
- **No password sharing**: Your password stays at Mittwald
- **Limited scope**: Tools only get what you explicitly authorize
- **Temporary**: Tokens expire automatically
- **Revocable**: You can revoke anytime

---

## OAuth 2.1 Core Flow

### The Four Players

```mermaid
sequenceDiagram
    participant User
    participant Client as Your Tool<br/>(Claude Code, etc.)
    participant Browser
    participant OAuth as Mittwald OAuth<br/>Server

    User->>Client: "Add Mittwald MCP"
    Client->>Client: Generate PKCE verifier
    Client->>OAuth: Redirect to auth page
    OAuth-->>Browser: Login & approval form
    User->>Browser: Enter credentials
    Browser->>OAuth: Submit credentials
    OAuth->>OAuth: Verify credentials
    OAuth-->>Browser: "Grant access?"
    User->>Browser: Click "Approve"
    Browser->>OAuth: Confirm approval
    OAuth->>Client: Redirect with auth code
    Client->>OAuth: Exchange code + PKCE verifier
    OAuth->>OAuth: Validate PKCE
    OAuth-->>Client: Access token + Refresh token
    Client->>User: "Success! Authenticated"
```

**Four parties**:
1. **You** (user): Authenticate and authorize
2. **Your tool** (client): The app requesting access (Claude Code, Copilot, etc.)
3. **Browser**: UI for login and authorization
4. **Mittwald OAuth server**: Issues tokens and validates credentials

### Step-by-Step

#### Phase 1: Client Preparation

Your tool generates **PKCE values** (security enhancement):
- **Code Verifier**: Random 128-character string
- **Code Challenge**: SHA256 hash of the verifier (sent to server)

Why? Prevents authorization code interception attacks.

#### Phase 2: Authorization Request

Your tool opens browser with URL:
```
https://mittwald-oauth-server.fly.dev/oauth/authorize?
  client_id=abc123...
  &redirect_uri=http://127.0.0.1:3000/callback
  &response_type=code
  &scope=user:read customer:read project:read app:read
  &code_challenge=E9Mrozoa2owUednMVwmYgdyKzwtq0F6nN5sEHvJ0NRM
  &code_challenge_method=S256
  &state=random_value
```

**Parameters explained**:
- `client_id`: Identifies your tool to the OAuth server
- `redirect_uri`: Where to send user after auth (must match registration)
- `scope`: What permissions are being requested
- `code_challenge`: PKCE challenge (not the verifier itself)
- `state`: Random value to prevent CSRF attacks

#### Phase 3: User Authentication

In the browser, you see:

```
Mittwald OAuth
━━━━━━━━━━━━━━

Email or Username: [    ]
Password:          [    ]

[Log In]
```

You enter your Mittwald credentials. OAuth server validates them.

#### Phase 4: Authorization Grant

OAuth server shows:

```
Claude Code is requesting access to:
☑ Read your user information
☑ Read your projects
☑ Read your applications
☑ Read your customer information

These permissions expire on [date].

[Cancel]  [Approve]
```

You review and click "Approve"

**Important**: You're approving Mittwald to issue a token to Claude Code, NOT sharing your password.

#### Phase 5: Authorization Code

Browser redirects to:
```
http://127.0.0.1:3000/callback?
  code=AUTH_CODE_HERE
  &state=random_value
```

Your tool's localhost server receives this redirect and extracts the authorization code.

#### Phase 6: Token Exchange

Your tool now exchanges the authorization code for actual tokens:

```
POST https://mittwald-oauth-server.fly.dev/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE_HERE
&client_id=abc123...
&redirect_uri=http://127.0.0.1:3000/callback
&code_verifier=ORIGINAL_VERIFIER_VALUE
```

**PKCE validation happens here**:
- Server hashes the provided `code_verifier`
- Compares hash to stored `code_challenge`
- If they match: tokens issued
- If mismatch: request rejected (prevents code theft)

#### Phase 7: Token Response

Server responds with:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_abc123def456..."
}
```

Your tool stores these tokens securely.

#### Phase 8: Using the Token

Your tool now calls Mittwald API with the token:

```bash
GET https://api.mittwald.de/v2/user
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

Mittwald validates the token and returns your user information.

---

## Core OAuth Concepts

### Access Token

A **temporary credential** your tool uses to access resources.

**Properties**:
- **Expiration**: Typically 1 hour
- **Scope-limited**: Only grants authorized permissions
- **Bearer token**: Used in `Authorization: Bearer <token>` header
- **Format**: JWT (JSON Web Token) containing claims

**Example JWT breakdown**:
```json
Header:   {"alg": "RS256", "typ": "JWT"}
Payload:  {
  "sub": "user-12345",
  "aud": "https://mittwald-mcp-fly2.fly.dev",
  "scope": "user:read project:read app:read",
  "exp": 1234567890
}
Signature: [cryptographic signature]
```

### Refresh Token

A **long-lived credential** used to get new access tokens without re-authenticating.

**Properties**:
- **Long lifespan**: Days to weeks
- **Not transmitted**: Only sent to token endpoint, never in API calls
- **Secure storage**: Must be encrypted at rest

**Refresh flow**:
```
Tool detects: "Access token expires in 5 minutes"
Tool sends: refresh_token to OAuth server
Server validates: refresh_token is valid and not revoked
Server issues: new access_token
Tool continues: Using new token, user sees no interruption
```

### Scope

Permissions being requested. Format: `resource:action`

**Mittwald scopes**:
- `user:read` - Read user profile
- `user:write` - Modify user profile
- `project:read` - Read projects
- `project:write` - Create/modify projects
- `app:read` - Read applications
- `app:write` - Create/manage applications
- etc.

**Why granular scopes?**
- **Transparency**: You see exactly what permissions are being granted
- **Principle of least privilege**: Tools only get what they need
- **Safety**: Limits damage if tool is compromised

### PKCE (Proof Key for Code Exchange)

A security extension for preventing **authorization code theft**.

**The attack PKCE prevents**:
1. Attacker intercepts authorization code during redirect
2. Attacker calls OAuth server to exchange code for token
3. Attacker gets access token without needing the tool

**How PKCE stops this**:
1. Tool generates code verifier (secret, random string)
2. Tool derives code challenge (hash of verifier)
3. Tool sends code challenge to OAuth server
4. Later, tool exchanges code + verifier with server
5. Server hashes verifier and compares to stored challenge
6. Only original tool (with the verifier) can exchange the code
7. Attacker with intercepted code has nothing (no verifier)

**Why OAuth 2.1 requires PKCE**:
- Traditional OAuth 2.0 is vulnerable to code interception
- PKCE closes the vulnerability
- All clients must implement PKCE

---

## Mittwald's OAuth Architecture

### Registration: Dynamic Client Registration (DCR)

Mittwald uses **RFC 7591 Dynamic Client Registration**.

Instead of pre-registering clients, you register on-the-fly:

```bash
curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Claude Code - John Doe",
    "redirect_uris": ["http://127.0.0.1:3000/callback"],
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }'
```

Response:
```json
{
  "client_id": "abc123def456...",
  "client_secret": null,
  "client_id_issued_at": 1234567890
}
```

**Advantages**:
- **No manual registration**: Tools register themselves
- **No client secrets**: PKCE provides security (no shared secret needed)
- **Flexibility**: Each user/device can register separately

### Token Validation

When your tool calls Mittwald API with token:

1. **API server receives**: `Authorization: Bearer <token>`
2. **API server decodes**: JWT token structure
3. **API server validates**:
   - Signature (proves token came from OAuth server)
   - Expiration (token not expired)
   - Issuer (came from Mittwald OAuth server)
   - Scopes (token grants required permissions)
4. **API server extracts**: User ID and granted scopes
5. **API server executes**: The requested action (if authorized)

### Token Expiration and Refresh

**Default expiration**: 1 hour

**Refresh flow**:
1. Your tool detects expiration approaching
2. Tool calls: `POST /oauth/token` with refresh_token
3. Server validates refresh token
4. Server issues new access_token
5. Tool updates stored token
6. Seamless to you (happens in background)

If refresh token expires (days), you must re-authenticate.

---

## Security Principles

### Defense in Depth

OAuth implementation uses multiple security layers:

1. **HTTPS**: All communication encrypted in transit
2. **PKCE**: Prevents code interception
3. **JWT signature**: Proves token authenticity
4. **Token expiration**: Limits exposure window
5. **Refresh token**: Enables long sessions without exposing access token
6. **Scopes**: Limits what tokens can access
7. **State parameter**: Prevents CSRF attacks

No single failure point compromises security.

### Least Privilege

Your tool only requests what it needs:

```
Requesting: user:read, project:read, app:read
NOT requesting: user:write, project:delete
```

If a tool is compromised:
- Attacker can only read (not write)
- Attacker can't delete resources
- Limited blast radius

### User Control

You maintain control:
- **Approval**: You explicitly approve each app
- **Revocation**: You can revoke anytime
- **Auditing**: You can see what accessed what
- **Scope modification**: You can grant/revoke specific permissions

---

## Common Misconceptions

### "OAuth means sharing your password"

**Reality**: OAuth explicitly avoids password sharing.

- You enter your password directly at Mittwald (not the app)
- The app never sees your password
- App receives only a limited token

### "OAuth is only for web apps"

**Reality**: OAuth works for all client types:

- **Web apps**: Browser-based clients
- **Native apps**: Desktop/mobile applications
- **CLI tools**: Command-line applications
- **IDEs**: Code editors and integrated development environments

Mittwald MCP uses OAuth with CLI tools, IDEs, and web apps.

### "I need to trust the app with my data because of OAuth"

**Reality**: OAuth limits trust requirements:

- **Limited scope**: App can only do what you authorized
- **Limited time**: Token expires automatically
- **Revocable**: You can revoke instantly
- **Auditable**: You can see what the app did

OAuth lets you grant access without full trust.

### "OAuth is slow"

**Reality**: OAuth adds minimal overhead:

- **Initial setup**: One-time, ~10 minutes
- **Per-request**: Token transmitted in header (negligible cost)
- **Token refresh**: Happens transparently in background
- **Overall**: Imperceptible performance impact

---

## Troubleshooting OAuth Issues

### "Token expired, please re-authenticate"

**Cause**: Access token exceeded 1-hour lifetime

**Solution**: Token refresh should happen automatically. If not:
1. Disconnect and reconnect your tool
2. Go through OAuth flow again

### "Invalid redirect_uri"

**Cause**: Redirect URI doesn't match registration

**Solution**:
1. Check what you registered (port, protocol, path)
2. Verify tool's configuration matches
3. Re-register if ports don't match

### "PKCE validation failed"

**Cause**: Code verifier doesn't match challenge (rare)

**Solution**:
1. Update your tool to latest version
2. Re-authenticate

### "Scope mismatch"

**Cause**: Token doesn't grant required permissions

**Solution**: Re-authenticate with broader scopes

---

## Further Learning

**Ready to set up?**
→ [Getting Started](/getting-started/) - Step-by-step OAuth setup for your tool

**Want technical details?**
→ [RFC 6749](https://tools.ietf.org/html/rfc6749) - OAuth 2.0 specification
→ [RFC 7636](https://tools.ietf.org/html/rfc7636) - PKCE specification

**Curious about MCP?**
→ [What is MCP?](/explainers/what-is-mcp/) - Understanding the protocol

---

*OAuth enables secure, scoped access without password sharing. Mittwald MCP leverages OAuth 2.1 with PKCE to provide enterprise-grade security.*
