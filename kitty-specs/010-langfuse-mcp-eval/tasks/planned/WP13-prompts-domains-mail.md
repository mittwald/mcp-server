---
work_package_id: "WP13"
subtasks:
  - "T001"
title: "Generate Prompts - domains-mail (20 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:13:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
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

