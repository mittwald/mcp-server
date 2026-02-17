# DEPRECATED

This guide is legacy and may contain outdated setup details.

Use the canonical docs under `docs/setup-and-guides/src/content/docs/` instead.

# Cursor IDE Integration Guide

> Connect the Mittwald MCP server to Cursor IDE for AI-assisted hosting management.

## Prerequisites

Before you begin, ensure you have:

- **Cursor IDE** installed ([download](https://cursor.com))
- **Node.js 18+** (for npx commands with local servers)
- **Mittwald account** with API access
- One of:
  - Mittwald API token, OR
  - OAuth credentials (for remote server)

## Configuration File Locations

Cursor supports **two configuration locations**, giving you flexibility for global and project-specific settings.

| Scope | Path | Notes |
|-------|------|-------|
| **Global** | `~/.cursor/mcp.json` | Applies to all projects |
| **Project** | `.cursor/mcp.json` | Project root, takes precedence |

> **Tip:** Project-specific configuration overrides global configuration. This lets you use different Mittwald accounts per project.

## Basic Configuration Structure

Cursor adopts the **Claude Desktop JSON format**:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "executable",
      "args": ["arg1", "arg2"],
      "env": {
        "KEY": "value"
      }
    }
  }
}
```

Cursor **extends** this format with native remote server support:

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

---

## Authentication Methods

Cursor is the **most flexible** MCP client, supporting three authentication methods.

### Option 1: Environment Variables (Local Server)

**Best for:** Local development, same approach as Claude Desktop

```json
{
  "mcpServers": {
    "mittwald": {
      "command": "node",
      "args": ["/absolute/path/to/mittwald-mcp/dist/index.js"],
      "env": {
        "MITTWALD_API_TOKEN": "your-mittwald-api-token"
      }
    }
  }
}
```

### Option 2: Headers (Remote Server)

**Best for:** Remote servers, simple token authentication

**Cursor-specific feature** - not available in Claude Desktop:

```json
{
  "mcpServers": {
    "mittwald": {
      "url": "https://mcp.mittwald.de/mcp",
      "headers": {
        "Authorization": "Bearer your-mittwald-api-token"
      }
    }
  }
}
```

### Option 3: OAuth (One-Click)

**Best for:** Production use, dynamic authentication

For servers with OAuth support, Cursor handles the flow automatically:

```json
{
  "mcpServers": {
    "mittwald": {
      "url": "https://mcp.mittwald.de/mcp"
    }
  }
}
```

On first connection, Cursor will:
1. Detect OAuth is required
2. Open a browser for authentication
3. Complete the OAuth flow automatically
4. Store the session for future use

---

## Comparison to Claude Desktop

| Feature | Cursor | Claude Desktop |
|---------|--------|----------------|
| Local stdio servers | ✅ | ✅ |
| Environment variables | ✅ | ✅ |
| Native remote servers | ✅ (`url` field) | ❌ (needs mcp-remote proxy) |
| Headers auth | ✅ | ❌ |
| OAuth support | ✅ (one-click) | ⚠️ (via mcp-remote) |
| Project-specific config | ✅ | ❌ |
| Tool limit | 40 max | Unknown |
| Resources support | ❌ (not yet) | ✅ |

**Key advantage:** Cursor's native `url` field means you can connect to remote MCP servers directly without needing a proxy.

---

## Mittwald Configuration Examples

### Local Server (API Token)

**Global config** at `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mittwald": {
      "command": "node",
      "args": ["/absolute/path/to/mittwald-mcp/dist/index.js"],
      "env": {
        "MITTWALD_API_TOKEN": "your-mittwald-api-token"
      }
    }
  }
}
```

### Remote Server (API Token via Headers)

```json
{
  "mcpServers": {
    "mittwald": {
      "url": "https://mcp.mittwald.de/mcp",
      "headers": {
        "Authorization": "Bearer your-mittwald-api-token"
      }
    }
  }
}
```

### Remote Server (OAuth)

```json
{
  "mcpServers": {
    "mittwald": {
      "url": "https://mcp.mittwald.de/mcp"
    }
  }
}
```

### Project-Specific Configuration

Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "mittwald-project": {
      "url": "https://mcp.mittwald.de/mcp",
      "headers": {
        "Authorization": "Bearer project-specific-token"
      }
    }
  }
}
```

This configuration only applies when working in this project, overriding your global config.

### Multiple Environments

