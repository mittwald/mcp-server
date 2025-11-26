# Feature Specification: MCP Documentation Sprint

## Overview
Create three documentation deliverables addressing known gaps in the mittwald-mcp project documentation: OAuth scope caching behavior, tool concurrency characteristics, and client-specific integration guides.

## Goals
1. **Reduce support burden** - Document known behaviors that may confuse users
2. **Improve developer experience** - Provide clear integration guides for popular MCP clients
3. **Enable informed decisions** - Help users understand tool concurrency implications

## Deliverables

### 1. OAuth Scope-Permission Caching Documentation
**File**: `docs/oauth-scope-caching.md`

Document the intentional behavior where OAuth scopes are cached for the session lifetime:
- Explain that scope changes require a new OAuth flow (by design)
- Clarify this is not a bug but a security/UX tradeoff
- Provide guidance on when users need to re-authenticate
- Include troubleshooting section for "why don't I see new permissions?"

### 2. Tool Concurrency Documentation
**File**: `docs/tool-concurrency.md`

Document the concurrency characteristics of the 175 available tools:
- **61 safe tools**: Can be called concurrently without issues
- **112 potentially racy tools**: May have race conditions if called in parallel
- Provide categorized list of tools by safety level
- Explain implications for MCP clients that batch requests
- Include recommendations for client implementers

### 3. Client Integration Guides
**Files**: Separate standalone documents per client

| Client | File |
|--------|------|
| Claude Desktop | `docs/guides/claude-desktop.md` |
| ChatGPT | `docs/guides/chatgpt.md` |
| Cursor | `docs/guides/cursor.md` |

Each guide will include:
- Step-by-step setup instructions
- Configuration examples with actual JSON/YAML
- Screenshots or diagrams where helpful
- Client-specific quirks or limitations
- Troubleshooting common issues

## Out of Scope
- Video tutorials
- API reference documentation updates
- Tool implementation changes
- New feature development

## Success Criteria
- [ ] All three documentation areas have complete, accurate content
- [ ] Documentation follows existing project style
- [ ] No broken links or references
- [ ] Reviewed for technical accuracy

## Technical Notes
- Tool concurrency data comes from existing analysis (61 safe, 112 racy out of 175 total)
- OAuth flow uses PKCE with session-scoped token caching
- Client guides should reference the existing OAuth setup process

## Dependencies
- Access to tool definitions for concurrency categorization
- Understanding of OAuth flow implementation
- Knowledge of each client's MCP configuration format
