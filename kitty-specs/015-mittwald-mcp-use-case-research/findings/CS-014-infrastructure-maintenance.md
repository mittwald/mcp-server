# CS-014: Infrastructure Maintenance & Cleanup

## Persona

**Segment**: SEG-005 Modern Stack Developer
**Role**: DevOps engineer at a SaaS startup performing quarterly infrastructure hygiene
**Context**: It's maintenance weekend. The production SaaS platform has accumulated 6 months of technical debt: old backups consuming storage, database users from contractors who left, API tokens that should have been rotated, cronjobs that haven't run successfully in months, and container registries with orphaned images. The CTO wants a complete infrastructure audit and cleanup before the next funding round due diligence.

## Problem

Production infrastructure accumulates entropy: backups pile up beyond retention policies, database users proliferate as contractors come and go, API tokens get created for "temporary" integrations and never revoked, cronjobs fail silently, and container registries fill with abandoned images. Nobody knows the true state of the system. Manual cleanup is terrifying—one wrong deletion could take down production. The DevOps engineer spends a full day each quarter just trying to understand what exists before making any changes. Security auditors ask about credential rotation and get spreadsheets that are 3 months out of date. Meanwhile, storage costs climb and security posture degrades.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- Admin access to production and staging environments
- Maintenance window scheduled (low-traffic period)
- Backup of current state confirmed

---

## Part 1: Identity Hygiene

### Step 1: Reset Session Context

```
Reset my current session context. I want to start the maintenance
workflow with a clean slate and explicitly set my environment.
```

**Tools Used**: `context/reset/session`
**Expected Output**: Session context reset:
- Previous context: Cleared
- Session ID: New session created
- Default project: None (must be explicitly set)
- Status: Clean slate for maintenance workflow

### Step 2: Get User Profile

```
Show me my current user profile. I need to verify I'm using
the correct administrative account for this maintenance.
```

**Tools Used**: `user/get`
**Expected Output**: User profile:
- **User ID**: u-devops-admin
- **Email**: devops@saascompany.io
- **Name**: Alex Chen
- **Role**: Organization Admin
- **MFA**: Enabled ✅
- **Created**: 2023-06-15
- **Last login**: 2025-01-19 08:00:00

### Step 3: Audit Active Sessions

```
Get details for my current session. I want to verify this is
the only active maintenance session.
```

**Tools Used**: `user/session/get`
**Expected Output**: Current session details:
- **Session ID**: sess-maint-2025q1
- **Started**: 2025-01-19 09:00:00
- **Device**: Claude Code / macOS
- **IP**: 203.0.113.50 (Office network) ✅
- **Location**: Berlin, DE
- **Expiry**: 2025-01-19 17:00:00
- **Permissions**: Full admin access

### Step 4: Audit and Rotate API Tokens

```
List all my API tokens. I need to identify tokens that should
be rotated or revoked as part of credential hygiene.
```

**Tools Used**: `user/api/token/list`
**Expected Output**: API token inventory:
| Token ID | Name | Created | Last Used | Scopes |
|----------|------|---------|-----------|--------|
| tok-ci-001 | GitLab CI | 2024-03-15 | 2025-01-19 | app:deploy |
| tok-monitor | Monitoring | 2024-06-20 | 2025-01-18 | project:read |
| tok-old-contractor | Contractor API | 2024-01-10 | 2024-04-15 ⚠️ | ALL |
| tok-test | Testing | 2024-09-01 | 2024-09-05 ⚠️ | ALL |

⚠️ Alert: 2 tokens haven't been used in 6+ months and have excessive permissions.

### Step 5: Create New API Token and Revoke Old

```
Create a new API token for CI/CD with minimal required scopes,
then revoke the old contractor token that has ALL permissions.
```

**Tools Used**: `user/api/token/create`, `user/api/token/revoke`
**Expected Output**:
New token created:
- **Token ID**: tok-ci-002
- **Name**: GitLab CI (Rotated 2025-01)
- **Scopes**: app:read, app:deploy, project:read
- **Expiry**: 2026-01-19 (1 year)
- **Value**: mtk_xxxxxxxxxxxxxxxx (shown once)

Token revoked:
- **Token ID**: tok-old-contractor
- **Status**: Revoked
- **Reason**: Unused 9 months, excessive permissions
- **Impact**: Any integrations using this token will fail

### Step 6: Audit SSH Keys

```
Get details for my SSH keys. I need to identify old keys
that should be rotated.
```

