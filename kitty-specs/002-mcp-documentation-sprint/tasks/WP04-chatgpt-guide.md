---
work_package_id: WP04
title: ChatGPT Integration Guide
lane: done
history:
- timestamp: '2025-11-26T00:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
agent: ''
assignee: ''
phase: Phase 2 - Client Guides
shell_pid: ''
subtasks:
- T013
- T014
- T015
- T016
---

# Work Package Prompt: WP04 – ChatGPT Integration Guide

## Objectives & Success Criteria

- Create `docs/guides/chatgpt.md` with complete Developer Mode setup instructions
- Clearly document OAuth-only authentication requirement
- Explain OAuth endpoint requirements for server-side
- Provide Mittwald compatibility status and setup

**Success Metrics:**
- Document exists at correct path
- Developer Mode setup is step-by-step
- OAuth requirements are clearly explained
- Mittwald compatibility is accurately described

## Context & Constraints

- **Spec**: `/kitty-specs/002-mcp-documentation-sprint/spec.md` - Deliverable 3b
- **Research**: `/kitty-specs/002-mcp-documentation-sprint/research.md` - Section 3 (ChatGPT)
- **Constitution**: Documentation-only feature, no code changes

**Key Technical Facts:**
- No config file - UI-based only
- Settings → Apps & Connectors → Advanced Settings → Developer Mode
- OAuth 2.1 required (no API token support)
- Requires DCR (Dynamic Client Registration) and PKCE
- 40 tool limit
- Per-chat Developer Mode enable required
- Available: Pro, Team, Enterprise, Education plans

## Subtasks & Detailed Guidance

### Subtask T013 – Write prerequisites and Developer Mode setup
- **Purpose**: Guide users through enabling MCP support in ChatGPT.
- **Steps**:
  1. Create `docs/guides/chatgpt.md`
  2. Add title and prerequisites (ChatGPT plan, remote MCP server)
  3. Document step-by-step Developer Mode enablement
  4. Explain connector creation process
- **Files**: `docs/guides/chatgpt.md`
- **Parallel?**: No (establishes document structure)
- **Notes**: ChatGPT MCP support is newer than Claude Desktop - note the date.

**Suggested Structure:**
```markdown
# ChatGPT Integration Guide

> **Note**: ChatGPT MCP support was introduced in 2025. This guide reflects
> the configuration as of November 2025.

## Prerequisites

- ChatGPT Pro, Team, Enterprise, or Education plan
- A remote MCP server with HTTPS endpoint
- MCP server must implement OAuth 2.1 (no API token option)

## Enabling Developer Mode

1. Navigate to https://chatgpt.com
2. Click your profile icon
3. Select **Settings**
4. Go to **Apps & Connectors**
5. Click **Advanced Settings**
6. Enable **Developer Mode (beta)**
7. Click **Create** next to "Browser connectors"

## Creating a Connector

Required fields:
- **Connector name**: Display name (e.g., "Mittwald")
- **Description**: Brief functionality explanation
- **Connector URL**: Your MCP server's HTTPS endpoint
```

### Subtask T014 – Write OAuth requirements section
- **Purpose**: Explain what ChatGPT requires from your MCP server.
- **Steps**:
  1. Add "OAuth Requirements" section
  2. Document required OAuth endpoints
  3. Explain DCR (Dynamic Client Registration)
  4. Cover PKCE requirement
  5. Include example OAuth metadata JSON
- **Files**: `docs/guides/chatgpt.md`
- **Parallel?**: Yes (independent section)
- **Notes**: This is server-side configuration, not client-side.

**Content to Include:**
```markdown
## OAuth Requirements

ChatGPT **requires OAuth 2.1** authentication. API tokens are not supported.

### Required Server Endpoints

Your MCP server must expose these OAuth endpoints:

#### 1. Protected Resource Metadata
**Path**: `/.well-known/oauth-protected-resource`

\`\`\`json
{
  "resource": "https://your-mcp-server.com",
  "authorization_servers": ["https://auth.your-server.com"],
  "scopes_supported": ["read", "write"]
}
\`\`\`

#### 2. OpenID Configuration
**Path**: `/.well-known/openid-configuration`

Must include:
- `authorization_endpoint`
- `token_endpoint`
- `registration_endpoint` (for DCR)
- `code_challenge_methods_supported: ["S256"]` (PKCE)

### OAuth Flow

1. ChatGPT discovers your authorization server via metadata
2. ChatGPT registers as a client (Dynamic Client Registration)
3. User authenticates and grants permissions
4. ChatGPT exchanges code for access token (with PKCE)
5. Token is used for subsequent MCP requests
```

