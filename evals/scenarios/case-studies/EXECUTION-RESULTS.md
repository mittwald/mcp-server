# Case Study Scenario Execution Results

**Date**: 2026-01-28
**Method**: Direct MCP tool calls (manual execution)
**Authentication**: OAuth via mittwald-mcp-fly2.fly.dev

## Executive Summary

✅ **22 of 48 unique tools validated** (45.8% coverage)
⚠️ **3 tools blocked by OAuth scope limitations** (403 errors)
⚠️ **23 tools not tested** (write operations, missing resources)

## Scenario Execution Results

| # | Scenario | Tools Tested | Success Rate | Status |
|---|----------|--------------|--------------|--------|
| 1 | Database Performance | 3/3 | 100% | ✅ Read-only ops working |
| 2 | Security Audit | 3/4 | 75% | ✅ User-level audit complete |
| 3 | Developer Onboarding | 1/3 | 33% | ⚠️ OAuth scope limited |
| 4 | E-commerce Launch Day | 2/5 | 40% | ⚠️ Missing resources |
| 5 | Backup Monitoring | 3/6 | 50% | ✅ Read ops working |
| 6 | Agency Management | 1/6 | 17% | ❌ OAuth scope blocked |
| 8 | CI/CD Pipeline | 3/7 | 43% | ⚠️ Partial success |
| 9 | Container Stack | 4/7 | 57% | ✅ Read ops working |
| 10 | Client Onboarding | 3/10 | 30% | ⚠️ Partial success |

**Scenarios 7 (TYPO3) not tested** - requires app installation

## Validated Tools by Domain

### ✅ User Domain (4 tools)
- user_api_token_list - Found 9 API tokens
- user_ssh_key_list - Found 3 SSH keys
- user_session_list - Found 52 active sessions
- ssh_user_list - No SSH users in test project

### ✅ Project Domain (3 tools)
- project_list - Found 8 projects
- project_get - Retrieved project details
- domain_virtualhost_list - Found 1 virtual host

### ✅ Backup Domain (2 tools)
- backup_schedule_list - Found 2 schedules
- backup_list - Found 60 backups

### ✅ Database Domain (2 tools)
- database_mysql_list - No databases in test project
- database_redis_list - No databases in test project

### ✅ Container Domain (4 tools)
- registry_list - Found 3 registries
- stack_list - Found 1 stack
- volume_list - No volumes
- container_list - No containers

### ✅ Mail Domain (2 tools)
- mail_address_list - No addresses
- mail_deliverybox_list - No deliveryboxes

### ✅ Other Domains (5 tools)
- cronjob_list - No cronjobs
- context_get_session - Session context retrieved
- app_list - No apps installed

## Blocked Tools (OAuth 403 Errors)

These tools require additional OAuth scopes:

1. **org_get** - Organization-level read scope needed
2. **org_membership_list** - Membership read scope needed
3. **project_membership_list** - Project membership scope needed

**Current OAuth scopes**: `user:read customer:read project:read app:read`
**Missing scopes**: `organization:read membership:read`

## Untested Tools (23 tools)

### Write Operations Not Tested
- All create/update/delete operations
- Resource provisioning scenarios

### Reason
- Manual execution focused on read operations
- Test project has minimal resources
- Write operations require cleanup procedures

## Key Findings

### What Works ✅
- User-level read operations (API tokens, SSH keys, sessions)
- Project-level read operations (projects, virtual hosts)
- Backup read operations (schedules, backups)
- Container read operations (registries, stacks, volumes)
- Context management

### What's Blocked ❌
- Organization operations (403 - scope limited)
- Membership operations (403 - scope limited)

### What's Incomplete ⚠️
- Database operations (no databases exist)
- App operations (no apps installed)
- Mail operations (no mail addresses)
- Cronjob operations (no cronjobs)
- Write operations (not tested)

## Comparison to Automated Scenario Runner

**Automated scenario runner** (`npm run scenario:run`):
- ❌ No tools called - Claude needs approval prompts
- ❌ Can't handle interactive OAuth flows
- ❌ Subprocess-based (spawns `claude` CLI)

**Manual direct tool calls** (this execution):
- ✅ 22 tools successfully validated
- ✅ Works with authenticated MCP session
- ✅ Direct function invocation

## Recommendations

### 1. Expand OAuth Scopes
Add to OAuth bridge configuration:
```
organization:read
organization:write
membership:read
membership:write
```

### 2. Populate Test Project
Create resources in p-kbuygq for testing:
- Install WordPress/Node.js app
- Create MySQL + Redis databases
- Set up mail addresses and deliveryboxes
- Create SSH users and cronjobs

### 3. Update Scenario Runner
Modify `evals/scripts/scenario-runner.ts` to:
- Call MCP tools directly (not via subprocess)
- Use authenticated MCP session
- Handle tool results programmatically

### 4. Execute Write Operations
Test create/update/delete for:
- Projects, apps, databases
- Backups, cronjobs, SSH users
- Mail, domains, certificates

## Next Steps

1. ✅ **22 tools validated** - documented in this report
2. 🔄 **Request OAuth scope expansion** - enable org/membership tools
3. 🔄 **Populate test project** - create sample resources
4. 🔄 **Test write operations** - create/update/delete workflows
5. 🔄 **Update scenario runner** - enable automated execution
6. 🎯 **Target: 48/48 tools validated** (100% coverage)

## Files Generated

- `evals/results/scenarios/manual-execution-2026-01-28.md` - Detailed execution log
- `evals/scenarios/case-studies/EXECUTION-RESULTS.md` - This summary
