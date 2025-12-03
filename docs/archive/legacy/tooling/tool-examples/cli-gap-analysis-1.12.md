# mw CLI Gap Analysis: 1.11.2 → 1.12.0

**Date**: 2025-11-26
**Purpose**: Identify MCP tool enhancement opportunities from CLI updates
**Status**: Complete
**Analyst**: Claude (automated analysis)

## Executive Summary

The upgrade from mw CLI 1.11.2 to 1.12.0 introduces **4 new features** with potential MCP tool impact:

1. **Custom App Installation Paths** - High value enhancement for app installation tools
2. **Container Resource Limits** - High value enhancement for container management
3. **App Backend Access** - Low value (interactive, not suitable for MCP)
4. **Port Mapping Enhancement** - Internal improvement, no MCP changes needed

**Recommendation**: 2 items for implementation in next sprint, 1 deferred, 3 skipped.

---

## CLI Version Comparison

### v1.12.0 Changes (Released: November 3, 2024)

| Change Type | Description |
|-------------|-------------|
| **New Feature** | Custom app installation paths via `--path` flag |
| **New Feature** | Container resource limits (CPU/memory) via `container run` |
| **New Feature** | App backend access via `app open --backend` |
| **Improvement** | Port mapping single integer input support |

### v1.11.2 Changes (Released: September 29, 2024)

| Change Type | Description |
|-------------|-------------|
| **Bug Fix** | React renderer exit handling |
| **Bug Fix** | API retry logic for 412 responses |
| **Bug Fix** | Docker Compose env_file array handling |
| **Dependencies** | Multiple package updates |

### No Intermediate Versions

Confirmed: No releases between v1.11.2 and v1.12.0 (1.11.3, 1.11.4, etc. do not exist).

---

## Current MCP Tool Coverage

### Summary Statistics

| Category | Tool Count | Key Tools |
|----------|------------|-----------|
| Apps | 28 | app_list, app_create_*, app_install_* |
| Database | 26 | database_mysql_*, database_redis_* |
| Project | 15 | project_list, project_get, project_create |
| User/Auth | 17 | login_status, user_api_token_* |
| Container | 9 | container_list, container_run, container_update |
| Infrastructure | 10 | server_*, ssh_user_*, sftp_user_* |
| Domain | 11 | domain_*, virtualhost_* |
| Mail | 10 | mail_address_*, mail_deliverybox_* |
| Backup | 9 | backup_*, backup_schedule_* |
| Cronjob | 10 | cronjob_*, cronjob_execution_* |
| Other | 28 | stack_*, volume_*, registry_*, conversation_* |
| **Total** | **173** | |

---

## MCP Tool Impact Matrix

| CLI Feature | Affected MCP Tool(s) | Current State | Enhancement | Category |
|-------------|---------------------|---------------|-------------|----------|
| Custom app paths | `mittwald_app_install_*` (8 tools) | No `--path` parameter | Add `installation_path` argument | **IMPLEMENT** |
| Container resource limits | `mittwald_container_run` | No resource constraints | Add `cpu_limit`, `memory_limit` arguments | **IMPLEMENT** |
| App backend access | `mittwald_app_open` | Opens frontend URL | Add `--backend` flag | **DEFER** |
| Port mapping enhancement | `mittwald_database_mysql_port_forward` | Already functional | Internal CLI improvement | SKIP |
| LLM-friendly output | All 173 tools | Already benefit | Passive improvement | SKIP |
| API retry logic | All 173 tools | Already benefit | Passive improvement | SKIP |

---

## Detailed Analysis

### Feature: Custom App Installation Paths

- **CLI Command**: `mw app install <app> --path /custom/path`
- **Current MCP Coverage**: Partial - app installation tools exist but don't expose path flag
- **Enhancement Opportunity**: Add `installation_path` optional argument to:
  - `mittwald_app_install_wordpress`
  - `mittwald_app_install_contao`
  - `mittwald_app_install_joomla`
  - `mittwald_app_install_shopware5`
  - `mittwald_app_install_shopware6`
  - `mittwald_app_install_nextcloud`
  - `mittwald_app_install_typo3`
  - `mittwald_app_install_matomo`
