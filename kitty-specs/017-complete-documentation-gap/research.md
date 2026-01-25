# Research: Complete Documentation Gap

**Feature**: 017-complete-documentation-gap
**Date**: 2025-01-25
**Purpose**: Research MCP integration specifics for Claude Code and GitHub Copilot to inform OAuth guide authoring

## Research Questions

1. How does Claude Code integrate with MCP servers?
2. How does GitHub Copilot integrate with MCP servers?
3. What authentication methods do each support (OAuth vs API key)?
4. What are the configuration file formats and locations?

---

## Finding 1: Claude Code MCP Integration

**Source**: [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp)

### Configuration Methods

Claude Code supports three ways to add MCP servers:

1. **HTTP Transport** (recommended for remote servers):
   ```bash
   claude mcp add --transport http <name> <url>

   # Example for Mittwald with OAuth:
   claude mcp add --transport http mittwald https://mittwald-mcp-fly2.fly.dev/mcp

   # Example with API key:
   claude mcp add --transport http mittwald https://mittwald-mcp-fly2.fly.dev/mcp \
     --header "Authorization: Bearer YOUR_MITTWALD_API_TOKEN"
   ```

2. **SSE Transport** (deprecated, use HTTP instead)

3. **Stdio Transport** (for local servers)

### Authentication Methods

**OAuth 2.0 (Recommended)**:
- Use `/mcp` command within Claude Code to authenticate
- Claude Code handles OAuth flow automatically
- Browser opens for authorization
- Tokens stored securely and refreshed automatically
- Claude.ai callback URL: `https://claude.ai/api/mcp/auth_callback`

**API Key / Bearer Token**:
- Pass via `--header` flag during `claude mcp add`
- Token sent with every request
- No browser interaction required
- Suitable for headless/automated environments

### Configuration Scopes

| Scope | Storage Location | Use Case |
|-------|-----------------|----------|
| `local` (default) | `~/.claude.json` under project path | Personal, project-specific |
| `project` | `.mcp.json` at project root | Team-shared, version controlled |
| `user` | `~/.claude.json` | Personal, cross-project |

### OAuth Flow Details

1. Claude Code receives 401 with `WWW-Authenticate` header
2. Discovers authorization server via OAuth metadata
3. Registers itself via Dynamic Client Registration (DCR)
4. Opens browser for user authorization
5. Exchanges authorization code for tokens
6. Automatically refreshes tokens

**Key Insight**: Claude Code supports DCR natively - no manual client registration required for OAuth-enabled servers.

---

## Finding 2: GitHub Copilot MCP Integration

