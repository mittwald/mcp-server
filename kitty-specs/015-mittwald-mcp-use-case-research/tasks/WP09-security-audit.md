# WP09: CS-009 Security Audit Automation

**Feature**: 015-mittwald-mcp-use-case-research
**Work Package**: WP09
**Priority**: P2
**Segment**: SEG-004 Enterprise TYPO3 Developer
**Status**: planned

## Objective

Write a case study demonstrating how an enterprise TYPO3 developer can automate security audits (API tokens, SSH keys, certificates) using MCP.

## Included Subtasks

- [ ] T041: Research user/api/token/certificate tools
- [ ] T042: Write CS-009 persona (SEG-004 TYPO3)
- [ ] T043: Write CS-009 problem statement
- [ ] T044: Write CS-009 workflow (5-7 steps)
- [ ] T045: Write CS-009 outcomes and tool summary

## Context

### Customer Segment (SEG-004)
- **Name**: Enterprise TYPO3 Developer
- **Characteristics**: TYPO3-certified developers working with corporate clients, compliance requirements
- **CMS Preferences**: TYPO3 exclusively
- **Pain Points**: Security compliance audits, tracking API tokens, managing SSH keys, certificate expiration monitoring
- **MCP Opportunity**: Automated security posture visibility and audit workflows

### Primary Tools to Cover
- `user/api/token/list` - List API tokens for audit
- `user/api/token/get` - Get token details
- `user/ssh/key/list` - List SSH keys
- `certificate/list` - List SSL certificates
- `user/session/list` - List active sessions

## Instructions

1. **Research Phase**: Read the tool descriptions from `evals/inventory/tools-current.json` for the identity domain tools. Focus on audit-relevant capabilities.

2. **Write Case Study**: Create the file `findings/CS-009-security-audit-automation.md` following the template in `quickstart.md`.

3. **Section 1 - Persona**: Use SEG-004 context (same as CS-004). Create a persona focused on security compliance (e.g., "Enterprise TYPO3 consultant preparing for a client's ISO 27001 audit").

4. **Section 2 - Problem**: Describe security audit challenges - scattered credentials, unknown active sessions, certificate expiration surprises.

5. **Section 3 - Solution Workflow**:
   - List prerequisites (MCP server connected, organization admin access)
   - Write 5-7 steps covering: API token audit, SSH key inventory, certificate check, session review
   - Emphasize compliance and documentation value
   - Each step must list tools used and expected output

6. **Section 4 - Outcomes**: Focus on audit readiness, security visibility, compliance documentation.

7. **Quality Check**: Run through the checklist in `quickstart.md` before marking complete.

## Output File

```
kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-009-security-audit-automation.md
```

## Dependencies

Conceptually follows WP04 (same segment), but no technical dependency.

## Acceptance Criteria

- [ ] Case study follows 4-section streamlined format
- [ ] All 5 primary tools are used in the workflow
- [ ] Persona uses SEG-004 segment ID
- [ ] Problem statement includes business impact (compliance risk)
- [ ] Each workflow step has Tools Used and Expected Output
- [ ] Security and compliance terminology accurate
- [ ] File saved to correct location in findings/
