# Baseline Eval Report: Mittwald MCP Tools

**Generated**: 2025-12-19T09:45:04.990Z

## Executive Summary

- **Total Tools**: 115
- **Executed**: 115 (100.0%)
- **Successful**: 54 (47.0%)
- **Failed**: 61

## Coverage by Domain

| Domain | Tools | Executed | Success | Failure | Success Rate | Coverage |
|--------|-------|----------|---------|---------|--------------|----------|
| apps | 8 | 7 | 7 | 0 | 100.0% | 87.5% |
| automation | 9 | 3 | 3 | 0 | 100.0% | 33.3% |
| backups | 8 | 8 | 3 | 5 | 37.5% | 100.0% |
| certificates | 1 | 0 | 0 | 0 | 0.0% | 0.0% |
| containers | 10 | 5 | 5 | 0 | 100.0% | 50.0% |
| context | 3 | 3 | 2 | 1 | 66.7% | 100.0% |
| databases | 14 | 7 | 5 | 2 | 71.4% | 50.0% |
| domains-mail | 20 | 8 | 8 | 0 | 100.0% | 40.0% |
| identity | 12 | 12 | 9 | 3 | 75.0% | 100.0% |
| misc | 5 | 5 | 0 | 5 | 0.0% | 100.0% |
| organization | 7 | 7 | 5 | 2 | 71.4% | 100.0% |
| project-foundation | 12 | 7 | 5 | 2 | 71.4% | 58.3% |
| sftp | 2 | 2 | 1 | 1 | 50.0% | 100.0% |
| ssh | 4 | 4 | 1 | 3 | 25.0% | 100.0% |

## Coverage by Tier

| Tier | Description | Tools | Executed | Success | Failure | Success Rate |
|------|-------------|-------|----------|---------|---------|--------------|
| 0 | No prerequisites | 115 | 78 | 54 | 24 | 69.2% |
| 1 | Organization-level | 0 | 0 | 0 | 0 | 0.0% |
| 2 | Server-level | 0 | 0 | 0 | 0 | 0.0% |
| 3 | Project creation | 0 | 0 | 0 | 0 | 0.0% |
| 4 | Requires project | 0 | 0 | 0 | 0 | 0.0% |

## Problem Patterns

| Problem Type | Count | Affected Tools |
|--------------|-------|----------------|
| dependency_missing | 43 | mcp__mittwald__mittwald_sftp_user_delete, mcp__mittwald__mittwald_ssh_user_create, mcp__mittwald__mittwald_ssh_user_delete... |
| permission_denied | 9 | mcp__mittwald__mittwald_context_set_session, mcp__mittwald__mittwald_database_redis_versions, mcp__mittwald__mittwald_conversation_categories... |
| other | 5 | mcp__mittwald__mittwald_backup_create, mcp__mittwald__mittwald_backup_delete, mcp__mittwald__mittwald_backup_schedule_create... |
| validation_error | 3 | mcp__mittwald__mittwald_user_api_token_create, mcp__mittwald__mittwald_user_ssh_key_create, mcp__mittwald__mittwald_user_ssh_key_import |
| api_error | 1 | mcp__mittwald__mittwald_database_mysql_create |

### Sample Problem Descriptions

**dependency_missing**:
- MCP tools not available in agent tool interface despite MCP server being connected. The mittwald MCP server shows as connected via 'claude mcp list', but no mcp__mittwald__* tools are exposed to the AI agent.
- MCP tools not available in agent tool interface despite MCP server being connected. The mittwald MCP server shows as connected via 'claude mcp list', but no mcp__mittwald__* tools are exposed to the AI agent.
- MCP tools not available in agent tool interface despite MCP server being connected. The mittwald MCP server shows as connected via 'claude mcp list', but no mcp__mittwald__* tools are exposed to the AI agent.

**permission_denied**:
- Access denied to project fd1ef726-14b8-4906-8a45-0756ba993246. API returned 403 error.
- HTTP 403 Forbidden when querying Redis versions.
- Tool disabled in MCP server - conversation endpoints return 403 Forbidden (no OAuth scope support, admin-only)

**other**:
- MCP tools not accessible in current Claude Code execution context. Tools are confirmed to exist in the inventory (evals/inventory/tools-current.json) and MCP server shows as connected, but tools cannot be invoked programmatically in this agent execution environment.
- MCP tools not accessible in current Claude Code execution context. Tools are confirmed to exist in the inventory (evals/inventory/tools-current.json) and MCP server shows as connected, but tools cannot be invoked programmatically in this agent execution environment.
- MCP tools not accessible in current Claude Code execution context. Tools are confirmed to exist in the inventory (evals/inventory/tools-current.json) and MCP server shows as connected, but tools cannot be invoked programmatically in this agent execution environment.

**validation_error**:
- HTTP 400 Bad Request. The 'expires' parameter format '30d' was rejected by API. May need ISO date format instead.
- Tool requires publicKey parameter. Library version imports existing keys rather than generating new ones.
- File path error: ~/ not properly expanded. Requires absolute path to SSH public key file.

**api_error**:
- HTTP 500 Internal Server Error when creating MySQL database. API endpoint failure.


## Tools Without Assessment

37 tools have not been evaluated yet:

**app/** (1):
- `app/upgrade`

**certificate/** (1):
- `certificate/request`

**cronjob/** (6):
- `cronjob/create`
- `cronjob/delete`
- `cronjob/execute`
- `cronjob/execution/abort`
- `cronjob/execution/get`
- `cronjob/update`

**database/** (7):
- `database/mysql/delete`
- `database/mysql/get`
- `database/mysql/user/create`
- `database/mysql/user/delete`
- `database/mysql/user/get`
- `database/mysql/user/list`
- `database/mysql/user/update`

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

**project/** (5):
- `project/create`
- `project/delete`
- `project/invite/get`
- `project/membership/get`
- `project/ssh`

**registry/** (3):
- `registry/create`
- `registry/delete`
- `registry/update`

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