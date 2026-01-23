---
title: Getting Started with Codex CLI
description: Set up OAuth and Mittwald MCP in Codex CLI with step-by-step instructions
---

# Getting Started with Codex CLI

Codex CLI is a command-line interface for AI-assisted development. This guide shows you how to set up Mittwald MCP with OAuth in Codex CLI so you can access Mittwald tools from your terminal.

## Prerequisites

- **Codex CLI installed** (via npm: `npm install -g @openai/codex-cli` or pip: `pip install codex-cli`)
- **curl or Postman** (to register OAuth client)
- **A Mittwald account** (to authenticate)
- **A web browser** (for OAuth login)
- **10 minutes** to complete setup

## Understanding OAuth for CLI Tools

Codex CLI uses **RFC 8252** (OAuth for Native Apps), which is designed specifically for command-line tools and native applications.

### How It Works (Brief Overview)

1. **You register** an OAuth client with Mittwald OAuth
2. **Codex CLI starts** a temporary web server on your computer
3. **Codex CLI opens** your browser to log in
4. **You authenticate** at Mittwald OAuth
5. **Mittwald redirects** back to Codex CLI's temporary server
6. **Codex CLI captures** the authorization code
7. **Codex CLI exchanges** the code for tokens (securely, using PKCE)
8. **Tokens are stored** securely on your computer
9. **You can now use** Mittwald MCP tools from the terminal

**Key Insight**: The temporary web server runs on your local machine (`http://127.0.0.1`), making it secure even though it's HTTP (not HTTPS).

---

## Step 1: Register OAuth Client with Mittwald

Before adding Mittwald MCP to Codex CLI, register an OAuth client.

### 1.1 Register via curl

Run this command in your terminal:

```bash
curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Codex CLI - Your Name",
    "redirect_uris": ["http://127.0.0.1/callback"],
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }'
```

**What to change**:
- Replace `Your Name` with your identifier (e.g., "Codex CLI - John Doe")

**Why no port number?** Codex CLI uses **RFC 8252 dynamic port matching**. It registers with the plain loopback address (`http://127.0.0.1/callback`), and Mittwald OAuth automatically accepts the authorization code on any port. This makes the flow more robust.

### 1.2 Save Your Client ID

The response looks like:

```json
{
  "client_id": "abc123def456...",
  "client_secret": null,
  "client_id_issued_at": 1234567890,
  "redirect_uris": ["http://127.0.0.1/callback"],
  ...
}
```

**Copy and save the `client_id` value**. You'll need it in Step 2.

---

## Step 2: Add Mittwald MCP to Codex CLI

### 2.1 Run the MCP Add Command

```bash
codex mcp add mittwald \
  --url https://mittwald-mcp-fly2.fly.dev/mcp \
  --auth oauth \
  --client-id abc123def456... \
  --oauth-server https://mittwald-oauth-server.fly.dev
```

**What to update**:
- Replace `abc123def456...` with your actual client ID from Step 1.2

### 2.2 What Happens Next

When you run the command above, Codex CLI will:

1. **Generate PKCE keys** (cryptographic values for secure authentication)
2. **Start a temporary HTTP server** on a random port (e.g., `http://127.0.0.1:54321`)
3. **Open your browser automatically** with the Mittwald OAuth login URL
4. **Wait for your authentication**

---

## Step 3: Authenticate with Mittwald

### 3.1 Log In (Automatic Browser)

After running Step 2, your browser will open automatically showing the Mittwald OAuth login page.

**If browser doesn't open**:
- Look for a URL printed in your terminal
- Copy and paste it into your browser manually
- Codex CLI will still detect the authorization

### 3.2 Enter Your Credentials

On the Mittwald OAuth page:
1. Enter your Mittwald username or email
2. Enter your password
3. Click **"Log In"**

### 3.3 Approve Permissions

You'll see a consent screen showing what Codex CLI can access:

```
Codex CLI is requesting access to:
- Read your user information (user:read)
- Read your customer information (customer:read)
- Read your projects (project:read)
- Read your apps (app:read)
```

Click **"Approve"** or **"Authorize"**

### 3.4 Confirmation

After approval, you'll see:

```
✅ Authorization successful!
You can now close this window and return to your terminal.
```

You can close the browser window. Return to your terminal.

### 3.5 Complete

Back in your terminal, you'll see:

```
✅ Successfully authenticated!
Mittwald MCP server is ready to use.

Try: codex mcp call mittwald.user.get
```

