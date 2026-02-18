# Quickstart: Complete Documentation Gap

**Feature**: 017-complete-documentation-gap
**Date**: 2025-01-25

## TL;DR

Write 14 markdown files to complete the Mittwald MCP documentation:
- 2 OAuth guides (Claude Code, GitHub Copilot)
- 10 case study tutorials (from Feature 015 research)
- 1 case studies index page
- Update 1 existing file (getting-started/index.md)

## Quick Reference

### File Locations

```bash
# OAuth Guides
docs/setup-and-guides/src/content/docs/getting-started/claude-code.md     # NEW
docs/setup-and-guides/src/content/docs/getting-started/github-copilot.md  # NEW
docs/setup-and-guides/src/content/docs/getting-started/index.md           # UPDATE

# Case Studies
docs/setup-and-guides/src/content/docs/case-studies/index.md              # NEW
docs/setup-and-guides/src/content/docs/case-studies/*.md                  # 10 NEW files
```

### Template Sources

```bash
# OAuth guide template (copy structure from):
docs/setup-and-guides/src/content/docs/getting-started/cursor.md

# Case study content sources:
kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-001-*.md
kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-002-*.md
# ... through CS-010
```

### Research Reference

```bash
# MCP integration details for Claude Code and GitHub Copilot:
kitty-specs/017-complete-documentation-gap/research.md
```

## OAuth Guide Checklist

Each OAuth guide must include:

- [ ] Prerequisites section
- [ ] **Both authentication paths**:
  - [ ] OAuth path (DCR, browser flow, token refresh)
  - [ ] API key path (direct Mittwald token)
- [ ] Step-by-step configuration for the specific tool
- [ ] Verification steps
- [ ] 5+ troubleshooting scenarios
- [ ] 6+ FAQ items
- [ ] Next Steps links

### Claude Code Specifics

```bash
# Add server command:
claude mcp add --transport http mittwald https://mittwald-mcp-fly2.fly.dev/mcp

# With API key:
claude mcp add --transport http mittwald https://mittwald-mcp-fly2.fly.dev/mcp \
  --header "Authorization: Bearer YOUR_MITTWALD_API_TOKEN"

# Authenticate (OAuth):
/mcp  # then follow prompts
```

### GitHub Copilot Specifics

```json
// .vscode/mcp.json format:
{
  "servers": {
    "mittwald": {
      "type": "http",
      "url": "https://mittwald-mcp-fly2.fly.dev/mcp"
    }
  }
}
```

OAuth: Click "Auth" CodeLens above server config
API Key: Add `headers` with `Authorization: Bearer ${input:token}`

## Case Study Checklist

Each case study must include:

- [ ] Frontmatter (title, description)
- [ ] Who Is This For? (persona from CS-XXX)
- [ ] What You'll Solve (problem from CS-XXX)
- [ ] Prerequisites (link to getting-started)
- [ ] Step-by-Step Guide (transformed from CS-XXX Solution)
- [ ] What You'll Achieve (outcomes from CS-XXX)
- [ ] Tools Reference table with links to `/reference/tools/{domain}/{tool}/`
- [ ] Related Tutorials links

### Case Study → File Mapping

| CS ID | Segment | File Name |
|-------|---------|-----------|
| CS-001 | Freelancer | `freelancer-client-onboarding.md` |
| CS-002 | Agency | `agency-multi-project-management.md` |
| CS-003 | E-commerce | `ecommerce-launch-day.md` |
| CS-004 | TYPO3 | `typo3-multisite-deployment.md` |
| CS-005 | Modern Stack | `container-stack-deployment.md` |
| CS-006 | Freelancer | `automated-backup-monitoring.md` |
| CS-007 | Agency | `developer-onboarding.md` |
| CS-008 | E-commerce | `database-performance.md` |
| CS-009 | TYPO3 | `security-audit-automation.md` |
| CS-010 | Modern Stack | `cicd-pipeline-integration.md` |

## Build Validation

```bash
# After writing all files, validate:
cd docs/setup-and-guides
npm run build

# Expected: Build succeeds with no errors
```

## Common Tool Reference Links

When referencing MCP tools, use this link format:

```markdown
[`project/create`](/reference/tools/project/project-create/)
[`domain/virtualhost/create`](/reference/tools/domain/domain-virtualhost-create/)
[`mail/address/create`](/reference/tools/mail/mail-address-create/)
[`backup/schedule/create`](/reference/tools/backup/backup-schedule-create/)
```

## Endpoints Reference

| Purpose | URL |
|---------|-----|
| MCP Server | `https://mittwald-mcp-fly2.fly.dev/mcp` |
| OAuth Authorization | `https://mittwald-oauth-server.fly.dev/oauth/authorize` |
| OAuth Token | `https://mittwald-oauth-server.fly.dev/oauth/token` |
| OAuth Registration (DCR) | `https://mittwald-oauth-server.fly.dev/oauth/register` |
