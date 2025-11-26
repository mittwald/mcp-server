# Research: MCP Documentation Sprint

**Date**: 2025-11-26
**Feature**: 002-mcp-documentation-sprint

---

## 1. Tool Concurrency Analysis

### Summary

| Metric | Count |
|--------|-------|
| **Total Tools** | **173** |
| **Safe Tools (Read-only)** | **82** (47.4%) |
| **Racy Tools (Write/Mutations)** | **91** (52.6%) |

### Categorization Criteria

**SAFE (Concurrency-Safe) Tools:**
- Read-only operations that don't modify system state
- Query operations (get, list, versions, charsets, etc.)
- Display/inspection operations (logs, dump, status, show, etc.)
- Operations that don't depend on exclusive access to resources

**RACY (Potentially Unsafe) Tools:**
- Operations that modify, create, or delete resources
- State mutation operations (create, delete, update, restart, deploy, etc.)
- Operations that acquire locks or exclusive access
- Operations that have side effects on external systems

### Safe Tools by Category (82 total)

| Category | Count | Tools |
|----------|-------|-------|
| App Management | 8 | dependency-list, dependency-versions, download, get, list, open, ssh, versions |
| Backup | 3 | download, get, list |
| Container | 2 | list-services, logs |
| Context | 3 | accessible-projects, get, set |
| Conversation | 4 | categories, list, reply, show |
| Cronjob | 5 | execution-get, execution-list, execution-logs, get, list |
| Database | 16 | mysql (charsets, dump, get, list, phpmyadmin, port-forward, shell, user-get, user-list, versions), redis (get, list, versions), index, list |
| Domain | 6 | dnszone-get, dnszone-list, get, list, virtualhost-get, virtualhost-list |
| Extension | 1 | list |
| Login | 2 | status, token |
| Mail | 4 | address-get, address-list, deliverybox-get, deliverybox-list |
| Organization | 5 | get, list, membership-list, membership-list-own, membership-get |
| Project | 8 | filesystem-usage, get, list, membership-get, membership-get-own, membership-list, membership-list-own, ssh |
| Registry | 1 | list |
| Server | 2 | get, list |
| SFTP | 1 | user-list |
| SSH | 1 | user-list |
| Stack | 2 | list, ps |
| User | 7 | api-token-get, api-token-list, get, session-get, session-list, ssh-key-get, ssh-key-list |
| Volume | 1 | list |
| Development | 2 | ddev-init, ddev-render-config |

### Racy Tools by Category (91 total)

| Category | Count | Tools |
|----------|-------|-------|
| App Management | 20 | copy, create (node, php, php-worker, python, static), dependency-update, install (contao, joomla, matomo, nextcloud, shopware5, shopware6, typo3, wordpress), uninstall, update, upgrade, upload |
| Backup | 6 | create, delete, schedule-create, schedule-delete, schedule-list, schedule-update |
| Container | 7 | delete, recreate, restart, run, start, stop, update |
| Context | 1 | reset |
| Conversation | 2 | close, create |
| Cronjob | 5 | create, delete, execute, execution-abort, update |
| Database | 7 | mysql (create, delete, import, user-create, user-delete, user-update), redis-create |
| Domain | 3 | dnszone-update, virtualhost-create, virtualhost-delete |
| Extension | 3 | install, list-installed, uninstall |
| Login | 1 | reset |
| Mail | 6 | address (create, delete, update), deliverybox (create, delete, update) |
| Organization | 6 | delete, invite, invite-list, invite-list-own, invite-revoke, membership-revoke |
| Project | 6 | create, delete, invite-get, invite-list, invite-list-own, update |
| Registry | 3 | create, delete, update |
| SFTP | 4 | user-create, user-delete, user-list, user-update |
| SSH | 4 | user-create, user-delete, user-list, user-update |
| Stack | 2 | delete, deploy |
| User | 5 | api-token-create, api-token-revoke, ssh-key-create, ssh-key-delete, ssh-key-import |
| Volume | 2 | create, delete |

### Recommendations for Documentation

1. Safe tools can be parallelized freely
2. Racy tools need resource-level coordination (prevent concurrent calls on same resource)
3. Mixed workloads: safe tools don't need coordination with racy tools on different resources

---

## 2. Claude Desktop MCP Configuration

### File Locations
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### JSON Structure (Baseline)

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-name", "/path/to/dir"],
      "type": "stdio",
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

### Key Fields
- `mcpServers` - Root object containing all server definitions
- `command` - Executable to run (npx, node, python, docker, etc.)
- `args` - Array of arguments passed to command
- `type` - Transport type (typically "stdio" for local servers)
- `env` - Environment variables (API keys, secrets)

### Authentication Methods

**1. Environment Variables (API Token)**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

**2. OAuth (via mcp-remote proxy for Claude Desktop)**
```json
{
  "mcpServers": {
    "remote-oauth": {
      "command": "npx",
      "args": ["mcp-remote", "https://server.com/sse"]
    }
  }
}
```

### Limitations
- Claude Desktop does NOT support native SSE/HTTP remote servers
- Must use `mcp-remote` or `mcp-proxy` bridges for remote servers
- Environment variables in config may not pass correctly (known issue)
- Only stdio transport supported directly

