# WP13: CS-013 Email & Domain Administration

**Feature**: 015-mittwald-mcp-use-case-research
**Work Package**: WP13
**Priority**: P1
**Segment**: SEG-001 Freelance Web Developer
**Status**: planned

## Objective

Write a case study demonstrating comprehensive email and domain administration—including updating, inspecting, and removing configurations—using MCP. This case study specifically targets the "get", "update", and "delete" operations for domains and mail that are missing from other case studies.

## Included Subtasks

- [ ] T061: Research domain and mail CRUD tools
- [ ] T062: Write CS-013 persona (SEG-001 Freelancer)
- [ ] T063: Write CS-013 problem statement
- [ ] T064: Write CS-013 workflow (6-8 steps)
- [ ] T065: Write CS-013 outcomes and tool summary

## Context

### Customer Segment (SEG-001)
- **Name**: Freelance Web Developer
- **Characteristics**: Solo practitioners managing client email and domain configurations
- **Pain Points**: Client domain migrations, email forwarding updates, cleaning up old configurations
- **MCP Opportunity**: Complete domain and email management without MStudio navigation

### Primary Tools to Cover (12 tools)

**Domain Operations:**
- `domain/get` - Get domain details
- `domain/dnszone/get` - Get DNS zone details
- `domain/dnszone/list` - List all DNS zones
- `domain/virtualhost/get` - Get virtualhost configuration
- `domain/virtualhost/delete` - Remove virtualhost

**Email Address Operations:**
- `mail/address/get` - Get email address details
- `mail/address/delete` - Delete email address
- `mail/address/update` - Update email address (forwarding, etc.)

**Deliverybox Operations:**
- `mail/deliverybox/get` - Get deliverybox details
- `mail/deliverybox/list` - List all deliveryboxes
- `mail/deliverybox/delete` - Delete deliverybox
- `mail/deliverybox/update` - Update deliverybox settings (quota, etc.)

## Instructions

1. **Research Phase**: Read tool descriptions from `evals/inventory/tools-current.json` for domains-mail domain. Focus on get, update, and delete operations.

2. **Write Case Study**: Create `findings/CS-013-email-domain-administration.md` following the template in `quickstart.md`.

3. **Section 1 - Persona**: Freelancer helping a client migrate their business email after a company rebrand. Old domain needs cleanup, new domain needs configuration.

4. **Section 2 - Problem**: Describe client rebrand scenario—company changed from "oldname.de" to "newname.de", needs email addresses migrated, old configurations removed, DNS properly updated. Manual process is error-prone and time-consuming.

5. **Section 3 - Solution Workflow**:
   - List prerequisites (MCP server connected, both domains in project)
   - Write 6-8 steps covering:
     1. Inspect current domain and DNS configuration
     2. List all email addresses and deliveryboxes on old domain
     3. Get details for each email address to understand forwarding rules
     4. Update email addresses with new forwarding (transition period)
     5. Update deliverybox quotas for new domain
     6. Delete old email addresses after migration confirmed
     7. Remove old virtualhost configuration
     8. Verify clean state
   - Each step must list tools used and expected output

6. **Section 4 - Outcomes**: Focus on clean migration, no orphaned configurations, client satisfaction.

7. **Quality Check**: Run through checklist in `quickstart.md` before marking complete.

## Output File

```
kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-013-email-domain-administration.md
```

## Dependencies

None - can be implemented independently.

## Acceptance Criteria

- [ ] Case study follows 4-section streamlined format
- [ ] All 12 primary tools are used in the workflow
- [ ] Persona uses SEG-001 segment ID
- [ ] Problem statement includes business impact (migration errors, client frustration)
- [ ] Each workflow step has Tools Used and Expected Output
- [ ] Delete operations shown with appropriate verification steps
- [ ] File saved to correct location in findings/

## Coverage Gap Addressed

This WP addresses the missing "get", "update", and "delete" operations for domains and email:
- domain/get, domain/dnszone/get, domain/dnszone/list (inspection)
- domain/virtualhost/get, domain/virtualhost/delete (virtualhost management)
- Complete mail/address/* CRUD (get, update, delete)
- Complete mail/deliverybox/* operations (get, list, update, delete)
