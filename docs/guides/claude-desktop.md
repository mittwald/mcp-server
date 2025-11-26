# Claude Desktop Integration Guide

> Connect the Mittwald MCP server to Claude Desktop for AI-assisted hosting management.

## Prerequisites

Before you begin, ensure you have:

- **Claude Desktop** application installed ([download](https://claude.ai/download))
- **Node.js 18+** (for npx commands)
- **Mittwald account** with API access
- One of:
  - Mittwald API token, OR
  - OAuth credentials (for remote server)

## Configuration File Location

Claude Desktop stores MCP server configuration in a JSON file:

| Platform | Path |
|----------|------|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |

> **Tip:** If the file doesn't exist, create it. If it exists, add to the `mcpServers` object.

## Basic Configuration Structure

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

| Field | Description |
|-------|-------------|
| `mcpServers` | Root object containing all MCP server definitions |
| `server-name` | Your chosen identifier for the server |
| `command` | Executable to run (npx, node, python, etc.) |
| `args` | Array of command-line arguments |
| `env` | Environment variables (optional) |

---

## Authentication Methods

Claude Desktop supports two authentication approaches for Mittwald MCP.

### Option 1: API Token (Local Server)

**Best for:** Local development, personal use, simple setup

Run the Mittwald MCP server locally with your API token:

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

**Getting your API token:**
1. Log in to [Mittwald Studio](https://studio.mittwald.de)
2. Navigate to **Profile → API Tokens**
3. Click **Create new token**
4. Select required permissions
5. Copy the generated token

### Option 2: OAuth (Remote Server via Proxy)

**Best for:** Production use, shared environments, dynamic authentication

Claude Desktop doesn't support remote SSE/HTTP servers natively. Use the `mcp-remote` proxy:

```json
{
  "mcpServers": {
    "mittwald": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.mittwald.de/sse"]
    }
  }
}
```

On first use:
1. A browser window opens automatically
2. Log in with your Mittwald credentials
3. Approve the requested permissions
4. Return to Claude Desktop with an active session

---

## Mittwald Configuration Examples

### Complete Local Setup (Recommended for Development)

```json
{
  "mcpServers": {
    "mittwald": {
      "command": "node",
      "args": ["/Users/yourname/projects/mittwald-mcp/dist/index.js"],
      "env": {
        "MITTWALD_API_TOKEN": "your-api-token-here",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Complete Remote Setup (Recommended for Production)

```json
{
  "mcpServers": {
    "mittwald": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.mittwald.de/sse"
      ]
    }
  }
}
```

### Multiple Environments

You can configure multiple Mittwald connections for different environments:

```json
{
  "mcpServers": {
    "mittwald-dev": {
      "command": "node",
      "args": ["/path/to/mittwald-mcp/dist/index.js"],
      "env": {
        "MITTWALD_API_TOKEN": "dev-token"
      }
    },
    "mittwald-prod": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.mittwald.de/sse"]
    }
  }
}
```

---

## Verifying Your Setup

After saving your configuration:

1. **Restart Claude Desktop** (required after config changes)
2. **Open a new conversation**
3. **Look for the MCP indicator** - Claude should show connected servers
4. **Test with a simple command:**
   > "List my Mittwald projects"

If successful, Claude will use the Mittwald tools to query your projects.

---

## Troubleshooting

### Server not appearing in Claude

1. **Verify JSON syntax** is valid (use a [JSON validator](https://jsonlint.com/))
2. **Check config file location** matches your OS
3. **Restart Claude Desktop** after any config changes
4. **Check absolute paths** - relative paths may not work

### Environment variables not working

**Known issue:** Claude Desktop may not pass `env` variables correctly in some versions.

**Workaround - Set system environment variables:**

**macOS:**
```bash
# Add to ~/.zshrc or ~/.bash_profile
export MITTWALD_API_TOKEN="your-token-here"
```

**Windows:**
1. Open **System Properties → Environment Variables**
2. Add new user variable `MITTWALD_API_TOKEN`
3. Restart Claude Desktop

### OAuth flow not starting

1. Ensure you have **internet connectivity**
2. Check the **server URL** is correct (`https://mcp.mittwald.de/sse`)
3. Try **clearing browser cookies** for the Mittwald auth domain
4. Check for **popup blockers** that might prevent the auth window

### "Server disconnected" errors

1. Check if the MCP server process is running:
   ```bash
   # macOS/Linux
   ps aux | grep mittwald-mcp
   ```
2. Review Claude Desktop logs for errors
3. Verify your API token hasn't expired
4. Try restarting Claude Desktop

### Tools not working after authentication

See [OAuth Scope Caching](../oauth-scope-caching.md) - you may need to re-authenticate if new tools were added.

---

## Known Limitations

| Limitation | Description | Workaround |
|------------|-------------|------------|
| **No native remote servers** | Claude Desktop only supports stdio transport | Use `mcp-remote` proxy |
| **Env var issues** | Environment variables may not pass correctly | Set system-wide env vars |
| **No project-specific config** | Single global config file | Use named servers for different contexts |
| **Session persistence** | OAuth sessions may require re-auth | Store API token for persistent access |

---

## Advanced Configuration

### Custom Server Options

```json
{
  "mcpServers": {
    "mittwald": {
      "command": "node",
      "args": [
        "/path/to/mittwald-mcp/dist/index.js",
        "--log-level", "debug",
        "--timeout", "30000"
      ],
      "env": {
        "MITTWALD_API_TOKEN": "your-token",
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Using with Docker

```json
{
  "mcpServers": {
    "mittwald": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "MITTWALD_API_TOKEN",
        "mittwald/mcp-server"
      ],
      "env": {
        "MITTWALD_API_TOKEN": "your-token"
      }
    }
  }
}
```

---

## Related Documentation

- [OAuth Scope Caching](../oauth-scope-caching.md) - Understanding permission behavior
- [Tool Concurrency Guide](../tool-concurrency.md) - Safe parallel tool usage
- [ChatGPT Integration Guide](./chatgpt.md) - Alternative client
- [Cursor Integration Guide](./cursor.md) - Alternative client
