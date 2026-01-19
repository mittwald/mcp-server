# WP02: CS-002 Agency Multi-Project Management

**Feature**: 015-mittwald-mcp-use-case-research
**Work Package**: WP02
**Priority**: P1
**Segment**: SEG-002 Web Development Agency
**Status**: for_review

## Objective

Write a case study demonstrating how an agency can manage multiple client projects, team coordination, and support conversations using MCP.

## Included Subtasks

- [x] T006: Research org/membership/misc tools
- [x] T007: Write CS-002 persona (SEG-002 Agency)
- [x] T008: Write CS-002 problem statement
- [x] T009: Write CS-002 workflow (5-7 steps)
- [x] T010: Write CS-002 outcomes and tool summary

## Context

### Customer Segment (SEG-002)
- **Name**: Web Development Agency
- **Characteristics**: Teams of 3-15 developers managing portfolios of client projects
- **CMS Preferences**: Mix of WordPress, TYPO3, custom frameworks
- **Pain Points**: Coordinating access across team members, tracking multiple projects, support ticket management
- **MCP Opportunity**: Centralized project oversight and team coordination through natural language

### Primary Tools to Cover
- `project/list` - List all projects in organization
- `org/get` - Get organization details
- `org/membership/list` - List organization members
- `conversation/create` - Create support conversation
- `conversation/list` - List support conversations
- `conversation/reply` - Reply to support conversation

## Instructions

1. **Research Phase**: Read the tool descriptions from `evals/inventory/tools-current.json` for the primary tools listed above. Pay special attention to the misc domain (conversations).

2. **Write Case Study**: Create the file `findings/CS-002-agency-multi-project-management.md` following the template in `quickstart.md`.

3. **Section 1 - Persona**: Use SEG-002 context above. Create a realistic agency persona (e.g., "Technical lead at a 12-person agency managing 40+ client projects").

4. **Section 2 - Problem**: Describe challenges of multi-project oversight - scattered information, access management complexity, support ticket tracking.

5. **Section 3 - Solution Workflow**:
   - List prerequisites (MCP server connected, organization admin access)
   - Write 5-7 steps showing natural language prompts
   - Include scenarios: project overview, team member audit, support ticket creation
   - Each step must list tools used and expected output

6. **Section 4 - Outcomes**: Focus on visibility gains, reduced context switching, faster support response.

7. **Quality Check**: Run through the checklist in `quickstart.md` before marking complete.

## Output File

```
kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-002-agency-multi-project-management.md
```

## Dependencies

None - can run in parallel with WP01.

## Acceptance Criteria

- [x] Case study follows 4-section streamlined format
- [x] All 6 primary tools are used in the workflow
- [x] Persona uses SEG-002 segment ID
- [x] Problem statement includes business impact
- [x] Each workflow step has Tools Used and Expected Output
- [x] Outcomes include time saved and error reduction
- [x] File saved to correct location in findings/

## Implementation Notes

**Implemented by**: claude-opus
**Completed**: 2025-01-19
**Output**: `findings/CS-002-agency-multi-project-management.md`

Tools covered (6 primary):
- org/get, project/list, org/membership/list
- conversation/list, conversation/create, conversation/reply

Ready for review.