### Subtask T015 – Write Mittwald-specific setup
- **Purpose**: Document how to use Mittwald MCP with ChatGPT.
- **Steps**:
  1. Add "Mittwald Setup" section
  2. Provide connector configuration details
  3. Explain OAuth flow with Mittwald
  4. Note any Mittwald-specific considerations
- **Files**: `docs/guides/chatgpt.md`
- **Parallel?**: Yes (independent section)
- **Notes**: Check if Mittwald MCP supports ChatGPT's OAuth requirements.

**Content to Include:**
```markdown
## Mittwald Configuration

### Connector Setup

1. In ChatGPT Developer Mode, create a new connector:
   - **Name**: Mittwald
   - **Description**: Manage Mittwald hosting projects, apps, and databases
   - **URL**: `https://mcp.mittwald.de/mcp`

2. On first use in a chat, you'll be prompted to authenticate

### Authentication Flow

When you first invoke a Mittwald tool:
1. ChatGPT redirects to Mittwald OAuth
2. Log in with your Mittwald credentials
3. Approve requested permissions
4. Return to ChatGPT with active session

### Available Tools

With ChatGPT's 40-tool limit, you may not see all 173 Mittwald tools.
The most commonly used tools are prioritized.
```

### Subtask T016 – Write troubleshooting and limitations
- **Purpose**: Help users resolve issues and set expectations.
- **Steps**:
  1. Add "Troubleshooting" section
  2. Add "Known Limitations" section
  3. Document platform-specific issues
  4. Include workarounds where available
- **Files**: `docs/guides/chatgpt.md`
- **Parallel?**: Yes (independent section)
- **Notes**: Be clear about what ChatGPT cannot do (no local servers, no API tokens).

**Content to Include:**
```markdown
## Troubleshooting

### Connector not working

1. Verify the server URL is HTTPS (HTTP not supported)
2. Check that OAuth endpoints are correctly configured
3. Ensure Dynamic Client Registration is enabled
4. Verify PKCE support on your authorization server

### OAuth flow fails

1. Check browser cookies aren't blocking the auth server
2. Verify the authorization server is accessible
3. Ensure redirect URIs are correctly configured

### Tools not appearing

1. Developer Mode must be enabled for each new chat
2. Check tool limit (40 max)
3. Verify connector is enabled in settings

## Known Limitations

| Limitation | Impact |
|------------|--------|
| No local servers | Must use remote HTTPS server |
| OAuth only | No API token authentication |
| 40 tool limit | May not see all Mittwald tools |
| Per-chat enable | Must enable Developer Mode each chat |
| Web/Windows only | Mac app doesn't support Developer Mode |
| Write tool warnings | All tools may show as "write tools" |

## Workaround: OpenAI Platform API

For testing without OAuth, use the OpenAI Platform API directly:

\`\`\`json
{
  "tools": [{
    "type": "mcp",
    "server_url": "https://mcp.mittwald.de/sse",
    "headers": {
      "Authorization": "Bearer your-token"
    }
  }]
}
\`\`\`

This bypasses the ChatGPT UI OAuth requirement.
```

## Test Strategy

Not applicable (documentation only). Manual review for:
- Step-by-step instructions are accurate
- OAuth requirements match ChatGPT documentation
- Mittwald compatibility status is correct
- Limitations are accurately described

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| ChatGPT MCP support is evolving | Note version/date, link official docs |
| OAuth requirements may change | Reference official MCP spec |
| Mittwald may not support ChatGPT OAuth | Clearly state compatibility status |

## Definition of Done Checklist

- [ ] `docs/guides/chatgpt.md` exists
- [ ] Developer Mode setup is step-by-step
- [ ] OAuth requirements clearly documented
- [ ] Mittwald setup instructions included
- [ ] Limitations section is comprehensive
- [ ] Workarounds provided where possible
- [ ] Document renders correctly in GitHub markdown
- [ ] `tasks.md` updated with completion status

## Review Guidance

- Verify Developer Mode steps against current ChatGPT UI
- Check OAuth endpoint examples are valid JSON
- Ensure limitations are accurate (no exaggeration)
- Confirm workaround (Platform API) is practical

## Activity Log

- 2025-11-26T00:00:00Z – system – lane=planned – Prompt created.