**Tools Used**: `user/ssh/key/list`, `user/ssh/key/get`
**Expected Output**:
SSH key inventory:
| Key ID | Name | Type | Added | Fingerprint |
|--------|------|------|-------|-------------|
| key-001 | MacBook Pro M3 | ED25519 | 2024-08-15 | SHA256:abc... |
| key-002 | CI Runner | RSA-4096 | 2024-03-20 | SHA256:def... |
| key-003 | Old Laptop | RSA-2048 | 2022-06-10 ⚠️ | SHA256:ghi... |

Key details for `key-003`:
- **Type**: RSA-2048 (deprecated standard)
- **Added**: 2022-06-10 (2.5 years ago)
- **Last used**: 2024-02-15 (11 months ago)
- **Comment**: alex@old-thinkpad
- **Recommendation**: Replace with ED25519

### Step 7: Import New SSH Key and Delete Old

```
Import my new SSH key from the current workstation, then delete
the old RSA-2048 key that's on a laptop I no longer use.
```

**Tools Used**: `user/ssh/key/import`, `user/ssh/key/delete`
**Expected Output**:
SSH key imported:
- **Key ID**: key-004
- **Name**: MacBook Pro M3 (New)
- **Type**: ED25519
- **Fingerprint**: SHA256:xyz...
- **Comment**: alex@macbook-2025
- **Status**: Active

SSH key deleted:
- **Key ID**: key-003
- **Name**: Old Laptop
- **Status**: Deleted
- **Security**: Access via old key no longer possible

---

## Part 2: Database Hygiene

### Step 8: Audit Database Users

```
List all MySQL database users for the production database.
I need to identify orphaned accounts from former contractors.
```

**Tools Used**: `database/mysql/user/list`
**Expected Output**: Database users for `saas_production`:
| Username | Host | Privileges | Created |
|----------|------|------------|---------|
| app_user | localhost | SELECT, INSERT, UPDATE | 2023-06-15 |
| backup_user | localhost | SELECT, LOCK | 2023-07-01 |
| contractor_bob | % | ALL ⚠️ | 2024-02-15 |
| analytics_ro | % | SELECT | 2024-05-10 |
| test_user | % | ALL ⚠️ | 2024-08-01 |

⚠️ Alert: 2 users have ALL privileges with wide host access.

### Step 9: Get Database User Details

```
Get details for the contractor_bob database user.
I need to verify this account should be removed.
```

**Tools Used**: `database/mysql/user/get`
**Expected Output**: Database user details for `contractor_bob`:
- **Username**: contractor_bob
- **Host**: % (any IP)
- **Privileges**: ALL PRIVILEGES on saas_production.*
- **Created**: 2024-02-15
- **Created by**: admin@saascompany.io
- **Password last changed**: 2024-02-15 (11 months ago)
- **Note**: No activity since 2024-04-30

Contractor Bob's engagement ended April 2024. Account should be removed.

### Step 10: Create Service Account and Delete Orphaned Users

```
Create a new database user for the analytics service with read-only access,
then delete the orphaned contractor_bob and test_user accounts.
```

**Tools Used**: `database/mysql/user/create`, `database/mysql/user/delete`
**Expected Output**:
Database user created:
- **Username**: analytics_service
- **Host**: 10.0.0.% (internal network only)
- **Privileges**: SELECT on saas_production.analytics_*
- **Password**: Auto-generated (stored in secrets manager)
- **Status**: Active

Database users deleted:
- contractor_bob: Deleted ✅
- test_user: Deleted ✅
- Connections terminated: 0 (neither was connected)

### Step 11: Update Database User Permissions

```
Update the app_user permissions to include DELETE for the new
cleanup functionality we're deploying.
```

**Tools Used**: `database/mysql/user/update`
**Expected Output**: Database user updated:
- **Username**: app_user
- **Previous privileges**: SELECT, INSERT, UPDATE
- **New privileges**: SELECT, INSERT, UPDATE, DELETE
- **Scope**: saas_production.* (unchanged)
- **Status**: Updated

### Step 12: Inspect Redis Configuration

```
Get details for the production Redis instance.
I need to verify version and configuration for the maintenance report.
```

**Tools Used**: `database/redis/get`
**Expected Output**: Redis instance details:
- **Instance ID**: redis-prod-001
- **Version**: Redis 7.0.12
- **Memory**: 2GB allocated, 1.4GB used (70%)
- **Max connections**: 1000 (current: 145)
- **Persistence**: AOF enabled
- **Eviction policy**: allkeys-lru
- **Uptime**: 45 days

