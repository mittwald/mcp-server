---
work_package_id: "WP05"
subtasks:
  - "T017"
  - "T018"
  - "T019"
  - "T020"
title: "Cursor IDE Integration Guide"
phase: "Phase 2 - Client Guides"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
history:
  - timestamp: "2025-11-26T00:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP05 – Cursor IDE Integration Guide

## Objectives & Success Criteria

- Create `docs/guides/cursor.md` with complete setup instructions
- Document both global and project-specific configuration options
- Cover all authentication methods (env vars, headers, OAuth)
- Highlight differences from Claude Desktop baseline

**Success Metrics:**
- Document exists at correct path
- Both config file locations documented (global, project)
- All three auth methods covered
- Comparison to Claude Desktop format included

## Context & Constraints

- **Spec**: `/kitty-specs/002-mcp-documentation-sprint/spec.md` - Deliverable 3c
- **Research**: `/kitty-specs/002-mcp-documentation-sprint/research.md` - Section 4 (Cursor)
- **Constitution**: Documentation-only feature, no code changes

**Key Technical Facts:**
- Global config: `~/.cursor/mcp.json`
- Project config: `.cursor/mcp.json` (takes precedence)
- Adopts Claude Desktop JSON format for stdio
- Extends with native `url` field for remote servers
- Supports: env vars, headers, OAuth (one-click)
- 40 tool limit
- Settings UI: Settings → Features → Model Context Protocol

## Subtasks & Detailed Guidance

### Subtask T017 – Write prerequisites and configuration locations
- **Purpose**: Help users find and create their config files.
- **Steps**:
  1. Create `docs/guides/cursor.md`
  2. Add title and prerequisites
  3. Document both config file locations (global and project)
  4. Explain precedence rules
  5. Show basic JSON structure (same as Claude Desktop)
- **Files**: `docs/guides/cursor.md`
- **Parallel?**: No (establishes document structure)
- **Notes**: Emphasize project-specific config as a key differentiator.

**Suggested Structure:**
```markdown
# Cursor IDE Integration Guide

## Prerequisites

- Cursor IDE installed
- Node.js 18+ (for npx commands with local servers)
- Mittwald API token or OAuth credentials

## Configuration File Locations

Cursor supports two configuration locations:

| Scope | Path | Notes |
|-------|------|-------|
| Global | `~/.cursor/mcp.json` | Applies to all projects |
| Project | `.cursor/mcp.json` | Project root, takes precedence |

**Precedence**: Project-specific configuration overrides global configuration.

## Basic Structure

Cursor adopts the Claude Desktop JSON format:

\`\`\`json
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
\`\`\`
```

### Subtask T018 – Write authentication methods section
- **Purpose**: Document all three authentication options.
- **Steps**:
  1. Add "Authentication Methods" section
  2. Document environment variables (like Claude Desktop)
  3. Document headers-based auth (Cursor-specific)
  4. Document OAuth one-click flow
  5. Compare to Claude Desktop capabilities
- **Files**: `docs/guides/cursor.md`
- **Parallel?**: Yes (independent section)
- **Notes**: Cursor is the most flexible of the three clients.

**Content to Include:**
```markdown
## Authentication Methods

Cursor supports three authentication methods, making it the most flexible
MCP client.

### Option 1: Environment Variables (Local Servers)

Same as Claude Desktop:

\`\`\`json
{
  "mcpServers": {
    "mittwald": {
      "command": "node",
      "args": ["/path/to/mittwald-mcp/dist/index.js"],
      "env": {
        "MITTWALD_API_TOKEN": "your-api-token"
      }
    }
  }
}
\`\`\`

### Option 2: Headers (Remote Servers)

**Cursor-specific feature** - not available in Claude Desktop:

\`\`\`json
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
\`\`\`

### Option 3: OAuth (One-Click)

For servers with OAuth support:

\`\`\`json
{
  "mcpServers": {
    "mittwald": {
      "url": "https://mcp.mittwald.de/mcp"
    }
  }
}
\`\`\`

Cursor will automatically trigger the OAuth flow when connecting.

### Comparison to Claude Desktop

| Feature | Cursor | Claude Desktop |
|---------|--------|----------------|
| Local stdio servers | ✅ | ✅ |
| Environment variables | ✅ | ✅ |
| Native remote servers | ✅ (`url` field) | ❌ (needs proxy) |
| Headers auth | ✅ | ❌ |
| OAuth support | ✅ (one-click) | ⚠️ (via mcp-remote) |
| Project-specific config | ✅ | ❌ |
```