**Sources**:
- [GitHub Copilot MCP Documentation](https://docs.github.com/copilot/customizing-copilot/using-model-context-protocol/extending-copilot-chat-with-mcp)
- [VS Code MCP Servers Documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)

### Configuration Methods

1. **Repository-level**: `.vscode/mcp.json` (team-shared)
2. **Personal**: VS Code `settings.json` (individual use)

### Configuration File Format

```json
{
  "servers": {
    "mittwald": {
      "type": "http",
      "url": "https://mittwald-mcp-fly2.fly.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${input:mittwald_api_token}"
      }
    }
  },
  "inputs": [
    {
      "id": "mittwald_api_token",
      "type": "promptString",
      "description": "Enter your Mittwald API token",
      "password": true
    }
  ]
}
```

### Authentication Methods

**OAuth 2.0**:
- Click "Auth" CodeLens button in `mcp.json` to authenticate
- Browser opens for authorization
- VS Code 1.101+ required for remote MCP and OAuth
- Server receives only approved permission scopes

**API Key / Bearer Token**:
- Pass via `headers` configuration
- Use `${input:variable}` for secure input prompts
- Avoid hardcoding tokens - use input variables or environment files

### Requirements

- VS Code 1.101 or later (remote MCP and OAuth support)
- VS Code 1.102 or later (MCP generally available)
- Copilot Business/Enterprise: "MCP servers in Copilot" policy must be enabled

### Important Notes

- IDE-specific: OAuth via CodeLens button (click "Auth" above server config)
- Configuration changes require VS Code restart to take effect
- MCP servers can be added via GitHub MCP Registry (public preview)

---

## Finding 3: Mittwald MCP Authentication Paths

**Source**: ARCHITECTURE.md (local codebase)

### Path 1: OAuth via Bridge (Recommended)

Full OAuth 2.1 + PKCE flow through `mittwald-oauth-server.fly.dev`:

1. Client registers via DCR (or manual registration)
2. Authorization flow via browser
3. Bridge issues JWT with embedded Mittwald tokens
4. Automatic token refresh

**Endpoints**:
- Authorization: `https://mittwald-oauth-server.fly.dev/oauth/authorize`
- Token: `https://mittwald-oauth-server.fly.dev/oauth/token`
- Registration: `https://mittwald-oauth-server.fly.dev/oauth/register`

### Path 2: Direct API Token

When `ENABLE_DIRECT_BEARER_TOKENS=true` on the MCP server:

1. User obtains Mittwald API token from MStudio
2. Pass token directly as Bearer header
3. MCP server validates via `mw login status --token`
4. No browser interaction required

**Use Cases**:
- Headless/CI environments
- Quick testing
- Users who prefer not to use OAuth

---

## Finding 4: Documentation Format Decisions

### OAuth Guides Structure (from existing Cursor/Codex guides)

1. **Prerequisites** - What's needed before starting
2. **Step 1: Register OAuth Client** - DCR or manual registration
3. **Step 2: Add MCP to Tool** - Tool-specific configuration
4. **Step 3: Authenticate** - Browser flow
5. **Step 4: Verify Connection** - Test the setup
6. **Common Tasks** - Example usage
7. **Troubleshooting** - Error scenarios and fixes
8. **FAQ** - Common questions
9. **Next Steps** - Links to other docs

### Two Authentication Sections Per Guide

Each guide should document BOTH authentication paths:
1. **OAuth Path** (recommended) - Full OAuth flow
2. **API Key Path** (alternative) - Direct token method

This ensures developers can choose based on their environment and preferences.

---

## Recommendations

### Claude Code Guide

**Decision**: Document both OAuth and API key paths
**Rationale**: Claude Code supports both methods seamlessly

**OAuth-specific details**:
- Use `/mcp` command for authentication after adding server
- DCR is automatic (no manual registration needed)
- Callback URL already registered: `https://claude.ai/api/mcp/auth_callback`

**API Key details**:
- Use `--header "Authorization: Bearer TOKEN"` during add
- Get token from MStudio → User Settings → API Tokens

### GitHub Copilot Guide

**Decision**: Document both OAuth and API key paths
**Rationale**: VS Code supports both, OAuth is newer feature

**OAuth-specific details**:
- Requires VS Code 1.101+
- Click "Auth" CodeLens in mcp.json
- May require policy enabled for enterprise users

**API Key details**:
- Use `${input:variable}` for secure token prompts
- Never hardcode tokens in config files

### Case Study Format

**Decision**: Transform Feature 015 research format to Divio tutorial format
**Rationale**: Consistent with explainer documentation style

Transformation mapping:
- Research "Persona" → Tutorial "Who is this for?"
- Research "Problem" → Tutorial "What you'll solve"
- Research "Solution" steps → Tutorial "Step-by-step guide"
- Research "Outcomes" → Tutorial "What you'll achieve"
- Research "Tools Used" → Tutorial "Tools reference" with links

---

## Sources

- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp)
- [GitHub Copilot MCP Docs](https://docs.github.com/copilot/customizing-copilot/using-model-context-protocol/extending-copilot-chat-with-mcp)
- [VS Code MCP Servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
- [GitHub Blog: MCP in VS Code GA](https://github.blog/changelog/2025-07-14-model-context-protocol-mcp-support-in-vs-code-is-generally-available/)
- Local: `/Users/robert/Code/mittwald-mcp/ARCHITECTURE.md` (authentication paths)
- Local: `/Users/robert/Code/mittwald-mcp/docs/setup-and-guides/src/content/docs/getting-started/cursor.md` (guide template)
