# DEPRECATED

This guide is legacy and may contain outdated setup details.

Use the canonical docs under `docs/setup-and-guides/src/content/docs/` instead.

# ChatGPT Integration Guide

> Connect the Mittwald MCP server to ChatGPT for AI-assisted hosting management.

> **Note:** ChatGPT MCP support was introduced in 2025. This guide reflects the configuration as of November 2025.

## Prerequisites

Before you begin, ensure you have:

- **ChatGPT Pro, Team, Enterprise, or Education plan** (MCP not available on free tier)
- **A remote MCP server** with HTTPS endpoint
- **OAuth 2.1 implementation** on your MCP server (API tokens are NOT supported)

> **Important:** Unlike Claude Desktop and Cursor, ChatGPT does **not** support local MCP servers or API token authentication. You must use a remote server with OAuth.

## Enabling Developer Mode

ChatGPT uses Developer Mode to connect to MCP servers.

### Step-by-Step Setup

1. Navigate to [https://chatgpt.com](https://chatgpt.com)
2. Click your **profile icon** (bottom left)
3. Select **Settings**
4. Go to **Apps & Connectors**
5. Click **Advanced Settings**
6. Enable **Developer Mode (beta)**
7. Click **Create** next to "Browser connectors"

### Creating a Connector

Fill in the required fields:

| Field | Description | Example |
|-------|-------------|---------|
| **Connector name** | Display name for the server | `Mittwald` |
| **Description** | Brief functionality explanation | `Manage Mittwald hosting projects, apps, and databases` |
| **Connector URL** | Your MCP server's HTTPS endpoint | `https://mcp.mittwald.de/mcp` |

---

## OAuth Requirements

ChatGPT **requires OAuth 2.1** authentication. This is a server-side configuration requirement.

### What Your MCP Server Must Provide

#### 1. Protected Resource Metadata Endpoint

**Path:** `/.well-known/oauth-protected-resource`

```json
{
  "resource": "https://mcp.mittwald.de",
  "authorization_servers": ["https://auth.mittwald.de"],
  "scopes_supported": ["read", "write", "admin"]
}
```

#### 2. Authorization Server Discovery

**Path:** `/.well-known/openid-configuration`

Must include:
- `authorization_endpoint` - Where users authenticate
- `token_endpoint` - Where tokens are exchanged
- `registration_endpoint` - For Dynamic Client Registration (DCR)
- `code_challenge_methods_supported: ["S256"]` - PKCE support

### OAuth Flow Sequence

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   ChatGPT   │      │  Auth Server │      │  MCP Server │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘
       │                    │                     │
       │  1. Discover       │                     │
       │  metadata          │                     │
       │ ─────────────────► │                     │
       │                    │                     │
       │  2. Register       │                     │
       │  client (DCR)      │                     │
       │ ─────────────────► │                     │
       │                    │                     │
       │  3. Redirect user  │                     │
       │  to auth           │                     │
       │ ─────────────────► │                     │
       │                    │                     │
       │  4. User approves  │                     │
       │  + PKCE            │                     │
       │ ◄───────────────── │                     │
       │                    │                     │
       │  5. Exchange code  │                     │
       │  for token         │                     │
       │ ─────────────────► │                     │
       │                    │                     │
       │  6. Access token   │                     │
       │ ◄───────────────── │                     │
       │                    │                     │
       │  7. API calls with token ──────────────► │
       │                    │                     │
```

---

## Mittwald Configuration

### Setting Up Mittwald in ChatGPT

1. In ChatGPT Developer Mode, create a new connector:
   - **Name:** `Mittwald`
   - **Description:** `Manage Mittwald hosting projects, apps, and databases`
   - **URL:** `https://mcp.mittwald.de/mcp`

2. Start a new chat and invoke any Mittwald tool

3. When prompted, complete the OAuth flow:
   - Log in with your Mittwald credentials
   - Approve the requested permissions
   - Return to ChatGPT

### First-Time Authentication

When you first use a Mittwald tool:

1. ChatGPT detects authentication is required
2. A popup or redirect initiates the OAuth flow
3. Log in to your Mittwald account
4. Review and approve the requested scopes
5. You're redirected back to ChatGPT
6. The tool execution continues with your authenticated session

### Testing Your Connection

After authentication, try:

> "List my Mittwald projects"

or

> "Show me the apps in my Mittwald project"

---

## Troubleshooting

### Connector not appearing

1. Verify **Developer Mode** is enabled in Settings
2. Check that you're on a **supported plan** (Pro, Team, Enterprise, Education)
3. Try using the **web app** - Mac app may not support Developer Mode

### OAuth flow fails

1. **Check popup blockers** - auth window may be blocked
2. **Verify server URL** is correct and HTTPS
3. **Clear browser cookies** for the auth domain
4. **Check server logs** for OAuth errors

### Tools not appearing

1. Developer Mode must be enabled **for each new chat**
2. ChatGPT has a **40 tool limit** - some tools may not appear
3. Refresh the connector in Settings

### "Insufficient permissions" errors

See [OAuth Scope Caching](../oauth-scope-caching.md) - you may need to re-authenticate if your scopes are cached from a previous session.

### All tools showing as "write tools"

**Known ChatGPT issue:** Tools may incorrectly display as write operations.

This is a display issue and doesn't affect functionality. The tool will work correctly regardless of the label.

---

## Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **No local servers** | Must use remote HTTPS server | Deploy Mittwald MCP to a hosting provider |
| **OAuth only** | No API token authentication | Use Claude Desktop or Cursor for token-based auth |
| **40 tool limit** | May not see all 173 Mittwald tools | Most common tools are prioritized |
| **Per-chat enable** | Must enable Developer Mode each chat | No workaround - this is by design |
| **Web/Windows only** | Mac app doesn't support Developer Mode | Use web browser instead |
| **Write tool labels** | All tools may show as "write" | Ignore the label - tools work correctly |

---

## Alternative: OpenAI Platform API

For testing without the ChatGPT UI OAuth flow, you can use the OpenAI Platform API directly:

```python
import openai

client = openai.OpenAI()

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "List my projects"}],
    tools=[{
        "type": "mcp",
        "server_url": "https://mcp.mittwald.de/sse",
        "headers": {
            "Authorization": "Bearer your-mittwald-token"
        }
    }]
)
```

This bypasses the ChatGPT UI OAuth requirement but requires:
- OpenAI API access
- Managing authentication yourself
- Writing code to handle responses

---

## Comparison with Other Clients

| Feature | ChatGPT | Claude Desktop | Cursor |
|---------|---------|----------------|--------|
| Local servers | ❌ | ✅ | ✅ |
| Remote servers | ✅ | Via proxy | ✅ |
| API token auth | ❌ | ✅ | ✅ |
| OAuth auth | ✅ (required) | Via proxy | ✅ |
| Config file | ❌ (UI only) | ✅ | ✅ |
| Tool limit | 40 | Unknown | 40 |

**Recommendation:** If you need local server support or API token authentication, consider using [Claude Desktop](./claude-desktop.md) or [Cursor](./cursor.md) instead.

---

## Related Documentation

- [OAuth Scope Caching](../oauth-scope-caching.md) - Understanding permission behavior
- [Tool Concurrency Guide](../tool-concurrency.md) - Safe parallel tool usage
- [Claude Desktop Integration Guide](./claude-desktop.md) - Alternative with local server support
- [Cursor Integration Guide](./cursor.md) - Alternative with full auth flexibility