**Congratulations!** Your tokens are now securely stored, and Codex CLI is ready to use Mittwald MCP.

---

## Step 4: Verify Your Connection

### 4.1 Test with Your User Info

```bash
codex mcp call mittwald.user.get
```

### 4.2 Expected Output

```json
{
  "id": "user-abc123",
  "email": "your-email@mittwald.de",
  "name": "Your Name",
  "created": "2024-01-01T00:00:00Z"
}
```

✅ **Success!** Mittwald MCP is now connected to Codex CLI.

---

## Common Tasks with Mittwald MCP

### List Your Projects

```bash
codex mcp call mittwald.project.list
```

### Get Project Details

```bash
codex mcp call mittwald.project.get --id project-12345
```

### List Apps in a Project

```bash
codex mcp call mittwald.app.list --project-id project-12345
```

### View Backup Information

```bash
codex mcp call mittwald.backup.list --project-id project-12345
```

### Check Database Status

```bash
codex mcp call mittwald.database.get --database-id db-12345
```

For all available tools, see the [complete reference](/reference/).

---

## Understanding the OAuth Flow

### What's Actually Happening

When you run `codex mcp add mittwald ...`, here's what happens behind the scenes:

**Phase 1: PKCE Setup**
```
Codex CLI generates:
- code_verifier = random 128-char string
- code_challenge = SHA256(code_verifier) base64-encoded
```

**Phase 2: Temporary Server**
```
Codex CLI starts: http://127.0.0.1:54321 (random port)
Listening for: /callback?code=...
```

**Phase 3: Browser Authorization**
```
Browser opens with:
https://mittwald-oauth-server.fly.dev/oauth/authorize?
  client_id=abc123...
  &code_challenge=E9Mrozoa2owUednMVwmYgdyKzwtq0F6nN5sEHvJ0NRM
  &code_challenge_method=S256
  &redirect_uri=http://127.0.0.1:54321/callback
```

**Phase 4: Code Exchange**
```
Codex CLI receives: code=AUTH_CODE_HERE
Codex CLI sends to OAuth server:
  grant_type=authorization_code
  code=AUTH_CODE_HERE
  client_id=abc123...
  code_verifier=ORIGINAL_VERIFIER_VALUE
```

**Phase 5: Token Response**
```
OAuth server validates:
  SHA256(code_verifier) == stored_code_challenge
If match:
  Returns: access_token, refresh_token
Codex CLI stores tokens securely
```

### Why PKCE?

PKCE protects against **authorization code interception attacks**:
- If someone intercepts the authorization code
- They can't exchange it for a token (they don't have the verifier)
- Only the original Codex CLI instance has the verifier

This makes CLI authentication **as secure as web authentication**, even over HTTP.

---

## Troubleshooting

### Error: "Port Already in Use"

**Symptom**:
```
Error: EADDRINUSE - Address already in use
Port 54321 is already in use by another process.
```

**Cause**: Another application is using that port

**Fix**:
1. **Let Codex CLI retry** (modern versions auto-retry on different port)
2. **Or find the conflicting process** (macOS/Linux):
   ```bash
   lsof -i :54321
   ```
3. **Or kill the conflicting process**:
   ```bash
   kill -9 <PID>
   ```
4. **Or try again**:
   ```bash
   codex mcp add mittwald ...
   ```

---

### Error: "Browser Didn't Open"

**Symptom**:
```
Warning: Could not open browser automatically.
Please open this URL in your browser:
https://mittwald-oauth-server.fly.dev/oauth/authorize?client_id=...
```

**Cause**: Codex CLI couldn't detect your default browser (headless environment, missing browser, permissions issue)

**Fix**:
1. **Copy the URL** from terminal output
2. **Paste into your browser** manually
3. **Complete the authorization**
4. **Codex CLI automatically detects** the callback (no additional action)

---

### Error: "Redirect URI Mismatch"

**Symptom**:
```
Error: redirect_uri_mismatch
The redirect_uri parameter does not match the registered redirect URI.
```

**Cause**: Redirect URI registered doesn't match what Codex CLI is using

**This shouldn't happen with RFC 8252**, but if it does:

**Fix**:
1. **Verify you registered correctly** in Step 1:
   ```bash
   # Confirm registration has:
   "redirect_uris": ["http://127.0.0.1/callback"]
   ```