### Step 13: Check Redis Version Options

```
What Redis versions are available for upgrade?
I want to see if we should upgrade during this maintenance window.
```

**Tools Used**: `database/redis/versions`
**Expected Output**: Available Redis versions:
| Version | Status | Notes |
|---------|--------|-------|
| 7.0.12 | Current | Installed on redis-prod-001 |
| 7.2.3 | Available | Performance improvements, bug fixes |
| 7.2.4 | Latest | Security patches (recommended) |

Recommendation: Schedule upgrade to 7.2.4 in next maintenance window.

---

## Part 3: Infrastructure Hygiene

### Step 14: Clean Old Backups

```
List all backups older than 30 days for the production project.
I need to clean up old backups to free storage.
```

**Tools Used**: `backup/list`
**Expected Output**: Old backups (>30 days):
| Backup ID | Created | Size | Type |
|-----------|---------|------|------|
| bak-2024-11-15 | 2024-11-15 | 45GB | Full |
| bak-2024-11-01 | 2024-11-01 | 42GB | Full |
| bak-2024-10-15 | 2024-10-15 | 40GB | Full |
| bak-2024-10-01 | 2024-10-01 | 38GB | Full |

Total: 4 backups consuming 165GB beyond retention policy.

### Step 15: Delete Old Backups

```
Delete the two oldest backups (October 2024) to reclaim storage.
Keep November backups for extended retention.
```

**Tools Used**: `backup/delete`
**Expected Output**: Backups deleted:
- bak-2024-10-15: Deleted (40GB freed)
- bak-2024-10-01: Deleted (38GB freed)
- **Total freed**: 78GB
- **Remaining backups**: 15 (within retention policy)

### Step 16: Remove Obsolete Backup Schedule

```
Delete the backup schedule for the old staging project that was
decommissioned last month.
```

**Tools Used**: `backup/schedule/delete`
**Expected Output**: Backup schedule deleted:
- **Schedule ID**: sched-old-staging
- **Project**: p-staging-old (decommissioned)
- **Status**: Deleted
- **Scheduled backups cancelled**: 4 pending
- **Storage saved**: ~20GB/month

### Step 17: Audit and Update Cronjobs

```
Get details for the report-generator cronjob.
It's been failing and I need to understand why.
```

**Tools Used**: `cronjob/get`
**Expected Output**: Cronjob details:
- **Cron ID**: cron-report-gen
- **Name**: Daily Report Generator
- **Schedule**: 0 6 * * * (daily at 6 AM)
- **Command**: /scripts/generate-report.sh
- **Status**: Active but failing
- **Last success**: 2024-12-01 (49 days ago)
- **Last failure**: 2025-01-19 (today)
- **Error**: "FileNotFoundError: /data/reports/"

### Step 18: Update Failing Cronjob

```
Update the report-generator cronjob to use the new reports
directory path that was changed in the December deployment.
```

**Tools Used**: `cronjob/update`
**Expected Output**: Cronjob updated:
- **Cron ID**: cron-report-gen
- **Previous command**: /scripts/generate-report.sh
- **New command**: /scripts/generate-report.sh --output /var/reports/
- **Schedule**: Unchanged (daily 6 AM)
- **Status**: Active

### Step 19: Delete Obsolete Cronjob

```
Delete the old-metrics-collector cronjob.
We migrated to a new monitoring system 3 months ago.
```

**Tools Used**: `cronjob/delete`
**Expected Output**: Cronjob deleted:
- **Cron ID**: cron-old-metrics
- **Name**: Legacy Metrics Collector
- **Status**: Deleted
- **Note**: Prometheus took over this functionality

### Step 20: Check Running Cronjob Execution

```
Get details for the currently running backup execution.
I want to verify it's progressing normally.
```

**Tools Used**: `cronjob/execution/get`
**Expected Output**: Cronjob execution details:
- **Execution ID**: exec-backup-2025-01-19
- **Cron ID**: cron-daily-backup
- **Started**: 2025-01-19 03:00:00
- **Duration**: 45 minutes (ongoing)
- **Progress**: 65% complete
- **Current file**: /data/uploads/2024/
- **Status**: Running

### Step 21: Abort Stuck Execution

```
Abort the stuck analytics-export execution that's been running
for 6 hours (normally takes 30 minutes).
```