### Subtask T019 – Write Mittwald-specific examples
- **Purpose**: Provide ready-to-use configurations for Mittwald MCP.
- **Steps**:
  1. Add "Mittwald Configuration Examples" section
  2. Provide local server example
  3. Provide remote server with API token example
  4. Provide remote server with OAuth example
  5. Include project-specific config example
- **Files**: `docs/guides/cursor.md`
- **Parallel?**: Yes (independent section)
- **Notes**: Cursor's flexibility means more example variations.

**Content to Include:**
```markdown
## Mittwald Configuration Examples

### Local Server (API Token)

Global config at `~/.cursor/mcp.json`:

\`\`\`json
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
\`\`\`

### Remote Server (API Token via Headers)

\`\`\`json
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
\`\`\`

### Remote Server (OAuth)

\`\`\`json
{
  "mcpServers": {
    "mittwald": {
      "url": "https://mcp.mittwald.de/mcp"
    }
  }
}
\`\`\`

### Project-Specific Configuration

Create `.cursor/mcp.json` in your project root:

\`\`\`json
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
\`\`\`

This configuration only applies when working in this project.
```

### Subtask T020 – Write quirks and troubleshooting section
- **Purpose**: Help users navigate Cursor-specific issues.
- **Steps**:
  1. Add "Cursor-Specific Quirks" section
  2. Add "Troubleshooting" section
  3. Document known issues (OAuth customization, SSH, versions)
  4. Include MCP logs access instructions
- **Files**: `docs/guides/cursor.md`
- **Parallel?**: Yes (independent section)
- **Notes**: Include version-specific issues where known.

**Content to Include:**
```markdown
## Cursor-Specific Quirks

### OAuth Customization Limited

Cursor's OAuth implementation assumes:
- Localhost redirects
- Default scopes

Custom redirect URIs, client IDs, or scopes are difficult to configure.

### SSH/Remote Development

MCP servers may not work properly when:
- Accessing Cursor over SSH
- Using Remote Development extensions

**Workaround**: Use local Cursor installation for MCP features.

### Version-Specific Issues

Some users report needing specific package versions:

\`\`\`json
{
  "mcpServers": {
    "example": {
      "command": "npx",
      "args": ["-y", "mcp-remote@0.1.13", "https://server.com/sse"]
    }
  }
}
\`\`\`

### 40 Tool Limit

Cursor limits active tools to 40. If your MCP server exposes more,
only the first 40 may be available.

## Accessing MCP Logs

Debug connection issues using Cursor's MCP logs:

1. Press `Ctrl+Shift+U` (or `Cmd+Shift+U` on macOS)
2. Select "Output" panel
3. Choose "MCP Logs" from the dropdown

## Troubleshooting

### Server not connecting

1. Check JSON syntax is valid
2. Verify file is in correct location (`~/.cursor/mcp.json` or `.cursor/mcp.json`)
3. Check MCP logs for error messages
4. Restart Cursor after config changes

### Remote server authentication failing

1. Verify URL is correct and accessible
2. Check token/headers format
3. For OAuth, try clearing browser auth state
4. Check server logs for auth errors

### Tools not appearing

1. Verify MCP is enabled: Settings → Features → Model Context Protocol
2. Check tool count (40 limit)
3. Refresh tool list in Cursor settings

## Known Limitations

| Limitation | Impact |
|------------|--------|
| 40 tool limit | May not see all Mittwald tools |
| OAuth customization | Can't change redirect URIs, scopes |
| SSH/Remote dev issues | MCP may not work over SSH |
| Resources not supported | Only tools work (not MCP resources) |
```

## Test Strategy

Not applicable (documentation only). Manual review for:
- JSON examples are syntactically valid
- Config file locations are correct
- All three auth methods documented
- Comparison to Claude Desktop is accurate

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Cursor updates frequently | Note version tested, link official docs |
| OAuth quirks may be fixed | Mark as "as of November 2025" |
| JSON syntax errors | Validate all examples |

## Definition of Done Checklist

- [ ] `docs/guides/cursor.md` exists
- [ ] Both config locations documented (global, project)
- [ ] All three auth methods covered
- [ ] Mittwald examples for each auth method
- [ ] Comparison to Claude Desktop included
- [ ] Quirks and troubleshooting documented
- [ ] All JSON examples are valid
- [ ] Document renders correctly in GitHub markdown
- [ ] `tasks.md` updated with completion status

## Review Guidance

- Validate all JSON examples with a linter
- Verify config paths match official Cursor documentation
- Check that comparison table is accurate
- Ensure quirks section is helpful, not alarming

## Activity Log

- 2025-11-26T00:00:00Z – system – lane=planned – Prompt created.
