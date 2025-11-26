# OAuth Scope Caching

> Understanding how the Mittwald MCP server handles OAuth permissions during your session.

## Overview

When you authenticate with the Mittwald MCP server via OAuth, the permissions (scopes) you grant are **cached for the duration of your session**. This is intentional behavior, not a bug.

### What This Means for You

- Your **initial OAuth authorization** determines which tools are available
- Adding new scopes requires a **fresh OAuth flow** (re-authentication)
- Token refresh maintains existing permissions but **doesn't add new ones**
- Removing scopes from your authorization also requires re-authentication

### When Does This Affect You?

You'll encounter scope caching behavior when:

1. **The server adds new tools** requiring additional permissions
2. **You initially granted limited scopes** and now need more access
3. **Your organization changes** permission requirements

## Why This Behavior Exists

The session-scoped caching is a deliberate design decision balancing security and user experience.

### Security Benefits

| Benefit | Explanation |
|---------|-------------|
| **Explicit consent** | Users consciously approve each set of permissions |
| **Scope reduction protection** | Mid-session scope changes can't be silently injected |
| **Audit clarity** | Session permissions are fixed and auditable |
| **Attack surface reduction** | Compromised sessions can't escalate privileges |

### User Experience Benefits

| Benefit | Explanation |
|---------|-------------|
| **Predictability** | Tools available at session start remain consistent |
| **No mid-session interruptions** | You won't be prompted for new permissions unexpectedly |
| **Clear mental model** | "What I authorized is what I get" |

### The Tradeoff

The tradeoff is that when new tools or permissions are added server-side, you must **explicitly re-authenticate** to access them. This is a conscious choice favoring security and predictability over convenience.

## How to Get New Permissions

If you need access to new scopes or tools, follow these steps:

### Step 1: Clear Your Existing Session

**Claude Desktop / Cursor:**
- Close the MCP connection
- Clear any cached tokens (location varies by client)
- Restart your MCP client

**ChatGPT:**
- The OAuth session is tied to your chat
- Start a new chat to trigger fresh authentication

### Step 2: Re-authenticate

1. Trigger a tool call that requires authentication
2. Complete the OAuth flow when prompted
3. **Approve all requested scopes** including new ones
4. Your session now has the updated permissions

### Step 3: Verify New Permissions

After re-authentication, verify your new scopes are active by:
- Checking which tools are now available
- Testing a tool that requires the new permission

## Technical Details

### OAuth 2.1 with PKCE

The Mittwald MCP server uses OAuth 2.1 with PKCE (Proof Key for Code Exchange):

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  MCP Client │      │  Auth Server │      │  MCP Server │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘
       │                    │                     │
       │  1. Auth Request   │                     │
       │  + PKCE Challenge  │                     │
       │ ─────────────────► │                     │
       │                    │                     │
       │  2. User Login &   │                     │
       │     Scope Consent  │                     │
       │ ◄───────────────── │                     │
       │                    │                     │
       │  3. Auth Code      │                     │
       │ ◄───────────────── │                     │
       │                    │                     │
       │  4. Token Request  │                     │
       │  + PKCE Verifier   │                     │
       │ ─────────────────► │                     │
       │                    │                     │
       │  5. Access Token   │                     │
       │  (scopes fixed)    │                     │
       │ ◄───────────────── │                     │
       │                    │                     │
       │  6. API Requests   │                     │
       │  with Token ──────────────────────────► │
       │                    │                     │
```

### Session Lifetime

- **Access tokens** have a defined expiry (typically 1 hour)
- **Token refresh** extends the session but maintains original scopes
- **Session ends** when: token expires without refresh, user logs out, or client disconnects

### Scope Storage

Scopes are stored:
- In the access token itself (JWT claims)
- Server-side in the session store
- Not modifiable without new authorization

## Troubleshooting FAQ

### "I authorized new scopes but tools aren't working"

**Cause:** Your existing session still has the old scope set.

**Solution:**
1. Clear your current session (close MCP connection)
2. Re-authenticate from scratch
3. Ensure you approve ALL requested scopes during OAuth

### "How do I force a scope refresh?"

**Answer:** You cannot refresh scopes mid-session. You must:
1. End your current session
2. Clear any cached tokens
3. Re-authenticate completely

### "Will my existing session break if scopes change server-side?"

**Answer:** No. Your session continues with its original scopes. However:
- New tools requiring new scopes won't be available
- You won't lose access to tools you already had
- Re-authentication is needed to gain new capabilities

### "How long do my scopes last?"

**Answer:** Scopes last for the session lifetime:
- Until your access token expires (typically 1 hour)
- Extended by token refresh (up to refresh token expiry)
- Until you explicitly log out
- Until your MCP client disconnects

### "I'm seeing 'insufficient scope' errors"

**Cause:** The tool you're calling requires a scope you didn't grant.

**Solution:**
1. Check which scopes the tool requires
2. Re-authenticate and grant all required scopes
3. Retry the tool call

### "Can I see what scopes I currently have?"

**Answer:** Check with your MCP client:
- **Claude Desktop:** Check connection status
- **Cursor:** Settings → Features → MCP → Connection details
- **ChatGPT:** Not directly visible; re-authenticate if unsure

## Related Documentation

- [Claude Desktop Integration Guide](./guides/claude-desktop.md)
- [ChatGPT Integration Guide](./guides/chatgpt.md)
- [Cursor Integration Guide](./guides/cursor.md)
