---
work_package_id: WP01
title: OAuth Scope Caching Documentation
lane: done
history:
- timestamp: '2025-11-26T00:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-11-26T17:15:00Z'
  lane: doing
  agent: claude
  shell_pid: implement-session
  action: Started implementation - all WPs straight through
agent: claude
assignee: claude
phase: Phase 1 - Core Documentation
shell_pid: implement-session
subtasks:
- T001
- T002
- T003
- T004
---

# Work Package Prompt: WP01 – OAuth Scope Caching Documentation

## Objectives & Success Criteria

- Create `docs/oauth-scope-caching.md` explaining the intentional session-scoped caching behavior
- Document that scope changes require a new OAuth flow (by design, not a bug)
- Provide clear guidance on when users need to re-authenticate
- Include troubleshooting FAQ for common confusion

**Success Metrics:**
- Document exists at correct path
- All four sections complete (overview, rationale, guidance, troubleshooting)
- No broken links
- Technically accurate (matches actual implementation)

## Context & Constraints

- **Spec**: `/kitty-specs/002-mcp-documentation-sprint/spec.md` - Deliverable 1
- **Research**: `/kitty-specs/002-mcp-documentation-sprint/research.md` - OAuth details in section 2
- **Constitution**: Documentation-only feature, no code changes

**Key Technical Facts:**
- OAuth 2.1 with PKCE flow
- Scopes are cached for session lifetime
- Token refresh maintains existing scopes
- New scopes require complete re-authentication

## Subtasks & Detailed Guidance

### Subtask T001 – Create docs/ directory structure
- **Purpose**: Ensure target directory exists for documentation files.
- **Steps**:
  1. Check if `docs/` directory exists
  2. Create if missing
  3. Verify `docs/guides/` will be created by WP03
- **Files**: `docs/` directory
- **Parallel?**: No (must complete before other subtasks)
- **Notes**: Directory may already exist from previous features.

### Subtask T002 – Write overview section
- **Purpose**: Introduce what OAuth scope caching is and why users encounter it.
- **Steps**:
  1. Create `docs/oauth-scope-caching.md`
  2. Add title and introduction
  3. Explain session-scoped token concept
  4. Describe typical user scenario where this matters
- **Files**: `docs/oauth-scope-caching.md`
- **Parallel?**: No (establishes document structure)
- **Notes**: Keep language accessible to non-OAuth experts.

**Suggested Structure:**
```markdown
# OAuth Scope Caching

## Overview

When you authenticate with the Mittwald MCP server via OAuth, the permissions
(scopes) you grant are cached for the duration of your session...

## What This Means for You

- Your initial OAuth authorization determines available tools
- Adding new scopes requires a fresh OAuth flow
- Token refresh maintains existing permissions but doesn't add new ones
```

### Subtask T003 – Write "Why This Behavior Exists" section
- **Purpose**: Explain the security/UX tradeoff behind this design decision.
- **Steps**:
  1. Add section explaining design rationale
  2. Cover security benefits (scope reduction, explicit consent)
  3. Cover UX benefits (predictable permissions, no mid-session surprises)
  4. Acknowledge the tradeoff (inconvenience when scopes change)
- **Files**: `docs/oauth-scope-caching.md`
- **Parallel?**: Yes (can write independently once T002 establishes structure)
- **Notes**: Frame as intentional design, not limitation.

**Key Points to Cover:**
- Security: Users explicitly consent to each scope set
- Predictability: Tools available at session start remain consistent
- Tradeoff: If server adds new tools requiring new scopes, re-auth needed

### Subtask T004 – Write troubleshooting FAQ section
- **Purpose**: Answer common questions about scope behavior.
- **Steps**:
  1. Add troubleshooting/FAQ section
  2. Include "Why don't I see new permissions?" answer
  3. Include "How do I get new scopes?" answer
  4. Include step-by-step re-authentication instructions
- **Files**: `docs/oauth-scope-caching.md`
- **Parallel?**: Yes (can write independently once T002 establishes structure)
- **Notes**: Use actual error messages users might see.

**Suggested FAQ Items:**
1. "I authorized new scopes but tools aren't working" → Re-authenticate
2. "How do I force a scope refresh?" → Clear session, re-authenticate
3. "Will my existing session break if scopes change?" → No, but new tools unavailable
4. "How long do scopes last?" → Session lifetime (until token expiry or logout)

## Test Strategy

Not applicable (documentation only). Manual review for:
- Technical accuracy
- Completeness per spec
- Valid markdown rendering
- No broken links

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Misrepresenting OAuth behavior | Cross-reference with `src/oauth/` implementation |
| Using incorrect terminology | Review OAuth 2.1 specification terms |
| Confusing users further | Have non-developer review for clarity |

## Definition of Done Checklist

- [ ] `docs/oauth-scope-caching.md` exists
- [ ] Overview section explains scope caching concept
- [ ] "Why This Behavior" section covers design rationale
- [ ] Troubleshooting FAQ answers common questions
- [ ] Re-authentication steps are clear and actionable
- [ ] Document renders correctly in GitHub markdown
- [ ] `tasks.md` updated with completion status

## Review Guidance

- Verify technical accuracy against actual OAuth implementation
- Check that document answers the question "why don't I see new permissions?"
- Ensure tone is explanatory, not defensive
- Confirm all code examples use valid syntax

## Activity Log

- 2025-11-26T00:00:00Z – system – lane=planned – Prompt created.