- **Recommendation**: **IMPLEMENT**
- **Rationale**: High operational value - allows placing apps in specific directories, useful for complex hosting setups and migrations

### Feature: Container Resource Limits

- **CLI Command**: `mw container run --cpu-limit 2 --memory-limit 512Mi`
- **Current MCP Coverage**: Partial - `container_run` exists but lacks resource constraint arguments
- **Enhancement Opportunity**: Add resource limit arguments:
  - `cpu_limit` (string, e.g., "2", "500m")
  - `memory_limit` (string, e.g., "512Mi", "1Gi")
- **Recommendation**: **IMPLEMENT**
- **Rationale**: Critical for production workloads - prevents runaway containers from consuming excessive resources

### Feature: App Backend Access

- **CLI Command**: `mw app open --backend`
- **Current MCP Coverage**: `mittwald_app_open` exists
- **Enhancement Opportunity**: Add `--backend` flag to open backend URL instead of frontend
- **Recommendation**: **DEFER**
- **Rationale**:
  - `app open` launches a browser (interactive)
  - MCP tools should be non-interactive
  - Better suited for CLI-only usage
  - Could implement if backend URL retrieval (not opening) is valuable

### Feature: Port Mapping Enhancement

- **CLI Command**: Internal port mapping parsing improvement
- **Current MCP Coverage**: `mittwald_database_mysql_port_forward` and similar tools
- **Enhancement Opportunity**: None - internal CLI parsing improvement
- **Recommendation**: **SKIP**
- **Rationale**: Passive benefit - simplifies CLI usage but doesn't require MCP changes

### Improvement: LLM-Friendly Output (v1.11.x)

- **CLI Enhancement**: Better JSON output formatting for LLM consumption
- **Current MCP Coverage**: All tools benefit automatically
- **Recommendation**: **SKIP**
- **Rationale**: Already automatically applied via CLI - no MCP changes needed

### Bug Fix: API Retry Logic (v1.11.x)

- **CLI Enhancement**: Conditional retry for 412 responses
- **Current MCP Coverage**: All tools benefit automatically
- **Recommendation**: **SKIP**
- **Rationale**: Passive reliability improvement - no MCP changes needed

---

## Recommended Actions

### Priority 1: Implement Next Sprint

#### 1. Add Custom Installation Path to App Install Tools

**Scope**: Medium (8 tools, similar pattern)
**Files to Modify**:
- `src/handlers/tools/mittwald-cli/app/install-*.ts` (8 files)

**Implementation**:
```typescript
// Add to argument schema for each app install handler
installation_path: {
  type: 'string',
  description: 'Custom installation directory path (optional)',
  required: false
}

// Add to CLI invocation
if (args.installation_path) {
  cliArgs.push('--path', args.installation_path);
}
```

**Testing**: Unit tests for each tool + integration test with real project

---

#### 2. Add Resource Limits to Container Run

**Scope**: Small (1 tool)
**Files to Modify**:
- `src/handlers/tools/mittwald-cli/container/run-cli.ts`

**Implementation**:
```typescript
// Add to argument schema
cpu_limit: {
  type: 'string',
  description: 'CPU limit (e.g., "2" for 2 cores, "500m" for 0.5 cores)',
  required: false
}
memory_limit: {
  type: 'string',
  description: 'Memory limit (e.g., "512Mi", "1Gi")',
  required: false
}

// Add to CLI invocation
if (args.cpu_limit) {
  cliArgs.push('--cpu-limit', args.cpu_limit);
}
if (args.memory_limit) {
  cliArgs.push('--memory-limit', args.memory_limit);
}
```