### Claude Platform (claude.ai) - Remote Server Support
```json
{
  "mcp_servers": [
    {
      "type": "url",
      "url": "https://server.com/sse",
      "name": "authenticated-server",
      "authorization_token": "YOUR_ACCESS_TOKEN"
    }
  ]
}
```

---

## 3. ChatGPT MCP Configuration

### Support Status
- **YES** - ChatGPT supports MCP as of 2025
- **Method**: Developer Mode (Settings → Apps & Connectors → Advanced Settings)
- **Availability**: Pro, Team, Enterprise, Education plans

### Configuration Location
**UI-based only** - No config file. Configure via:
1. Navigate to https://chatgpt.com
2. Settings → Apps & Connectors → Advanced Settings
3. Enable "Developer Mode (beta)"
4. Click "Create" next to "Browser connectors"

### Required Fields
- **Connector name**: Display name
- **Description**: Functionality explanation
- **Connector URL**: HTTPS endpoint (format: `https://domain/mcp`)

### Authentication: OAuth ONLY

ChatGPT **requires OAuth 2.1** - no API token support.

**Required Endpoints on Your Server:**

1. `/.well-known/oauth-protected-resource`
```json
{
  "resource": "https://your-mcp.example.com",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["read", "write"]
}
```

2. Authorization server with:
   - `/.well-known/openid-configuration`
   - Dynamic Client Registration (DCR)
   - PKCE support

### Key Limitations
- **No local servers** - Remote HTTPS only
- **No API token auth** - Must use OAuth
- **Mac app limitation** - Developer Mode only in web/Windows app
- **Per-chat enable** - Must enable Developer Mode each chat
- **40 tool limit** - Maximum 40 active tools

### Workaround for Testing
Use OpenAI Platform API directly (supports headers):
```json
{
  "tools": [{
    "type": "mcp",
    "server_url": "https://server.com/sse",
    "headers": {
      "Authorization": "Bearer token"
    }
  }]
}
```

---

## 4. Cursor MCP Configuration

### File Locations
- **Global**: `~/.cursor/mcp.json`
- **Project**: `.cursor/mcp.json` (takes precedence)

### JSON Structure

**Identical to Claude Desktop for stdio:**
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "mcp-server"],
      "env": {
        "API_KEY": "your-key"
      }
    }
  }
}
```

**Extended for Remote Servers (Cursor-specific):**
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://server.com/mcp",
      "headers": {
        "Authorization": "Bearer token"
      }
    }
  }
}
```

### Authentication Methods

**1. Environment Variables**
```json
{
  "env": {
    "API_KEY": "your-key"
  }
}
```

**2. Bearer Token (Remote)**
```json
{
  "url": "https://server.com/sse",
  "headers": {
    "Authorization": "Bearer token"
  }
}
```

**3. OAuth (One-click for supported services)**
```json
{
  "mcpServers": {
    "linear": {
      "url": "https://mcp.linear.app/sse"
    }
  }
}
```

### Key Differences from Claude Desktop

| Feature | Cursor | Claude Desktop |
|---------|--------|----------------|
| Native remote servers | ✅ `url` field | ❌ Needs proxy |
| OAuth support | ✅ One-click | ⚠️ Limited |
| Bearer token auth | ✅ `headers` | ❌ Via proxy |
| Project-specific config | ✅ `.cursor/mcp.json` | ❌ |
| Tool limit | 40 max | Unknown |
| Resources support | ❌ Not yet | ✅ Yes |

### Cursor Quirks
- OAuth customization limited (can't easily change redirect URIs, scopes)
- SSH/Remote dev may have issues
- Version-specific bugs (some need `mcp-remote@0.1.13`)

---

## 5. Mittwald MCP Server Configuration Examples

### Claude Desktop (Local + OAuth proxy)
```json
{
  "mcpServers": {
    "mittwald": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.mittwald.de/sse"]
    }
  }
}
```

### Claude Desktop (API Token via env)
```json
{
  "mcpServers": {
    "mittwald": {
      "command": "node",
      "args": ["/path/to/mittwald-mcp/dist/index.js"],
      "env": {
        "MITTWALD_API_TOKEN": "your-token"
      }
    }
  }
}
```

### Cursor (Native Remote + OAuth)
```json
{
  "mcpServers": {
    "mittwald": {
      "url": "https://mcp.mittwald.de/mcp"
    }
  }
}
```

### Cursor (API Token)
```json
{
  "mcpServers": {
    "mittwald": {
      "url": "https://mcp.mittwald.de/mcp",
      "headers": {
        "Authorization": "Bearer your-api-token"
      }
    }
  }
}
```

### ChatGPT
Configure via UI:
- Connector URL: `https://mcp.mittwald.de/mcp`
- Requires OAuth (server must implement OAuth endpoints)

---

## Research Decisions Summary

| Decision | Rationale | Alternatives Rejected |
|----------|-----------|----------------------|
| Categorize tools by operation type | Clear, objective criteria (read vs write) | Categorizing by API response time (subjective) |
| Use separate guides per client | Each client has different config format/auth | Single unified guide (would be confusing) |
| Include both OAuth and API token methods | Some clients only support one | OAuth-only (excludes Claude Desktop local) |
| Reference Claude Desktop as baseline | Most established format, others adopt it | No baseline (would duplicate explanations) |
