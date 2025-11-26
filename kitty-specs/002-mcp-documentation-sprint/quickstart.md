# Quickstart: MCP Documentation Sprint

## Overview

This sprint creates 5 markdown documentation files. No code changes required.

## Files to Create

| Priority | File | Description |
|----------|------|-------------|
| 1 | `docs/oauth-scope-caching.md` | Explain OAuth session-scoped caching behavior |
| 2 | `docs/tool-concurrency.md` | Categorize 173 tools as safe/racy |
| 3 | `docs/guides/claude-desktop.md` | Claude Desktop setup guide |
| 4 | `docs/guides/chatgpt.md` | ChatGPT setup guide |
| 5 | `docs/guides/cursor.md` | Cursor IDE setup guide |

## Key Data Sources

### OAuth Scope Caching
- Source: OAuth implementation in `src/oauth/` and existing MAINTAINERS-HANDBOOK.md
- Key point: Scopes are cached for session lifetime (intentional, not a bug)
- Re-authentication required for scope changes

### Tool Concurrency
- Source: Tool definitions in `src/tools/`
- Research: See `research.md` for full categorization (82 safe, 91 racy)
- Safe = read-only operations (get, list, show)
- Racy = mutations (create, delete, update)

### Client Guides
- Source: `research.md` sections 2-4
- Each guide needs:
  - Config file location
  - JSON structure
  - Auth methods (OAuth vs API token)
  - Mittwald-specific examples

## Document Templates

### OAuth Scope Caching Structure
```
1. Overview - What is scope caching
2. Why This Behavior Exists - Security/UX tradeoff
3. When Does This Affect You - Common scenarios
4. How to Get New Permissions - Re-authenticate steps
5. Technical Details - Session lifecycle
6. Troubleshooting - FAQ
```

### Tool Concurrency Structure
```
1. Summary - 82 safe, 91 racy
2. What This Means - Parallel execution guidance
3. Safe Tools - Full list by category
4. Potentially Racy Tools - Full list by category
5. Recommendations - For MCP client implementers
```

### Client Guide Structure
```
1. Prerequisites
2. Installation/Setup
3. Configuration File Location
4. Basic Configuration (Local)
5. Remote Server Configuration
6. Authentication Options
   - OAuth flow
   - API token method
7. Mittwald MCP Examples
8. Troubleshooting
9. Client-Specific Limitations
```

## Implementation Order

1. **OAuth doc first** - Standalone, no dependencies
2. **Tool concurrency second** - Uses research.md data
3. **Claude Desktop guide third** - Baseline format
4. **Cursor guide fourth** - Compare to Claude Desktop
5. **ChatGPT guide last** - Most different (UI-based, OAuth only)

## Validation Checklist

- [ ] All JSON examples are valid JSON
- [ ] File paths are correct for each OS
- [ ] Auth examples use placeholder tokens (not real secrets)
- [ ] Links between docs work
- [ ] Mittwald server URLs are accurate