**Testing**: Unit test + integration test with actual container

---

### Priority 2: Defer

#### 3. App Backend Access

**Reason for Deferral**:
- Requires evaluation of whether URL retrieval (vs. browser opening) is valuable
- Low operational priority compared to resource management features
- May require additional CLI capabilities not yet available

**Recommended Re-evaluation**: Q2 2025 or when backend URL retrieval use case arises

---

### Not Recommended: Skip

| Item | Reason |
|------|--------|
| Port mapping enhancement | Internal CLI improvement, no MCP surface change |
| LLM-friendly output | Automatically inherited from CLI |
| API retry logic | Automatically inherited from CLI |

---

## Implementation Effort Estimates

| Task | Effort | Files | Testing |
|------|--------|-------|---------|
| Custom app installation paths | 4-6 hours | 8 handlers | 8 unit tests |
| Container resource limits | 1-2 hours | 1 handler | 1 unit test |
| **Total** | **5-8 hours** | **9 files** | **9 tests** |

---

## Appendix: Full MCP Tool Inventory by Category

<details>
<summary>Click to expand full tool list (173 tools)</summary>

### Apps (28 tools)
- mittwald_app_list, mittwald_app_get, mittwald_app_create_php, mittwald_app_create_node
- mittwald_app_create_python, mittwald_app_create_php_worker, mittwald_app_create_static
- mittwald_app_copy, mittwald_app_download, mittwald_app_upload, mittwald_app_update
- mittwald_app_upgrade, mittwald_app_uninstall, mittwald_app_open, mittwald_app_ssh
- mittwald_app_versions, mittwald_app_dependency_list, mittwald_app_dependency_update
- mittwald_app_dependency_versions, mittwald_app_list_upgrade_candidates
- mittwald_app_install_wordpress, mittwald_app_install_contao, mittwald_app_install_joomla
- mittwald_app_install_shopware5, mittwald_app_install_shopware6, mittwald_app_install_nextcloud
- mittwald_app_install_typo3, mittwald_app_install_matomo

### Container (9 tools)
- mittwald_container_list, mittwald_container_start, mittwald_container_stop
- mittwald_container_restart, mittwald_container_recreate, mittwald_container_delete
- mittwald_container_logs, mittwald_container_run, mittwald_container_update

### Database (26 tools)
- mittwald_database_list, mittwald_database_mysql_list, mittwald_database_mysql_get
- mittwald_database_mysql_create, mittwald_database_mysql_delete, mittwald_database_mysql_dump
- mittwald_database_mysql_import, mittwald_database_mysql_shell, mittwald_database_mysql_port_forward
- mittwald_database_mysql_phpmyadmin, mittwald_database_mysql_charsets, mittwald_database_mysql_versions
- mittwald_database_mysql_user_list, mittwald_database_mysql_user_get, mittwald_database_mysql_user_create
- mittwald_database_mysql_user_update, mittwald_database_mysql_user_delete
- mittwald_database_redis_list, mittwald_database_redis_get, mittwald_database_redis_create
- mittwald_database_redis_versions

### Project (15 tools)
- mittwald_project_list, mittwald_project_get, mittwald_project_create, mittwald_project_update
- mittwald_project_delete, mittwald_project_ssh, mittwald_project_filesystem_usage
- mittwald_project_membership_list, mittwald_project_membership_get
- mittwald_project_membership_list_own, mittwald_project_membership_get_own
- mittwald_project_invite_list, mittwald_project_invite_get, mittwald_project_invite_list_own

### And 95 more tools across: Backup, Cronjob, Domain, Mail, Organization, User/Auth, Infrastructure, Stack, Registry, Volume, Conversation, DDEV, Extension

</details>

---

## Document History

| Date | Author | Change |
|------|--------|--------|
| 2025-11-26 | Claude | Initial analysis for mw CLI 1.11.2 → 1.12.0 upgrade |