**Tools Used**: `cronjob/execution/abort`
**Expected Output**: Execution aborted:
- **Execution ID**: exec-analytics-stuck
- **Cron ID**: cron-analytics-export
- **Running time**: 6h 15m (abnormal)
- **Status**: Aborted
- **Reason**: Manual abort during maintenance
- **Note**: Investigate memory leak in export script

### Step 22: Clean Container Registry

```
Update the container registry to reduce image retention,
then delete the old unused registry.
```

**Tools Used**: `registry/update`, `registry/delete`
**Expected Output**:
Registry updated:
- **Registry ID**: reg-prod-001
- **Previous retention**: 50 images per tag
- **New retention**: 10 images per tag
- **Auto-cleanup**: Enabled
- **Space to be freed**: ~15GB

Registry deleted:
- **Registry ID**: reg-old-staging
- **Images removed**: 234
- **Space freed**: 28GB
- **Status**: Deleted

### Step 23: Delete Unused Container Stack

```
Delete the old-api-stack that was replaced by the new microservices
architecture 2 months ago.
```

**Tools Used**: `stack/delete`
**Expected Output**: Stack deleted:
- **Stack name**: old-api-stack
- **Containers removed**: 3 (api, worker, redis)
- **Networks removed**: 1 (old-api-network)
- **Volumes**: Preserved (manual cleanup needed)
- **Status**: Deleted

### Step 24: Clean SSH/SFTP Users

```
Delete the SSH user for the departed contractor, and update
the deployment user's shell access.
```

**Tools Used**: `ssh/user/delete`, `ssh/user/update`, `sftp/user/delete`
**Expected Output**:
SSH user deleted:
- **Username**: contractor-bob
- **Project**: p-production
- **Home directory**: Preserved for audit
- **Status**: Deleted

SSH user updated:
- **Username**: deploy-user
- **Shell**: /bin/bash → /bin/rbash (restricted)
- **Note**: Limited to deployment commands only

SFTP user deleted:
- **Username**: old-transfer-user
- **Project**: p-production
- **Status**: Deleted

---

## Part 4: Documentation

### Step 25: List Support Conversation Categories

```
List available support conversation categories.
I want to create a maintenance report ticket.
```

**Tools Used**: `conversation/categories`
**Expected Output**: Conversation categories:
| Category | Description |
|----------|-------------|
| Technical | Server, database, application issues |
| Billing | Invoices, payments, plan changes |
| Security | Access, certificates, vulnerabilities |
| Feature | Feature requests, feedback |
| Maintenance | Scheduled maintenance, reports |

### Step 26: Show Previous Maintenance Conversation

```
Show the details of our previous quarterly maintenance conversation
for reference.
```

**Tools Used**: `conversation/show`
**Expected Output**: Conversation details:
- **ID**: conv-maint-2024q4
- **Subject**: Q4 2024 Infrastructure Maintenance Report
- **Category**: Maintenance
- **Created**: 2024-10-15
- **Status**: Resolved
- **Messages**: 5
- **Attachments**: 1 (maintenance-report-q4.pdf)

Last message: "Maintenance completed successfully. 45GB storage reclaimed."

### Step 27: Delete MySQL Database (Cleanup)

```
Delete the old test database that's no longer needed.
```

**Tools Used**: `database/mysql/delete`
**Expected Output**: Database deleted:
- **Database**: saas_test_old
- **Size**: 2.4GB
- **Tables**: 47
- **Status**: Deleted
- **Note**: Data is not recoverable

⚠️ Confirmed: This was a test database with no production data.

### Step 28: Generate Maintenance Summary

```
Give me a complete maintenance summary:
- Credentials rotated/revoked
- Users cleaned up
- Storage reclaimed
- Cronjobs fixed
- Security improvements
```

**Tools Used**: `user/api/token/list`, `database/mysql/user/list`, `backup/list`, `cronjob/list`
**Expected Output**:

## Q1 2025 Infrastructure Maintenance Report
**Platform**: SaaS Production | **Date**: 2025-01-19 | **Engineer**: Alex Chen

### Identity & Credentials
| Action | Item | Status |
|--------|------|--------|
| API Token rotated | tok-ci-002 | ✅ New token with minimal scopes |
| API Token revoked | tok-old-contractor | ✅ Unused 9 months |
| API Token revoked | tok-test | ✅ Test token removed |
| SSH Key imported | key-004 | ✅ ED25519 standard |
| SSH Key deleted | key-003 | ✅ Old RSA-2048 removed |

