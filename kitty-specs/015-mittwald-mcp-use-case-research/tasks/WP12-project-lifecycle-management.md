# WP12: CS-012 Project Lifecycle Management

**Feature**: 015-mittwald-mcp-use-case-research
**Work Package**: WP12
**Priority**: P1
**Segment**: SEG-002 Web Development Agency
**Status**: planned

## Objective

Write a case study demonstrating how an agency can manage the complete project lifecycle—from initial setup through archival and deletion—using MCP. This case study specifically targets the "cleanup" and "management" tools that are missing from other case studies.

## Included Subtasks

- [ ] T056: Research project/server/org lifecycle tools
- [ ] T057: Write CS-012 persona (SEG-002 Agency)
- [ ] T058: Write CS-012 problem statement
- [ ] T059: Write CS-012 workflow (7-9 steps)
- [ ] T060: Write CS-012 outcomes and tool summary

## Context

### Customer Segment (SEG-002)
- **Name**: Web Development Agency
- **Characteristics**: Teams managing many client projects with varying lifecycles
- **Pain Points**: Orphaned projects, unclear resource usage, inconsistent offboarding
- **MCP Opportunity**: Complete visibility and control over project lifecycle

### Primary Tools to Cover (14 tools)

**Server/Infrastructure:**
- `server/get` - Get server details
- `server/list` - List available servers

**Project Management:**
- `project/delete` - Delete/archive a project
- `project/update` - Update project settings
- `project/invite/get` - Get project invitation details
- `project/invite/list` - List pending project invitations
- `project/membership/get` - Get membership details

**Organization Management:**
- `org/list` - List organizations
- `org/invite/list` - List pending org invitations
- `org/invite/revoke` - Revoke pending invitation
- `org/membership/revoke` - Remove member from organization

**Application Management:**
- `app/list` - List all apps in a project
- `app/uninstall` - Uninstall an application
- `app/versions` - List available app versions

## Instructions

1. **Research Phase**: Read tool descriptions from `evals/inventory/tools-current.json` for project-foundation, organization, and apps domains. Focus on lifecycle and cleanup operations.

2. **Write Case Study**: Create `findings/CS-012-project-lifecycle-management.md` following the template in `quickstart.md`.

3. **Section 1 - Persona**: Agency operations manager responsible for quarterly infrastructure audits. Managing 60 projects across 3 organizations.

4. **Section 2 - Problem**: Describe chaos of unmanaged project lifecycles—orphaned projects consuming resources, departed clients still having access, unclear which servers host which projects, pending invitations never accepted.

5. **Section 3 - Solution Workflow**:
   - List prerequisites (MCP server connected, org admin access)
   - Write 7-9 steps covering:
     1. List all organizations for overview
     2. Inventory servers and their projects
     3. Audit project memberships and pending invitations
     4. Revoke access for departed team members
     5. Uninstall unused applications
     6. Update project metadata/settings
     7. Archive/delete completed client projects
     8. Generate lifecycle status report
   - Each step must list tools used and expected output

6. **Section 4 - Outcomes**: Focus on resource reclamation, security posture, cost savings from cleanup.

7. **Quality Check**: Run through checklist in `quickstart.md` before marking complete.

## Output File

```
kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-012-project-lifecycle-management.md
```

## Dependencies

None - can be implemented independently.

## Acceptance Criteria

- [ ] Case study follows 4-section streamlined format
- [ ] All 14 primary tools are used in the workflow
- [ ] Persona uses SEG-002 segment ID
- [ ] Problem statement includes business impact (resource waste, security risk)
- [ ] Each workflow step has Tools Used and Expected Output
- [ ] Cleanup/deletion operations shown with appropriate warnings
- [ ] File saved to correct location in findings/

## Coverage Gap Addressed

This WP addresses the missing "list", "delete", and "management" operations that were not covered in WP01-WP10:
- All server/* tools (completely missing before)
- Project delete/update/invite operations
- Organization listing and access revocation
- Application listing and uninstallation
