# Baseline Eval Report: Mittwald MCP Tools

**Generated**: 2025-12-19T07:21:19.050Z

## Executive Summary

- **Total Tools**: 115
- **Executed**: 105 (91.3%)
- **Successful**: 53 (50.5%)
- **Failed**: 52

## Coverage by Domain

| Domain | Tools | Executed | Success | Failure | Success Rate | Coverage |
|--------|-------|----------|---------|---------|--------------|----------|
| apps | 8 | 8 | 7 | 1 | 87.5% | 100.0% |
| automation | 9 | 4 | 3 | 1 | 75.0% | 44.4% |
| backups | 8 | 3 | 3 | 0 | 100.0% | 37.5% |
| certificates | 1 | 0 | 0 | 0 | 0.0% | 0.0% |
| containers | 10 | 5 | 5 | 0 | 100.0% | 50.0% |
| context | 3 | 3 | 3 | 0 | 100.0% | 100.0% |
| databases | 14 | 14 | 5 | 9 | 35.7% | 100.0% |
| domains-mail | 20 | 8 | 8 | 0 | 100.0% | 40.0% |
| identity | 12 | 12 | 7 | 5 | 58.3% | 100.0% |
| misc | 5 | 0 | 0 | 0 | 0.0% | 0.0% |
| organization | 7 | 7 | 5 | 2 | 71.4% | 100.0% |
| project-foundation | 12 | 12 | 7 | 5 | 58.3% | 100.0% |
| sftp | 2 | 0 | 0 | 0 | 0.0% | 0.0% |
| ssh | 4 | 0 | 0 | 0 | 0.0% | 0.0% |

## Coverage by Tier

| Tier | Description | Tools | Executed | Success | Failure | Success Rate |
|------|-------------|-------|----------|---------|---------|--------------|
| 0 | No prerequisites | 115 | 76 | 53 | 23 | 69.7% |
| 1 | Organization-level | 0 | 0 | 0 | 0 | 0.0% |
| 2 | Server-level | 0 | 0 | 0 | 0 | 0.0% |
| 3 | Project creation | 0 | 0 | 0 | 0 | 0.0% |
| 4 | Requires project | 0 | 0 | 0 | 0 | 0.0% |

## Problem Patterns

| Problem Type | Count | Affected Tools |
|--------------|-------|----------------|
| other | 26 | mcp__mittwald__mittwald_TOOL, mcp__mittwald__mittwald_app_upgrade, mcp__mittwald__mittwald_cronjob-create... |
| dependency_missing | 20 | mcp__mittwald__mittwald_cronjob_execution_get, mcp__mittwald__mittwald_database_mysql_delete, mcp__mittwald__mittwald_database_mysql_get... |
| permission_denied | 6 | mcp__mittwald__mittwald_context_set_session, mcp__mittwald__mittwald_database_redis_versions, mcp__mittwald__mittwald_org_invite_revoke... |
| api_error | 2 | mcp__mittwald__mittwald_database_mysql_create, mcp__mittwald__mittwald_user_ssh_key_list |
| validation_error | 1 | mcp__mittwald__mittwald_org_invite |

### Sample Problem Descriptions

**other**:
- Tool would create/modify support conversations. Skipped to avoid impacting support system.
- Tool would upgrade production app version. Upgrading the existing PHP app could potentially cause compatibility issues or breaking changes. Skipped to avoid impacting production application.
- Tool would create/modify/delete/execute production cronjobs. Skipped to avoid impacting live automation.

**dependency_missing**:
- Cannot test execution get - no executions exist for the cronjob.
- Cannot delete MySQL database because none exist. MySQL create operation failed with HTTP 500 error.
- Cannot test MySQL get operation because no MySQL databases exist. MySQL create operation failed with HTTP 500 error.

**permission_denied**:
- Initial attempt to set projectId context failed with access denied error. Required context reset first before setting new context parameters.
- HTTP 403 error when attempting to list Redis versions. API endpoint /v2/redis-versions returned 403 Forbidden.
- 403 Forbidden error when attempting to revoke invite. User has Member role on organization but may require Owner role to revoke invitations.

**api_error**:
- HTTP 500 Internal Server Error when attempting to create MySQL database. API endpoint /v2/projects/{projectId}/mysql-databases returned 500.
- Tool failed with error: 'keys.map is not a function'. This indicates a data structure mismatch between the API response and the tool's expectation. The tool expects an array but received a different data type.

**validation_error**:
- First attempt with example.com email failed with 400 error. Successful with mailinator.com email.


## Tools Without Assessment

39 tools have not been evaluated yet:

**backup/** (5):
- `backup/create`
- `backup/delete`
- `backup/schedule/create`
- `backup/schedule/delete`
- `backup/schedule/update`

**certificate/** (1):
- `certificate/request`

**conversation/** (5):
- `conversation/categories`
- `conversation/create`
- `conversation/list`
- `conversation/reply`
- `conversation/show`

**cronjob/** (5):
- `cronjob/create`
- `cronjob/delete`
- `cronjob/execute`
- `cronjob/execution/abort`
- `cronjob/update`

**domain/** (5):
- `domain/dnszone/get`
- `domain/dnszone/update`
- `domain/get`
- `domain/virtualhost/create`
- `domain/virtualhost/delete`

**mail/** (7):
- `mail/address/create`
- `mail/address/delete`
- `mail/address/update`
- `mail/deliverybox/create`
- `mail/deliverybox/delete`
- `mail/deliverybox/get`
- `mail/deliverybox/update`

**registry/** (3):
- `registry/create`
- `registry/delete`
- `registry/update`

**sftp/** (2):
- `sftp/user/delete`
- `sftp/user/list`

**ssh/** (4):
- `ssh/user/create`
- `ssh/user/delete`
- `ssh/user/list`
- `ssh/user/update`

**stack/** (2):
- `stack/delete`
- `stack/deploy`


## Recommendations

1. Investigate tools with `auth_error` problems - may need scope configuration
2. Review `resource_not_found` errors - may indicate dependency issues
3. Consider retry strategy for `timeout` errors
4. Tools with `permission_denied` may need role elevation

---

*This baseline report was generated by the Langfuse MCP Eval Suite.*