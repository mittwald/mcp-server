---
title: Getting Started with Cursor
description: Set up OAuth and Mittwald MCP in Cursor IDE with step-by-step instructions
---

# Getting Started with Cursor

Cursor is an AI-powered IDE based on VS Code. This guide shows you how to set up Mittwald MCP with OAuth in Cursor so you can access Mittwald tools directly within your IDE.

## Prerequisites

- **Cursor IDE installed** (https://cursor.sh)
- **curl or Postman** (to register OAuth client)
- **A Mittwald account** (to authenticate)
- **10 minutes** to complete setup

## Step 1: Register OAuth Client with Mittwald

Before adding Mittwald MCP to Cursor, you need to register an OAuth client. This tells the Mittwald OAuth server that your Cursor installation is allowed to authenticate.

### 1.1 Choose Your Redirect Port

You'll need to pick a port number for the OAuth callback. Common choices:
- `3000` (default)
- `8000`
- `8080`
- Any unused port on your system

For this guide, we'll use port `3000`. If that port is already in use, choose a different one.

### 1.2 Register via curl

Run this command in your terminal:

```bash
curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Cursor - Your Name",
    "redirect_uris": ["http://localhost:3000/callback"],
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }'
```

**What to change**:
- Replace `Your Name` with your actual name or identifier (e.g., "Cursor - John Doe")

### 1.3 Save Your Client ID

The response will look like:

```json
{
  "client_id": "abc123def456...",
  "client_secret": null,
  "redirect_uris": ["http://localhost:3000/callback"],
  ...
}
```

**Copy and save the `client_id` value**. You'll need it in the next step.

---

## Step 2: Add Mittwald MCP to Cursor

### 2.1 Open Cursor Settings

1. Press `Cmd + ,` (macOS) or `Ctrl + ,` (Windows/Linux)
2. Search for "MCP" in the settings search box
3. Find the section for MCP server configuration

### 2.2 Add MCP Server Configuration

In the MCP configuration section, add the following JSON:

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

**What to update**:
- Replace `abc123def456...` with your actual client ID from Step 1.3
- Replace `3000` in the `redirectUri` if you chose a different port in Step 1.1

### 2.3 Save Settings

Press `Cmd + S` (macOS) or `Ctrl + S` (Windows/Linux) to save. Cursor may prompt you to restart the IDE.

---

## Step 3: Authenticate with Mittwald

### 3.1 Trigger OAuth Authorization

Now you'll authenticate by triggering any Mittwald MCP tool in Cursor:

1. Open Cursor's **Chat** panel (Cmd + L on macOS, Ctrl + L on Windows/Linux)
2. Type a message asking for a Mittwald tool, like: "Show me my user information"
3. Cursor will detect that Mittwald MCP needs authentication
4. Your default browser will open automatically with the Mittwald OAuth login page

### 3.2 Complete the OAuth Flow

**In your browser**:
1. You'll see the Mittwald OAuth login page
2. Enter your Mittwald credentials
3. You'll see a permission screen asking what Cursor can access
4. Click **"Approve"** or **"Authorize"**
5. Your browser redirects to `http://localhost:3000/callback`
6. You'll see a success message: **"Authorization successful! You can close this window."**

**Back in Cursor**:
- The IDE automatically captures the authorization
- Your tokens are securely stored
- The MCP server connection is established

---

## Step 4: Verify Your Connection

### 4.1 Test with a Simple Query

In Cursor's Chat, type:

```
Use the Mittwald MCP to get my user information
```

### 4.2 Expected Response

Cursor should show your Mittwald user details:

```json
{
  "id": "user-abc123",
  "email": "your-email@mittwald.de",
  "name": "Your Name",
  "created": "2024-01-01T00:00:00Z"
}
```

✅ **Success!** Mittwald MCP is now connected to Cursor.

---

## Alternative: API Token Authentication

Use this option for headless environments, CI/CD, or when you prefer direct token management.

### Step 1: Get Your Mittwald API Token

1. Log in to [mStudio](https://studio.mittwald.de)
2. Go to **User Settings → API Tokens**
3. Click **Create Token**
4. Give it a descriptive name (e.g., "Cursor IDE - My Machine")
5. Select required scopes (or use all scopes for full access)
6. Click **Create**
7. **Copy and save the token immediately** (you won't see it again)

### Step 2: Configure Cursor with API Token

Update your Cursor MCP configuration to include the token in headers:

```json
{
  "servers": {
    "mittwald": {
      "url": "https://mittwald-mcp-fly2.fly.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MITTWALD_API_TOKEN"
      }
    }
  }
}
```

**Replace `YOUR_MITTWALD_API_TOKEN`** with your actual token from Step 1.

**Security Note**:
- Do NOT commit this file to version control with the token in it
- Consider using environment variables instead:
  ```json
  {
    "servers": {
      "mittwald": {
        "url": "https://mittwald-mcp-fly2.fly.dev/mcp",
        "headers": {
          "Authorization": "Bearer ${MITTWALD_API_TOKEN}"
        }
      }
    }
  }
  ```
- Set `MITTWALD_API_TOKEN` in your shell: `export MITTWALD_API_TOKEN="your-token-here"`

### Step 3: Verify Connection

Same as OAuth: ask Cursor to run a Mittwald MCP tool.

---

## API Token vs OAuth: Which to Use?

| Feature | OAuth | API Token |
|---------|-------|-----------|
| Browser required | Yes | No |
| Auto token refresh | Yes | No (manual rotation) |
| Headless/CI support | Limited | Full |
| Security | Highest (short-lived) | Good (long-lived) |
| Setup complexity | Medium | Low |
| Revocation | Via mStudio | Via mStudio |

**Recommendation**: Use OAuth for local development, API token for CI/CD and servers.

**Learn more about Cursor's MCP support**: [Cursor MCP Documentation](https://cursor.com/docs/context/mcp)

---

## Common Tasks with Mittwald MCP

Once authenticated, you can use Mittwald MCP for various tasks:

### List Your Projects

```
Show me all my Mittwald projects
```

### Get App Information

```
List all apps in my project [project-id]
```

### View Database Info

```
Show database details for database [db-id]
```

### Check Server Status

```
Get the status of server [server-id]
```

---

## Troubleshooting

### Error: "Redirect URI Mismatch"

**Symptom**: OAuth authorization fails with "redirect_uri is not registered"

**Cause**: The redirect URI in Cursor settings doesn't match your registration in Step 1.

**Fix**:
1. Check the port number in your settings (default: `3000`)
2. Verify it matches your OAuth registration (Step 1.2)
3. If different:
   - **Option A**: Re-register with the same port as Cursor settings
   - **Option B**: Update Cursor settings to match your registered port
4. Restart Cursor after making changes

---

### Error: "Browser Didn't Open"

**Symptom**: Browser doesn't open automatically, but Cursor shows an authorization URL

**Cause**: Cursor couldn't detect your default browser

**Fix**:
1. Copy the authorization URL shown in Cursor
2. Paste it into your browser manually
3. Complete the authorization in your browser
4. Return to Cursor (no action needed; it detects the callback)

---

### Error: "PKCE Validation Failed"

**Symptom**: Authorization succeeds in browser, but Cursor shows token exchange error

**Cause**: Uncommon; likely a cryptographic mismatch in PKCE implementation

**Fix**:
1. Update Cursor to the latest version
2. Restart your computer
3. Try re-authenticating (disconnect and reconnect the MCP server in settings)
4. If issue persists, contact Cursor support

---

### Error: "Port Already in Use"

**Symptom**: Cursor shows error: "EADDRINUSE - Address already in use"

**Cause**: Another application is using port 3000

**Fix**:
1. **Check what's using the port** (macOS/Linux):
   ```bash
   lsof -i :3000
   ```

2. **Choose a different port**:
   - Update `redirectUri` in Cursor settings to a different port (e.g., `http://localhost:8000/callback`)
   - Re-register your OAuth client with the new port:
     ```bash
     curl -X POST https://mittwald-oauth-server.fly.dev/oauth/register \
       -H "Content-Type: application/json" \
       -d '{
         "client_name": "Cursor - Your Name",
         "redirect_uris": ["http://localhost:8000/callback"],
         "grant_types": ["authorization_code"],
         "response_types": ["code"],
         "token_endpoint_auth_method": "none"
       }'
     ```
   - Update the client ID in Cursor settings to the new one

3. **Restart Cursor**

---

### Error: "Invalid Client ID"

**Symptom**: OAuth authorization fails with "invalid_client"

**Cause**: Client ID doesn't match any registered client with Mittwald OAuth

**Fix**:
1. Verify the client ID in Cursor settings matches your registration response (Step 1.3)
2. Check for typos or extra spaces
3. If uncertain, re-register a new OAuth client and use the new client ID
4. Restart Cursor

---

### Tokens Expired or Need Refresh

**Symptom**: MCP tools stop working after extended IDE session

**Cause**: Access token expired (normal; tokens last ~1 hour)

**Fix** (automatic):
- Cursor automatically refreshes tokens in the background
- If manual refresh needed:
  1. Click the Mittwald MCP server in settings
  2. Click "Reconnect" or "Refresh"
  3. Complete a new OAuth flow if needed

---

### Error: "Invalid API Token"

**Symptom**: Requests fail with 401 Unauthorized when using API token authentication

**Cause**: API token is invalid, expired, or has been revoked

**Fix**:
1. Log in to [mStudio](https://studio.mittwald.de)
2. Go to **User Settings → API Tokens**
3. Check if the token still exists and is active
4. Create a new token if needed
5. Update your Cursor configuration with the new token
6. Restart Cursor

---

## FAQ

### Q: Is my password transmitted to Mittwald MCP?
**A**: No. Password authentication happens directly with Mittwald OAuth server in your browser. Mittwald MCP only receives a secure token, never your password.

### Q: Can I use multiple accounts?
**A**: Each Cursor installation is tied to one OAuth client registration. To use multiple accounts, register separate clients for each account (with different names in Step 1).

### Q: What if I switch to a new computer?
**A**: On the new computer, repeat Steps 1-4. You'll register a new OAuth client (give it a different name) and authenticate again. Each computer gets its own registration.

### Q: How do I revoke access?
**A**: Remove the Mittwald MCP server from Cursor settings:
1. Open Cursor Settings (Cmd + ,)
2. Find the MCP configuration
3. Delete the `mittwald` server configuration
4. Save settings

Access is immediately revoked.

### Q: Can I use HTTPS for the redirect URI?
**A**: No. Use HTTP for localhost. HTTPS is not required for local loopback URIs (and may cause issues).

### Q: What scopes should I request?
**A**: The default scopes in this guide (`user:read customer:read project:read app:read`) cover most use cases. Cursor will display all scopes during authorization so you can see exactly what's being requested.

### Q: How long do tokens last?
**A**: Access tokens last ~1 hour. Cursor automatically refreshes them in the background. You only need to manually re-authenticate if tokens are revoked or your session expires (typically after several days of inactivity).

---

## Next Steps

- **[Explore All Tools](/reference/)**: Browse the complete reference for all 115 Mittwald MCP tools
- **[What is MCP?](/explainers/what-is-mcp/)**: Learn foundational concepts
- **[Case Studies](/case-studies/)**: See real-world examples using Mittwald MCP
- **[Other Tools](/getting-started/)**: Set up GitHub Copilot, Claude Code, or Codex CLI

---

## Official Documentation

This guide is based on official Cursor capabilities:
- [Cursor MCP Documentation](https://cursor.com/docs/context/mcp) - MCP integration and OAuth support
- [Cursor OAuth Issues](https://github.com/cursor/cursor/issues/3734) - Community discussions on OAuth implementation
- **Bearer token authentication** is supported via the `headers` configuration field

---

## Still Need Help?

- Check [Cursor Documentation](https://cursor.sh/docs) for IDE-specific issues
- Review [Mittwald OAuth Architecture](/architecture) for OAuth flow details
- Contact support at support@mittwald.de
