# Implementation Plan: MCP Documentation Sprint

**Branch**: `002-mcp-documentation-sprint` | **Date**: 2025-11-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/kitty-specs/002-mcp-documentation-sprint/spec.md`

## Summary

Create three documentation deliverables for the mittwald-mcp project:
1. OAuth scope-permission caching documentation explaining intentional session-scoped behavior
2. Tool concurrency documentation categorizing 173 tools (82 safe, 91 racy)
3. Client integration guides for Claude Desktop, ChatGPT, and Cursor with auth configuration

## Technical Context

**Language/Version**: Markdown documentation (no code changes)
**Primary Dependencies**: N/A (documentation only)
**Storage**: N/A
**Testing**: Manual review, link validation
**Target Platform**: GitHub-rendered markdown, static docs
**Project Type**: Documentation sprint
**Performance Goals**: N/A
**Constraints**: Must be accurate, follow existing doc style
**Scale/Scope**: 5 new markdown files

## Constitution Check

*GATE: Documentation-only feature - no code gates apply*

- ✅ No architecture changes
- ✅ No new dependencies
- ✅ No test requirements (docs only)
- ✅ Follows existing project conventions

## Project Structure

### Documentation (this feature)

```
kitty-specs/002-mcp-documentation-sprint/
├── spec.md              # Feature specification
├── checklist.md         # Quality checklist
├── plan.md              # This file
├── research.md          # Phase 0 research findings
└── quickstart.md        # Implementation quickstart
```

### Deliverables (repository root)

```
docs/
├── oauth-scope-caching.md      # Deliverable 1
├── tool-concurrency.md         # Deliverable 2
└── guides/
    ├── claude-desktop.md       # Deliverable 3a
    ├── chatgpt.md              # Deliverable 3b
    └── cursor.md               # Deliverable 3c
```

**Structure Decision**: Documentation files in `docs/` directory following existing project convention.

## Research Summary

See [research.md](./research.md) for full details. Key findings:

### Tool Concurrency
- **173 total tools** analyzed from codebase
- **82 safe** (read-only: get, list, show, dump, status)
- **91 racy** (mutations: create, delete, update, deploy)
- Categorization based on operation type, not API response

### Client Configuration
| Client | Config Location | Auth Methods | Remote Support |
|--------|-----------------|--------------|----------------|
| Claude Desktop | `~/Library/.../claude_desktop_config.json` | Env vars, mcp-remote proxy | Via proxy only |
| ChatGPT | UI-based (no file) | OAuth 2.1 only | Native |
| Cursor | `.cursor/mcp.json` | Env vars, headers, OAuth | Native |

### Authentication Matrix
| Client | API Token | OAuth | Notes |
|--------|-----------|-------|-------|
| Claude Desktop | ✅ via env | ⚠️ via proxy | Needs mcp-remote for remote |
| ChatGPT | ❌ | ✅ required | No API token support |
| Cursor | ✅ via headers | ✅ one-click | Most flexible |

## Implementation Approach

### Deliverable 1: OAuth Scope Caching (`docs/oauth-scope-caching.md`)
- Explain session-scoped token caching is intentional
- Document that scope changes require new OAuth flow
- Include troubleshooting section
- Reference PKCE flow details

### Deliverable 2: Tool Concurrency (`docs/tool-concurrency.md`)
- Summary table (82 safe, 91 racy)
- Full categorized tool list by domain
- Explanation of safe vs racy criteria
- Recommendations for MCP client implementers

### Deliverable 3a-c: Client Guides (`docs/guides/*.md`)
- Each guide follows same structure:
  1. Prerequisites
  2. Configuration file location
  3. Basic setup (stdio)
  4. Remote server setup
  5. Authentication (OAuth vs API token)
  6. Troubleshooting
- Include actual JSON examples for mittwald-mcp
- Note client-specific quirks/limitations

## Complexity Tracking

*No constitution violations - documentation only*

| Item | Justification |
|------|---------------|
| 5 new files | Required by spec (3 deliverables across 5 files) |
