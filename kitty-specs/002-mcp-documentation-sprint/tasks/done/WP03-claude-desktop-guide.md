---
work_package_id: "WP03"
subtasks:
  - "T009"
  - "T010"
  - "T011"
  - "T012"
title: "Claude Desktop Integration Guide"
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

# Work Package Prompt: WP03 – Claude Desktop Integration Guide

## Objectives & Success Criteria

- Create `docs/guides/claude-desktop.md` with complete setup instructions
- Cover both macOS and Windows configuration paths
- Document all authentication methods (env vars, mcp-remote proxy)
- Provide working Mittwald-specific configuration examples

**Success Metrics:**
- Document exists at correct path
- Config file locations correct for both OS
- JSON examples are valid and copy-pasteable
- Troubleshooting section addresses common issues

## Context & Constraints

- **Spec**: `/kitty-specs/002-mcp-documentation-sprint/spec.md` - Deliverable 3a
- **Research**: `/kitty-specs/002-mcp-documentation-sprint/research.md` - Section 2 (Claude Desktop)
- **Constitution**: Documentation-only feature, no code changes

**Key Technical Facts:**
- Config file: `claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Transport: stdio only (no native SSE/HTTP)
- Auth: Environment variables or mcp-remote proxy for OAuth
- Claude Desktop is the baseline format other clients adopt

## Subtasks & Detailed Guidance

### Subtask T009 – Write prerequisites and configuration section
- **Purpose**: Help users find and create their config file.
- **Steps**:
  1. Create `docs/guides/` directory if not exists
  2. Create `docs/guides/claude-desktop.md`
  3. Add title and prerequisites (Claude Desktop installed, Node.js for npx)
  4. Document config file locations for macOS and Windows
  5. Show basic JSON structure
- **Files**: `docs/guides/claude-desktop.md`
- **Parallel?**: No (establishes document structure)
- **Notes**: This is the baseline format - emphasize this for readers.

**Suggested Structure:**
```markdown
# Claude Desktop Integration Guide

## Prerequisites

- Claude Desktop application installed
- Node.js 18+ (for npx commands)
- Mittwald API token or OAuth credentials

## Configuration File Location

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

## Basic Structure

The configuration file uses this JSON structure:

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

### Subtask T010 – Write authentication methods section
- **Purpose**: Document both API token and OAuth authentication options.
- **Steps**:
  1. Add "Authentication Methods" section
  2. Document environment variable approach (API token)
  3. Document mcp-remote proxy approach (OAuth)
  4. Explain when to use each method
  5. Note limitations (env vars may not pass correctly - known issue)
- **Files**: `docs/guides/claude-desktop.md`
- **Parallel?**: Yes (independent section)
- **Notes**: Be clear about Claude Desktop's stdio-only limitation.

**Content to Include:**
```markdown
## Authentication Methods

### Option 1: API Token (Environment Variables)

Best for: Local development, personal use

\`\`\`json
{
  "mcpServers": {
    "mittwald": {
      "command": "node",
      "args": ["/path/to/mittwald-mcp/dist/index.js"],
      "env": {
        "MITTWALD_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
\`\`\`

### Option 2: OAuth (via mcp-remote proxy)

Best for: Production use, shared environments

Claude Desktop doesn't support remote SSE/HTTP servers natively.
Use the `mcp-remote` proxy:

\`\`\`json
{
  "mcpServers": {
    "mittwald": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.mittwald.de/sse"]
    }
  }
}
\`\`\`

This will trigger an OAuth flow in your browser on first use.
```

### Subtask T011 – Write Mittwald-specific examples
- **Purpose**: Provide ready-to-use configuration for Mittwald MCP.
- **Steps**:
  1. Add "Mittwald Configuration Examples" section
  2. Provide complete local setup example
  3. Provide complete remote (OAuth) setup example
  4. Include placeholder tokens with clear instructions
- **Files**: `docs/guides/claude-desktop.md`
- **Parallel?**: Yes (independent section)
- **Notes**: Use placeholder values, never real tokens.

**Examples to Include:**
```markdown
## Mittwald Configuration Examples

### Local Server (API Token)

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

**Getting your API token:**
1. Log in to https://studio.mittwald.de
2. Navigate to Profile → API Tokens
3. Create a new token with required permissions

### Remote Server (OAuth)

\`\`\`json
{
  "mcpServers": {
    "mittwald": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.mittwald.de/sse"]
    }
  }
}
\`\`\`

On first use, a browser window will open for OAuth authentication.
```

### Subtask T012 – Write troubleshooting section
- **Purpose**: Help users resolve common issues.
- **Steps**:
  1. Add "Troubleshooting" section
  2. Document common issues and solutions
  3. Include "Known Limitations" subsection
  4. Add links to official documentation
- **Files**: `docs/guides/claude-desktop.md`
- **Parallel?**: Yes (independent section)
- **Notes**: Focus on issues specific to Claude Desktop + Mittwald.

**Issues to Cover:**
```markdown
## Troubleshooting

### Server not appearing in Claude

1. Verify JSON syntax is valid (use a JSON validator)
2. Check config file location is correct for your OS
3. Restart Claude Desktop after config changes
4. Check Claude Desktop logs for errors

### Environment variables not working

Known issue: Claude Desktop may not pass `env` variables correctly.

**Workaround**: Set environment variables system-wide:
- macOS: Add to `~/.zshrc` or `~/.bash_profile`
- Windows: System Properties → Environment Variables

### OAuth flow not starting

1. Ensure you have internet connectivity
2. Check that the server URL is correct
3. Try clearing browser cookies for the auth server

## Known Limitations

- No native support for remote SSE/HTTP servers (must use mcp-remote)
- Environment variable passing may be unreliable
- Only stdio transport supported
```

## Test Strategy

Not applicable (documentation only). Manual review for:
- JSON examples are syntactically valid
- File paths correct for macOS and Windows
- All configuration options from research.md covered
- Mittwald-specific examples work when tested

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Config paths changed in newer Claude Desktop | Note version tested, link official docs |
| JSON syntax errors in examples | Validate all JSON in document |
| Outdated mcp-remote package | Use `npx -y` to always get latest |

## Definition of Done Checklist

- [ ] `docs/guides/claude-desktop.md` exists
- [ ] Prerequisites section complete
- [ ] Config file locations for macOS and Windows
- [ ] Both auth methods documented (env vars, mcp-remote)
- [ ] Mittwald-specific examples included
- [ ] Troubleshooting section addresses common issues
- [ ] All JSON examples are valid
- [ ] Document renders correctly in GitHub markdown
- [ ] `tasks.md` updated with completion status

## Review Guidance

- Validate all JSON examples with a JSON linter
- Verify file paths match official Claude Desktop documentation
- Ensure instructions are actionable by a new user
- Check that OAuth flow explanation is clear

## Activity Log

- 2025-11-26T00:00:00Z – system – lane=planned – Prompt created.
