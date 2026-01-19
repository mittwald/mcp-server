# CS-010: CI/CD Pipeline Integration

## Persona

**Segment**: SEG-005 Modern Stack Developer
**Role**: DevOps engineer at a SaaS startup managing automated deployments
**Context**: The team runs a multi-environment SaaS platform (staging, production) with Docker containers. Deployments currently require manual triggers, scheduled maintenance tasks are scattered across different cron configurations, and there's no single view of what automation is running. You want to consolidate everything into MCP-managed workflows.

## Problem

Modern DevOps teams juggle multiple automation concerns: CI/CD pipelines trigger deployments, cron jobs run maintenance tasks, and different environments need different configurations. Currently, deployments require logging into the CI/CD tool, finding the right pipeline, and triggering it—or worse, SSH-ing to the server and running commands manually. Scheduled tasks are configured in different places (server crontab, CI/CD schedules, application-level schedulers), making it impossible to get a unified view of what's running when. When a cron job fails, you discover it days later. When you need to switch between staging and production contexts, you're constantly re-authenticating and changing configurations. The cognitive overhead of context switching costs hours per week.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- Active Mittwald project with container hosting enabled
- Docker stack deployed (from CS-005 workflow)
- Project IDs for staging (`p-saas-staging`) and production (`p-saas-prod`)

### Step 1: Check Current Session Context

```
What's my current MCP session context? I need to know which
project I'm connected to before making any changes.
```

**Tools Used**: `context/get/session`
**Expected Output**: Current session context:
- **Project**: p-saas-staging (SaaS App Staging)
- **Organization**: o-saascompany
- **User**: devops@saascompany.io
- **Session started**: 2025-01-19 09:00:00
- **Default timeout**: 8 hours

You're currently targeting the staging environment.

### Step 2: Set Context to Production Environment

```
Switch my session context to the production project.
I need to set up deployment automation for production.
```

**Tools Used**: `context/set/session`
**Expected Output**: Session context updated:
- **Previous project**: p-saas-staging
- **New project**: p-saas-prod (SaaS App Production)
- **Organization**: o-saascompany (unchanged)
- **Context switch**: Successful
- **Note**: All subsequent commands will target production

⚠️ Warning: You are now operating in the production environment. Exercise caution with destructive operations.

### Step 3: List Existing Cron Jobs

```
List all cron jobs configured in the production project.
I need to audit what scheduled tasks are already running
before adding new automation.
```

**Tools Used**: `cronjob/list`
**Expected Output**: Cron job inventory for production:
| Cron ID | Name | Schedule | Command | Status |
|---------|------|----------|---------|--------|
| cron-001 | DB Backup | 0 3 * * * | /scripts/backup.sh | Active |
| cron-002 | Log Rotation | 0 0 * * 0 | /scripts/rotate-logs.sh | Active |
| cron-003 | Cache Clear | */15 * * * * | /scripts/clear-cache.sh | Active |
| cron-004 | Old Report Gen | 0 6 * * 1 | /scripts/report.sh | ⚠️ Failing |

4 cron jobs configured. `cron-004` is failing—investigate or remove.

### Step 4: Create Deployment Trigger Cron Job

```
Create a cron job that triggers a health check every 5 minutes.
If the health check fails, it should notify the team.
Name it "Production Health Monitor".
```

**Tools Used**: `cronjob/create`
**Expected Output**: Cron job created:
- **Cron ID**: cron-005
- **Name**: Production Health Monitor
- **Schedule**: */5 * * * * (every 5 minutes)
- **Command**: `/scripts/health-check.sh`
- **Notification**: Webhook on failure
- **Status**: Active
- **First execution**: 2025-01-19 14:35:00 (in 3 minutes)

### Step 5: View Cron Execution History

```
Show me the execution history for the failing "Old Report Gen" cron job.
I need to understand why it's failing before deciding what to do with it.
```

**Tools Used**: `cronjob/execution/list`
**Expected Output**: Execution history for `cron-004` (Old Report Gen):
| Execution ID | Started | Duration | Exit Code | Status |
|--------------|---------|----------|-----------|--------|
| exec-004-100 | 2025-01-13 06:00 | 45s | 1 | ❌ Failed |
| exec-004-099 | 2025-01-06 06:00 | 42s | 1 | ❌ Failed |
| exec-004-098 | 2024-12-30 06:00 | 38s | 0 | ✅ Success |
| exec-004-097 | 2024-12-23 06:00 | 40s | 0 | ✅ Success |

