# WP01: CS-001 Freelancer Client Onboarding

**Feature**: 015-mittwald-mcp-use-case-research
**Work Package**: WP01
**Priority**: P1
**Segment**: SEG-001 Freelance Web Developer
**Status**: done

## Objective

Write a case study demonstrating how a freelancer can automate new client setup (project, domain, DNS, email, SSL) using MCP.

## Included Subtasks

- [x] T001: Research domain/mail/certificate tools for client setup
- [x] T002: Write CS-001 persona (SEG-001 Freelancer)
- [x] T003: Write CS-001 problem statement
- [x] T004: Write CS-001 workflow (5-7 steps)
- [x] T005: Write CS-001 outcomes and tool summary

## Context

### Customer Segment (SEG-001)
- **Name**: Freelance Web Developer
- **Characteristics**: Solo practitioners managing multiple client websites
- **CMS Preferences**: WordPress, custom PHP/Node.js sites
- **Pain Points**: Manual repetitive setup tasks, context switching between MStudio screens
- **MCP Opportunity**: Automate full client onboarding in one natural language conversation

### Primary Tools to Cover
- `project/create` - Create new Mittwald project
- `domain/virtualhost/create` - Configure domain for project
- `domain/dnszone/update` - Set DNS records (A, CNAME, MX)
- `mail/address/create` - Create email addresses
- `mail/deliverybox/create` - Create mailbox storage
- `certificate/request` - Request SSL certificate

## Instructions

1. **Research Phase**: Read the tool descriptions from `evals/inventory/tools-current.json` for the primary tools listed above. Understand their parameters and expected outputs.

2. **Write Case Study**: Create the file `findings/CS-001-freelancer-client-onboarding.md` following the template in `quickstart.md`.

3. **Section 1 - Persona**: Use SEG-001 context above. Create a realistic freelancer persona (e.g., "Solo WordPress developer managing 8 client websites").

4. **Section 2 - Problem**: Describe the pain of manual client setup - time wasted, error-prone steps, context switching.

5. **Section 3 - Solution Workflow**:
   - List prerequisites (MCP server connected, organization with project quota)
   - Write 5-7 steps showing natural language prompts
   - Each step must list tools used and expected output
   - Use realistic prompts a developer would actually type

6. **Section 4 - Outcomes**: Quantify time savings (e.g., "45 minutes → 3 minutes"), list errors avoided, suggest next steps.

7. **Quality Check**: Run through the checklist in `quickstart.md` before marking complete.

## Output File

```
kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-001-freelancer-client-onboarding.md
```

## Dependencies

None - this work package can start immediately.

## Acceptance Criteria

- [x] Case study follows 4-section streamlined format
- [x] All 6 primary tools are used in the workflow
- [x] Persona uses SEG-001 segment ID
- [x] Problem statement includes business impact
- [x] Each workflow step has Tools Used and Expected Output
- [x] Outcomes include time saved and error reduction
- [x] File saved to correct location in findings/

## Implementation Notes

**Implemented by**: claude-opus
**Completed**: 2025-01-19
**Output**: `findings/CS-001-freelancer-client-onboarding.md`

The case study covers 10 tools total (6 primary + 4 verification):
- Primary: project/create, domain/virtualhost/create, domain/dnszone/update, mail/address/create, mail/deliverybox/create, certificate/request
- Verification: project/get, domain/virtualhost/list, mail/address/list, certificate/list

Ready for review.