### Database Hygiene
| Action | Item | Status |
|--------|------|--------|
| User created | analytics_service | ✅ Read-only, internal network |
| User deleted | contractor_bob | ✅ Orphaned account |
| User deleted | test_user | ✅ Test account |
| User updated | app_user | ✅ Added DELETE permission |
| Database deleted | saas_test_old | ✅ 2.4GB freed |

### Backup Cleanup
| Action | Storage Freed |
|--------|---------------|
| 2 old backups deleted | 78GB |
| Old backup schedule removed | ~20GB/month saved |

### Cronjob Maintenance
| Action | Item | Status |
|--------|------|--------|
| Updated | cron-report-gen | ✅ Fixed path issue |
| Deleted | cron-old-metrics | ✅ Legacy system |
| Aborted | exec-analytics-stuck | ✅ 6h stuck execution |

### Container Infrastructure
| Action | Storage Freed |
|--------|---------------|
| Registry retention reduced | 15GB |
| Old registry deleted | 28GB |
| Old stack deleted | 3 containers removed |

### Access Cleanup
| Action | Item | Status |
|--------|------|--------|
| SSH user deleted | contractor-bob | ✅ |
| SSH user restricted | deploy-user | ✅ rbash shell |
| SFTP user deleted | old-transfer-user | ✅ |

### Summary Metrics
- **Total storage reclaimed**: 123.4GB
- **Credentials rotated**: 2 API tokens, 1 SSH key
- **Orphaned accounts removed**: 5 (2 DB users, 3 SSH/SFTP)
- **Failing cronjobs fixed**: 1
- **Obsolete resources deleted**: 3 (registry, stack, database)
- **Security posture**: Improved ✅

## Outcomes

- **Time Saved**: Full day of manual audit and cleanup reduced to a 2-hour MCP session. Complete visibility across all infrastructure components without jumping between consoles.
- **Error Reduction**: No missed orphaned accounts (systematic user listing), no accidental production deletions (get details before delete), no forgotten credentials (complete token/key inventory). The conversational workflow creates a natural audit trail for compliance.
- **Next Steps**:
  - Schedule Redis upgrade to 7.2.4 in next maintenance window
  - Implement automated credential rotation policy (90-day max)
  - Set up alerts for cronjob failures
  - Archive contractor-bob home directory and delete after 30 days
  - Document maintenance runbook based on this workflow

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `context/reset/session` | context | Start with clean session |
| `user/get` | identity | Verify admin account |
| `user/session/get` | identity | Verify current session |
| `user/api/token/list` | identity | Audit API tokens |
| `user/api/token/create` | identity | Create rotated token |
| `user/api/token/revoke` | identity | Revoke old tokens |
| `user/ssh/key/list` | identity | Audit SSH keys |
| `user/ssh/key/get` | identity | Get key details |
| `user/ssh/key/import` | identity | Import new key |
| `user/ssh/key/delete` | identity | Remove old key |
| `database/mysql/user/list` | databases | Audit DB users |
| `database/mysql/user/get` | databases | Get user details |
| `database/mysql/user/create` | databases | Create service account |
| `database/mysql/user/delete` | databases | Remove orphaned users |
| `database/mysql/user/update` | databases | Update permissions |
| `database/mysql/delete` | databases | Delete test database |
| `database/redis/get` | databases | Inspect Redis config |
| `database/redis/versions` | databases | Check upgrade options |
| `backup/list` | backups | Find old backups |
| `backup/delete` | backups | Remove old backups |
| `backup/schedule/delete` | backups | Remove old schedule |
| `cronjob/get` | automation | Inspect failing job |
| `cronjob/update` | automation | Fix cronjob config |
| `cronjob/delete` | automation | Remove obsolete job |
| `cronjob/execution/get` | automation | Check running job |
| `cronjob/execution/abort` | automation | Stop stuck execution |
| `registry/update` | containers | Reduce image retention |
| `registry/delete` | containers | Remove old registry |
| `stack/delete` | containers | Remove old stack |
| `ssh/user/delete` | ssh | Remove SSH access |
| `ssh/user/update` | ssh | Restrict shell access |
| `sftp/user/delete` | sftp | Remove SFTP access |
| `conversation/categories` | misc | List support categories |
| `conversation/show` | misc | Reference past maintenance |

**Total Tools**: 34 workflow tools across 8 domains (identity, databases, backups, automation, containers, ssh, sftp, misc)