Pattern: Started failing on 2025-01-06. Last 2 executions failed with exit code 1.
Error log preview: "FileNotFoundError: /data/reports/ directory does not exist"

Root cause: The reports directory was removed during a cleanup.

### Step 6: Manually Execute a Cron Job

```
Manually trigger the Production Health Monitor cron job now.
I want to verify it works before waiting for the scheduled execution.
```

**Tools Used**: `cronjob/execute`
**Expected Output**: Manual execution triggered:
- **Cron ID**: cron-005
- **Execution ID**: exec-005-001
- **Triggered by**: devops@saascompany.io (manual)
- **Started**: 2025-01-19 14:32:15
- **Status**: Running...

[After 5 seconds]
- **Completed**: 2025-01-19 14:32:20
- **Duration**: 5s
- **Exit code**: 0
- **Status**: ✅ Success
- **Output**: "All health checks passed. API: 200ms, DB: 15ms, Cache: 2ms"

### Step 7: Deploy Updated Container Stack

```
Deploy the latest version of our SaaS stack to production.
Use the docker-compose.prod.yml configuration.
```

**Tools Used**: `stack/deploy`
**Expected Output**: Stack deployment initiated:
- **Stack name**: saas-prod-stack
- **Environment**: Production
- **Services updating**: 3 (api, worker, scheduler)
- **Strategy**: Rolling update (zero downtime)
- **Status**: Deploying...

[After 2 minutes]
- **Deployment complete**
- **Services healthy**: 3/3
- **New image tags**: api:v2.4.1, worker:v2.4.1, scheduler:v2.4.1
- **Rollback available**: Yes (previous: v2.4.0)

### Step 8: Generate Automation Overview

```
Give me a complete automation overview for the production environment:
- All cron jobs with their schedules and status
- Recent deployment history
- Current session context
```

**Tools Used**: `cronjob/list`, `context/get/session`, `cronjob/execution/list`
**Expected Output**:

## Production Automation Overview
**Project**: p-saas-prod | **Environment**: Production | **Generated**: 2025-01-19 14:45

### Scheduled Tasks (Cron Jobs)
| Name | Schedule | Last Run | Status |
|------|----------|----------|--------|
| DB Backup | Daily 03:00 | ✅ 2025-01-19 03:00 | Active |
| Log Rotation | Weekly Sun 00:00 | ✅ 2025-01-12 00:00 | Active |
| Cache Clear | Every 15 min | ✅ 2025-01-19 14:30 | Active |
| Old Report Gen | Weekly Mon 06:00 | ❌ 2025-01-13 06:00 | Needs fix |
| Health Monitor | Every 5 min | ✅ 2025-01-19 14:35 | Active (new) |

### Recent Deployments
| Version | Deployed | Duration | Status |
|---------|----------|----------|--------|
| v2.4.1 | 2025-01-19 14:40 | 2m 15s | ✅ Current |
| v2.4.0 | 2025-01-15 10:30 | 2m 08s | Rollback available |

### Session Context
- Connected as: devops@saascompany.io
- Target: Production (p-saas-prod)
- Session active for: 5h 45m

### Action Items
1. ⚠️ Fix `Old Report Gen` cron (missing /data/reports/ directory)
2. ✅ Health monitoring now active (5-minute intervals)
3. ✅ v2.4.1 deployed successfully

## Outcomes

- **Time Saved**: Hours of context switching between tools reduced to a single MCP session. Deployment, cron management, and environment switching happen in one conversation instead of jumping between CI/CD dashboards, SSH sessions, and configuration files.
- **Error Reduction**: Failing cron job (`Old Report Gen`) discovered through unified visibility instead of waiting for customer complaints. Health monitoring established proactively. Production deployments verified with immediate health checks.
- **Next Steps**:
  - Fix the failing report generation cron (recreate /data/reports/ directory)
  - Set up deployment webhook to trigger MCP notifications
  - Create staging → production promotion workflow
  - Configure cron failure alerts to team Slack channel
  - Document the automation inventory for team onboarding

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `context/get/session` | context | Check current environment context |
| `context/set/session` | context | Switch between environments |
| `cronjob/list` | automation | Audit scheduled tasks |
| `cronjob/create` | automation | Create health monitoring job |
| `cronjob/execution/list` | automation | View execution history |
| `cronjob/execute` | automation | Manually trigger cron job |
| `stack/deploy` | containers | Deploy container stack |

**Total Tools**: 7 primary workflow tools (3 context/automation, 3 automation, 1 containers)
