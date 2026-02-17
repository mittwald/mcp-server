# Case Study Scenarios - Coverage Summary

Generated: 2026-01-28

## Overview

**10 scenarios created** from case study documentation, covering **48 unique MCP tools** (41.7% of 115 total tools).

## Scenarios by Complexity

### Simple Read-Only (2 scenarios)
- `database-performance` - 3 prompts, 3 tools
- `security-audit-automation` - 4 prompts, 4 tools

### Low-Complexity Provisioning (2 scenarios)
- `developer-onboarding-modified` - 3 prompts, 3 tools
- `ecommerce-launch-day` - 5 prompts, 5 tools

### Medium-Complexity Single-Domain (2 scenarios)
- `automated-backup-monitoring` - 6 prompts, 6 tools
- `agency-multi-project-management` - 6 prompts, 6 tools

### High-Complexity Multi-Resource (3 scenarios)
- `typo3-multisite-deployment` - 5 prompts, 6 tools
- `cicd-pipeline-integration` - 7 prompts, 7 tools
- `container-stack-deployment` - 7 prompts, 7 tools

### Very High Complexity (1 scenario)
- `freelancer-client-onboarding` - 7 prompts, 10 tools

## Tool Coverage by Domain

### Apps (3 tools)
- mittwald_app_copy
- mittwald_app_get
- mittwald_app_list

### Backups (6 tools)
- mittwald_backup_create
- mittwald_backup_get
- mittwald_backup_list
- mittwald_backup_schedule_create
- mittwald_backup_schedule_list
- mittwald_backup_schedule_update

### Certificates (2 tools)
- mittwald_certificate_list
- mittwald_certificate_request

### Containers (7 tools)
- mittwald_container_list
- mittwald_registry_create
- mittwald_registry_list
- mittwald_stack_deploy
- mittwald_stack_list
- mittwald_stack_ps
- mittwald_volume_list

### Context (2 tools)
- mittwald_context_get_session
- mittwald_context_set_session

### Conversations (3 tools)
- mittwald_conversation_create
- mittwald_conversation_list
- mittwald_conversation_reply

### Cronjobs (4 tools)
- mittwald_cronjob_create
- mittwald_cronjob_execute
- mittwald_cronjob_execution_list
- mittwald_cronjob_list

### Databases (4 tools)
- mittwald_database_mysql_create
- mittwald_database_mysql_get
- mittwald_database_mysql_list
- mittwald_database_redis_get

### Domains (3 tools)
- mittwald_domain_dnszone_update
- mittwald_domain_virtualhost_create
- mittwald_domain_virtualhost_list

### Mail (3 tools)
- mittwald_mail_address_create
- mittwald_mail_address_list
- mittwald_mail_deliverybox_create

### Organization (3 tools)
- mittwald_org_get
- mittwald_org_invite
- mittwald_org_membership_list

### Projects (4 tools)
- mittwald_project_create
- mittwald_project_get
- mittwald_project_list
- mittwald_project_membership_list

### Users (4 tools)
- mittwald_ssh_user_create
- mittwald_user_api_token_list
- mittwald_user_session_list
- mittwald_user_ssh_key_list

## Statistics

| Metric | Value |
|--------|-------|
| Total scenarios | 10 |
| Total prompts | 53 |
| Unique tools covered | 48 |
| Total tool references | 57 |
| Tool coverage | 41.7% (48/115) |
| Domains covered | 13/14 |

## Validation Status

All 10 scenarios pass validation:
- ✅ Schema validation (structure, types, patterns)
- ✅ Tool existence (cross-referenced against tool inventory)
- ✅ No missing tools
- ✅ No SFTP tools referenced (all 4 SFTP tools unavailable)

Run validation:
```bash
npm run scenarios:validate-all
```

## Execution Status

**Not yet executed** - Scenarios created but not run against MCP server.

Next steps:
1. Run smoke tests on simple scenarios
2. Execute full suite
3. Generate coverage reports
4. Identify gaps for custom scenario creation

## Known Limitations

See [KNOWN-LIMITATIONS.md](../KNOWN-LIMITATIONS.md) for details.

### SFTP Tools Unavailable
All 4 SFTP tools de-registered from MCP server:
- `mittwald_sftp_user_create`
- `mittwald_sftp_user_update`
- `mittwald_sftp_user_delete`
- `mittwald_sftp_user_list`

**Impact**: Developer Onboarding scenario modified to remove SFTP setup steps.

## Gap Analysis

**67 tools not covered** by case study scenarios (58.3% of total).

These will require custom scenario creation:
- Access/users domain tools
- Database creation/management (PostgreSQL, Redis create)
- Domain ingress/ownership tools
- File system tools
- SSL certificate management
- App installation/upgrade tools
- Project deletion/archival tools

Run gap analysis after scenario execution:
```bash
npm run analysis:gaps
```
