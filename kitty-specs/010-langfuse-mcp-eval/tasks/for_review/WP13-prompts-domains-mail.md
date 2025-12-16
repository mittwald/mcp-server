---
work_package_id: "WP13"
subtasks:
  - "T001"
title: "Generate Prompts - domains-mail (20 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "for_review"
assignee: ""
agent: "claude"
shell_pid: "31343"
review_status: ""
reviewed_by: "claude"
history:
  - timestamp: "2025-12-16T13:13:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T17:19:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "99395"
    action: "Started implementation - verifying and enhancing prompts"
  - timestamp: "2025-12-16T17:32:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "99395"
    action: "Completed - 21 prompts verified, README.md added with DNS/cert warnings"
  - timestamp: "2025-12-16T18:30:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: ""
    action: "REVIEW - changes_requested - see Review Feedback section below"
  - timestamp: "2025-12-16T18:40:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "31343"
    action: "Acknowledged feedback - addressing Issue 1 and Issue 2"
  - timestamp: "2025-12-16T18:45:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "31343"
    action: "Addressed feedback: Added destructive tag/warning to domain-virtualhost-delete.json (Issue 1), Added DNS propagation warning to domain-dnszone-update.json (Issue 2)"
---

# Work Package Prompt: WP13 – Generate Prompts - domains-mail (20 tools)

## Objective

Generate Langfuse-compatible eval prompts for all 20 tools in the domains-mail domain covering DNS, virtualhosts, mail, and certificates.

## Domain Overview

| Domain | domains-mail |
|--------|--------------|
| Tool Count | 20 |
| Primary Tier | 4 (requires project) |
| Prefixes | `domain/`, `mail/`, `certificate/` |
| Risk Level | Medium-High (DNS changes can affect live sites) |

## Tool List

### domain/ tools (9)

| Tool | Tier | Destructive |
|------|------|-------------|
| `domain/list` | 4 | No |
| `domain/get` | 4 | No |
| `domain/dnszone/list` | 4 | No |
| `domain/dnszone/get` | 4 | No |
| `domain/dnszone/update` | 4 | No (but affects DNS) |
| `domain/virtualhost-list` | 4 | No |
| `domain/virtualhost-get` | 4 | No |
| `domain/virtualhost-create` | 4 | No |
| `domain/virtualhost-delete` | 4 | **Yes** |

### mail/address/ tools (5)

| Tool | Tier | Destructive |
|------|------|-------------|
| `mail/address/list` | 4 | No |
| `mail/address/get` | 4 | No |
| `mail/address/create` | 4 | No |
| `mail/address/update` | 4 | No |
| `mail/address/delete` | 4 | **Yes** |

### mail/deliverybox/ tools (5)

| Tool | Tier | Destructive |
|------|------|-------------|
| `mail/deliverybox/list` | 4 | No |
| `mail/deliverybox/get` | 4 | No |
| `mail/deliverybox/create` | 4 | No |
| `mail/deliverybox/update` | 4 | No |
| `mail/deliverybox/delete` | 4 | **Yes** |

### certificate/ tools (2)

| Tool | Tier | Destructive |
|------|------|-------------|
| `certificate/list` | 4 | No |
| `certificate/request` | 4 | No |

## Key Considerations

### DNS Updates
- `domain/dnszone/update` can affect live domains
- Changes may take time to propagate
- Use caution with production domains

### Mail Operations
- Creating mail addresses may require domain ownership
- Test with subdomains if possible

### Certificates
- `certificate/request` triggers Let's Encrypt validation
- Domain must be properly configured

## Deliverables

- [ ] `evals/prompts/domains-mail/domain-list.json`
- [ ] `evals/prompts/domains-mail/domain-get.json`
- [ ] `evals/prompts/domains-mail/domain-dnszone-list.json`
- [ ] `evals/prompts/domains-mail/domain-dnszone-get.json`
- [ ] `evals/prompts/domains-mail/domain-dnszone-update.json`
- [ ] `evals/prompts/domains-mail/domain-virtualhost-list.json`
- [ ] `evals/prompts/domains-mail/domain-virtualhost-get.json`
- [ ] `evals/prompts/domains-mail/domain-virtualhost-create.json`
- [ ] `evals/prompts/domains-mail/domain-virtualhost-delete.json`
- [ ] `evals/prompts/domains-mail/mail-address-list.json`
- [ ] `evals/prompts/domains-mail/mail-address-get.json`
- [ ] `evals/prompts/domains-mail/mail-address-create.json`
- [ ] `evals/prompts/domains-mail/mail-address-update.json`
- [ ] `evals/prompts/domains-mail/mail-address-delete.json`
- [ ] `evals/prompts/domains-mail/mail-deliverybox-list.json`
- [ ] `evals/prompts/domains-mail/mail-deliverybox-get.json`
- [ ] `evals/prompts/domains-mail/mail-deliverybox-create.json`
- [ ] `evals/prompts/domains-mail/mail-deliverybox-update.json`
- [ ] `evals/prompts/domains-mail/mail-deliverybox-delete.json`
- [ ] `evals/prompts/domains-mail/certificate-list.json`
- [ ] `evals/prompts/domains-mail/certificate-request.json`

**Total**: 20 JSON files (note: 20 not 18 as originally estimated)

## Acceptance Criteria

1. All 20 prompt files created
2. DNS update warnings included
3. Certificate prerequisites documented

---

## Review Feedback

**Reviewer**: claude
**Status**: changes_requested
**Date**: 2025-12-16

### Summary

The WP is mostly complete with 21 valid prompt files and comprehensive README.md documentation. However, there are inconsistencies in destructive operation handling that should be addressed.

### Issues Found

#### Issue 1: Missing destructive tag and warning on `domain-virtualhost-delete.json`

**Severity**: Moderate

The `mail-address-delete.json` and `mail-deliverybox-delete.json` correctly have:
- `"destructive"` in metadata.tags array
- `⚠️ WARNING: This is a destructive operation` in prompt text

But `domain-virtualhost-delete.json` is missing both. This inconsistency could cause evaluators to proceed with destructive operations without adequate warning.

**Required Fix**:
1. Add `"destructive"` to the tags array in metadata
2. Add the warning banner after the Description in the prompt text:
   ```
   **⚠️ WARNING**: This is a destructive operation. Ensure you have the correct resource ID and any required confirmations before executing.
   ```

#### Issue 2: Missing DNS propagation warning in `domain-dnszone-update.json`

**Severity**: Minor

The README.md correctly documents DNS propagation risks, but the prompt itself doesn't contain inline warnings. While the README exists, evaluators running the prompt directly may not see this documentation.

**Recommended Fix** (optional):
Add a DNS-specific warning to the prompt text:
```
**⚠️ DNS WARNING**: DNS changes can affect live domains and may take time to propagate globally (5 minutes to 48 hours). Exercise caution with production domains.
```

### Verdict

**Changes Required** before approval:
- [ ] Fix Issue 1 (required)
- [ ] Consider Issue 2 (optional but recommended)