2. **Re-register if different**:
   ```bash
   curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register \
     -H "Content-Type: application/json" \
     -d '{
       "client_name": "Codex CLI - Your Name",
       "redirect_uris": ["http://127.0.0.1/callback"],
       "grant_types": ["authorization_code"],
       "response_types": ["code"],
       "token_endpoint_auth_method": "none"
     }'
   ```

3. **Use new client ID**:
   ```bash
   codex mcp add mittwald --client-id <new_client_id> ...
   ```

---

### Error: "Invalid Client ID"

**Symptom**:
```
Error: invalid_client
Client authentication failed.
```

**Cause**: Client ID doesn't match any registered client

**Fix**:
1. **Verify client ID** from Step 1.2
2. **Check for typos** in the command
3. **Re-register** if unsure:
   ```bash
   curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register ...
   ```
4. **Use new client ID**

---

### Error: "Authorization Code Expired"

**Symptom**:
```
Error: invalid_grant
Authorization code has expired.
```

**Cause**: You didn't complete the OAuth flow within ~10 minutes

**Fix**:
1. **Start over**:
   ```bash
   codex mpc add mittwald --client-id <client_id> ...
   ```
2. **Complete quickly** once the browser opens
3. **Don't leave** the authorization page idle

---

### Error: "PKCE Validation Failed"

**Symptom**:
```
Error: invalid_grant
Code verifier does not match the code challenge.
```

**Cause**: Rare; cryptographic mismatch in PKCE implementation

**Fix**:
1. **Update Codex CLI**:
   ```bash
   npm update -g @openai/codex-cli
   # or
   pip install --upgrade codex-cli
   ```

2. **Try again**:
   ```bash
   codex mcp remove mittwald
   codex mpc add mittwald ...
   ```

---

### Tokens Expired, Need to Re-Authenticate

**Symptom**:
```
Error: invalid_token
Token has expired.
```

**Cause**: Access token expired (normal; ~1 hour lifetime)

**Fix** (automatic):
- Codex CLI automatically refreshes tokens in the background
- If manual refresh needed:
  ```bash
  codex mcp disconnect mittwald
  codex mcp add mittwald ...
  ```

---

## FAQ

### Q: Why does the browser open?
**A**: RFC 8252 requires user interaction for authentication. Codex CLI opens your browser so you can log in securely at Mittwald's official OAuth server (not a fake page in terminal).

### Q: Is my password sent to Codex CLI?
**A**: No. Your password is entered in your browser at Mittwald's official OAuth server. Codex CLI never sees your password; it only receives a secure token.

### Q: Can I use this on a server (SSH)?
**A**: The browser-based login step is challenging in headless environments. Workarounds:
1. **Authenticate on your local machine** and copy the tokens to the server
2. **Use manual OAuth flow** (if Codex CLI supports it)
3. **Contact support** for alternative authentication methods

### Q: How do I revoke access?
**A**: Remove the MCP server configuration:
```bash
codex mcp remove mittwald
```

This immediately revokes Codex CLI's access to Mittwald.

### Q: Can I use multiple accounts?
**A**: You'd need to register separate OAuth clients (with different names) and maintain separate Codex CLI configurations. Not ideal for daily use.

### Q: How often do I need to re-authenticate?
**A**: Codex CLI automatically refreshes your tokens. You only need to re-authenticate if tokens are explicitly revoked or after several days of inactivity.

### Q: What's the difference between access token and refresh token?
**A**:
- **Access token**: Short-lived (1 hour), used for actual API calls
- **Refresh token**: Long-lived (days/weeks), used to get a new access token when old one expires
- Both stored securely by Codex CLI

### Q: Why do I need PKCE for a CLI?
**A**: PKCE protects against authorization code interception. Someone could theoretically intercept the code during browser redirect. PKCE ensures only the original CLI can exchange that code for a token.

---

## Next Steps

- **[Explore All Tools](/reference/)**: Browse the complete reference for all 115 Mittwald MCP tools
- **[What is MCP?](/explainers/what-is-mcp/)**: Learn foundational concepts
- **[Case Studies](/case-studies/)**: See real-world examples using Mittwald MCP
- **[Other Tools](/getting-started/)**: Set up GitHub Copilot, Claude Code, or Cursor

---

## Still Need Help?

- Check [Codex CLI Documentation](https://github.com/openai/codex-cli) for CLI-specific issues
- Review [RFC 8252 Specification](https://datatracker.ietf.org/doc/html/rfc8252) for OAuth native app details
- Contact support at support@mittwald.de
