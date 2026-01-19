# WP14: CS-014 Infrastructure Maintenance & Cleanup

**Feature**: 015-mittwald-mcp-use-case-research
**Work Package**: WP14
**Priority**: P1
**Segment**: SEG-005 Modern Stack Developer
**Status**: planned

## Objective

Write a case study demonstrating comprehensive infrastructure maintenance—including database user management, backup cleanup, container registry maintenance, credential rotation, and cronjob management—using MCP. This case study specifically targets the remaining "get", "update", "delete", and "create" operations missing from other case studies.

## Included Subtasks

- [ ] T066: Research remaining maintenance and cleanup tools
- [ ] T067: Write CS-014 persona (SEG-005 Modern Stack)
- [ ] T068: Write CS-014 problem statement
- [ ] T069: Write CS-014 workflow (8-10 steps)
- [ ] T070: Write CS-014 outcomes and tool summary

## Context

### Customer Segment (SEG-005)
- **Name**: Modern Stack Developer
- **Characteristics**: DevOps-oriented developers managing containerized applications with complex infrastructure
- **Pain Points**: Credential sprawl, orphaned resources, inconsistent maintenance procedures
- **MCP Opportunity**: Unified infrastructure maintenance and hygiene workflows

### Primary Tools to Cover (30 tools)

**Backup Cleanup:**
- `backup/delete` - Delete old backups
- `backup/schedule/delete` - Remove backup schedule

**Database User Management:**
- `database/mysql/delete` - Delete MySQL database
- `database/mysql/user/create` - Create database user
- `database/mysql/user/get` - Get user details
- `database/mysql/user/delete` - Delete database user
- `database/mysql/user/update` - Update user permissions
- `database/redis/get` - Get Redis instance details
- `database/redis/versions` - List available Redis versions

**Container/Registry Cleanup:**
- `registry/delete` - Delete container registry
- `registry/update` - Update registry settings
- `stack/delete` - Delete container stack

**SSH/SFTP Cleanup:**
- `sftp/user/delete` - Delete SFTP user
- `ssh/user/delete` - Delete SSH user
- `ssh/user/update` - Update SSH user settings

**Cronjob Management (Full CRUD):**
- `cronjob/get` - Get cronjob details
- `cronjob/update` - Update cronjob configuration
- `cronjob/delete` - Delete cronjob
- `cronjob/execution/get` - Get execution details
- `cronjob/execution/abort` - Abort running execution

**Context Management:**
- `context/reset/session` - Reset session context

**Support Conversations:**
- `conversation/categories` - List conversation categories
- `conversation/show` - Show conversation details

**User/Identity Management:**
- `user/get` - Get user profile
- `user/session/get` - Get session details
- `user/api/token/create` - Create new API token
- `user/api/token/revoke` - Revoke API token
- `user/ssh/key/get` - Get SSH key details
- `user/ssh/key/delete` - Delete SSH key
- `user/ssh/key/import` - Import SSH key from file

## Instructions

1. **Research Phase**: Read tool descriptions from `evals/inventory/tools-current.json` for all domains. Focus on maintenance, cleanup, and advanced management operations.

2. **Write Case Study**: Create `findings/CS-014-infrastructure-maintenance.md` following the template in `quickstart.md`.

3. **Section 1 - Persona**: DevOps engineer performing quarterly infrastructure hygiene on a production SaaS platform. Multiple environments, accumulated technical debt.

4. **Section 2 - Problem**: Describe infrastructure entropy—old backups consuming storage, orphaned database users from departed contractors, unused container registries, stale cronjobs, expired API tokens. Manual cleanup is tedious and risky without proper visibility.

5. **Section 3 - Solution Workflow**:
   - List prerequisites (MCP server connected, admin access, maintenance window scheduled)
   - Write 8-10 steps covering:
     1. Reset session context for clean state
     2. Get user profile and audit active sessions
     3. Audit and rotate API tokens (create new, revoke old)
     4. Audit and clean SSH keys (import new, delete old)
     5. Clean up database users (create service account, delete orphaned users)
     6. Review and clean old backups
     7. Update or delete obsolete cronjobs
     8. Clean up unused container registries and stacks
     9. Remove orphaned SSH/SFTP users
     10. Generate maintenance report via support conversation
   - Each step must list tools used and expected output

6. **Section 4 - Outcomes**: Focus on resource reclamation, security hardening, operational hygiene, cost savings.

7. **Quality Check**: Run through checklist in `quickstart.md` before marking complete.

## Output File

```
kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-014-infrastructure-maintenance.md
```

## Dependencies

None - can be implemented independently.

## Acceptance Criteria

- [ ] Case study follows 4-section streamlined format
- [ ] All 30 primary tools are used in the workflow
- [ ] Persona uses SEG-005 segment ID
- [ ] Problem statement includes business impact (security risk, cost waste)
- [ ] Each workflow step has Tools Used and Expected Output
- [ ] Delete operations shown with verification/confirmation patterns
- [ ] Credential rotation workflow demonstrates security best practices
- [ ] File saved to correct location in findings/

## Coverage Gap Addressed

This WP is the "catch-all" for remaining tool coverage:
- All backup delete operations
- Complete database/mysql/user/* CRUD
- Database Redis inspection tools
- Container registry and stack cleanup
- Complete SSH/SFTP user cleanup
- Complete cronjob management (get, update, delete, execution management)
- Session context reset
- Support conversation inspection
- Complete user identity management (profile, sessions, tokens, SSH keys)

## Implementation Notes

This is a complex case study covering 30 tools. Consider organizing the workflow into logical sections:
1. **Identity Hygiene** (user/*, context/*)
2. **Database Hygiene** (database/mysql/user/*, database/redis/*)
3. **Infrastructure Hygiene** (backup/*, cronjob/*, registry/*, stack/*, ssh/*, sftp/*)
4. **Documentation** (conversation/*)