```json
{
  "mcpServers": {
    "mittwald-staging": {
      "url": "https://mcp-staging.mittwald.de/mcp",
      "headers": {
        "Authorization": "Bearer staging-token"
      }
    },
    "mittwald-prod": {
      "url": "https://mcp.mittwald.de/mcp"
    }
  }
}
```

---

## Verifying Your Setup

1. **Open Cursor Settings:** `Cmd/Ctrl + ,`
2. Navigate to **Features → Model Context Protocol**
3. Verify your servers appear in the list
4. Check the connection status indicator
5. **Test with a prompt:**
   > "List my Mittwald projects"

---

## Accessing MCP Logs

Debug connection issues using Cursor's MCP logs:

1. Press `Ctrl+Shift+U` (or `Cmd+Shift+U` on macOS)
2. Select the **Output** panel
3. Choose **MCP Logs** from the dropdown
4. Review connection and error messages

---

## Cursor-Specific Quirks

### OAuth Customization Limited

Cursor's OAuth implementation assumes:
- Localhost redirects
- Default scopes

**Impact:** You cannot easily customize:
- Redirect URIs
- Client IDs
- Specific scope requests

**Workaround:** Use headers-based authentication with an API token instead.

### SSH/Remote Development

MCP servers may not work properly when:
- Accessing Cursor over SSH
- Using Remote Development extensions
- Working in remote containers

**Workaround:** Use a local Cursor installation for MCP features, or use the remote server URL configuration.

### Version-Specific Issues

Some users report needing specific package versions for `mcp-remote`:

```json
{
  "mcpServers": {
    "example": {
      "command": "npx",
      "args": ["-y", "mcp-remote@0.1.13", "https://server.com/sse"]
    }
  }
}
```

If you encounter issues, try pinning to a specific version.

### 40 Tool Limit

Cursor limits active tools to **40 per server**. If your MCP server exposes more:
- Only the first 40 may be available
- Priority is typically given to most-used tools

The Mittwald MCP server has 173 tools, so some may not appear.

---

## Troubleshooting

### Server not connecting

1. **Check JSON syntax** is valid (use a JSON validator)
2. **Verify file location:**
   - Global: `~/.cursor/mcp.json`
   - Project: `.cursor/mcp.json`
3. **Check MCP logs** for error messages (Ctrl+Shift+U → Output → MCP Logs)
4. **Restart Cursor** after config changes

### Remote server authentication failing

1. **Verify URL** is correct and accessible
2. **Check token format** in headers
3. **For OAuth:** Try clearing browser auth state
4. **Check server logs** for authentication errors

### Tools not appearing

1. **Verify MCP is enabled:**
   - Settings → Features → Model Context Protocol
2. **Check tool count** (40 limit)
3. **Refresh tool list** in Cursor settings
4. **Restart Cursor** to reload configuration

### "Connection refused" errors

1. **For local servers:** Check the path in `args` is correct and absolute
2. **For remote servers:** Verify the server is running and accessible
3. **Check firewall** settings aren't blocking the connection

---

## Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **40 tool limit** | May not see all 173 Mittwald tools | Most common tools prioritized |
| **OAuth customization** | Can't change redirect URIs, scopes | Use headers auth instead |
| **SSH/Remote dev** | MCP may not work over SSH | Use local Cursor installation |
| **Resources not supported** | Only tools work (not MCP resources) | No workaround currently |
| **Version sensitivity** | Some packages need specific versions | Pin versions in config |

---

## Best Practices

### Security

1. **Don't commit tokens** - Add `.cursor/mcp.json` to `.gitignore` for project configs with tokens
2. **Use OAuth when possible** - Tokens in config files are a security risk
3. **Rotate tokens regularly** - Especially for shared team configs

### Configuration Management

1. **Global for defaults** - Put commonly used servers in `~/.cursor/mcp.json`
2. **Project for overrides** - Use `.cursor/mcp.json` for project-specific settings
3. **Use environment variables** for sensitive values when using local servers

### Team Collaboration

1. **Create a template** - Share a `.cursor/mcp.json.example` without real tokens
2. **Document setup** - Include MCP setup in project README
3. **Use OAuth** - Team members authenticate individually

---

## Related Documentation

- [OAuth Scope Caching](../oauth-scope-caching.md) - Understanding permission behavior
- [Tool Concurrency Guide](../tool-concurrency.md) - Safe parallel tool usage
- [Claude Desktop Integration Guide](./claude-desktop.md) - Alternative client
- [ChatGPT Integration Guide](./chatgpt.md) - Alternative client (OAuth only)
