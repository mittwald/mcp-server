# WP07: CS-007 New Developer Onboarding

**Feature**: 015-mittwald-mcp-use-case-research
**Work Package**: WP07
**Priority**: P2
**Segment**: SEG-002 Web Development Agency
**Status**: planned

## Objective

Write a case study demonstrating how an agency can onboard new developers with proper SSH, SFTP, and organization access using MCP.

## Included Subtasks

- [ ] T031: Research ssh/sftp/org/identity tools
- [ ] T032: Write CS-007 persona (SEG-002 Agency)
- [ ] T033: Write CS-007 problem statement
- [ ] T034: Write CS-007 workflow (5-7 steps)
- [ ] T035: Write CS-007 outcomes and tool summary

## Context

### Customer Segment (SEG-002)
- **Name**: Web Development Agency
- **Characteristics**: Teams of 3-15 developers with regular onboarding/offboarding
- **CMS Preferences**: Mix of WordPress, TYPO3, custom frameworks
- **Pain Points**: Manual access provisioning, inconsistent permissions, forgotten accounts after employee departure
- **MCP Opportunity**: Streamlined access management through conversational interface

### Primary Tools to Cover
- `ssh/user/create` - Create SSH user for new developer
- `ssh/user/list` - Audit existing SSH users
- `sftp/user/list` - List SFTP access
- `org/invite` - Invite user to organization
- `org/membership/list` - List organization members
- `user/ssh/key/create` - Add SSH key for user

## Instructions

1. **Research Phase**: Read the tool descriptions from `evals/inventory/tools-current.json` for the identity, ssh, sftp, and org domain tools.

2. **Write Case Study**: Create the file `findings/CS-007-developer-onboarding.md` following the template in `quickstart.md`.

3. **Section 1 - Persona**: Use SEG-002 context (same as CS-002). Create a persona focused on team management (e.g., "Operations lead at a 15-person agency onboarding 2 new junior developers").

4. **Section 2 - Problem**: Describe onboarding challenges - multiple systems to configure, forgetting access points, security risks from orphaned accounts.

5. **Section 3 - Solution Workflow**:
   - List prerequisites (MCP server connected, organization admin access, new developer details)
   - Write 5-7 steps covering: org invite, SSH user creation, SSH key setup, access verification
   - Emphasize security best practices
   - Each step must list tools used and expected output

6. **Section 4 - Outcomes**: Focus on faster onboarding, consistent access setup, security compliance.

7. **Quality Check**: Run through the checklist in `quickstart.md` before marking complete.

## Output File

```
kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-007-developer-onboarding.md
```

## Dependencies

Conceptually follows WP02 (same segment), but no technical dependency.

## Acceptance Criteria

- [ ] Case study follows 4-section streamlined format
- [ ] All 6 primary tools are used in the workflow
- [ ] Persona uses SEG-002 segment ID
- [ ] Problem statement includes business impact (security, efficiency)
- [ ] Each workflow step has Tools Used and Expected Output
- [ ] Security considerations emphasized
- [ ] File saved to correct location in findings/
