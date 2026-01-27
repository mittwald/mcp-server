---
title: Automated Backup Monitoring
description: Monitor and manage backup health across client projects with Mittwald MCP
---

In this tutorial, you'll set up a fast, repeatable workflow to monitor backups across multiple client projects and respond to gaps immediately.

## Who Is This For?

- **Segment**: Freelance Web Developer
- **Role**: Solo WordPress developer managing multiple client websites
- **Context**: A past backup failure caused significant recovery work, and you want continuous backup confidence

## What You'll Solve

- Replace 30-45 minute weekly manual audits with a 5-minute automated check
- Detect silent schedule failures before they become data-loss incidents

## Prerequisites

- [Mittwald MCP connected](/getting-started/)
- Multiple Mittwald projects with backups enabled
- Project IDs available (or the ability to list projects)

## Step-by-Step Guide

### Step 1: List Backup Schedules

Start by reviewing schedules for each project using [`backup/schedule/list`](/reference/tools/backup/backup-schedule-list/).

Example prompt:

```
List all backup schedules for the Weber Fashion project.
```

### Step 2: Check Backup Status Across Projects

Audit recent backups with [`backup/list`](/reference/tools/backup/backup-list/).

Example prompt:

```
List all recent backups across all my projects.
Show me the most recent backup for each project.
```

### Step 3: Verify Backup Integrity for Gaps

When a backup looks stale, inspect it using [`backup/get`](/reference/tools/backup/backup-get/). Confirm the status is successful and check size and file count.

Example prompt:

```
Get the details of the most recent backup for the Weber Fashion project.
```

### Step 4: Create a Manual Backup When Needed

If you need immediate coverage, trigger a manual backup using [`backup/create`](/reference/tools/backup/backup-create/).

Example prompt:

```
Create a manual backup for the Weber Fashion project now.
```

### Step 5: Fix or Add Backup Schedules

Create missing schedules with [`backup/schedule/create`](/reference/tools/backup/backup-schedule-create/) or update paused ones with [`backup/schedule/update`](/reference/tools/backup/backup-schedule-update/).

Example prompts:

```
Create a daily backup schedule at 04:00 with 14-day retention for Neumann Legal.
```

```
Update the Weber Fashion backup schedule to run at 02:00, retention 14 days,
and unpause it.
```

### Step 6: Set Up Backup Alerts

Use the audit results to create a weekly reminder (calendar, task manager, or monitoring system) that flags any project with gaps over 24 hours or paused schedules. This ensures you catch issues before a client does.

## What You'll Achieve

- **Time saved**: Weekly audits reduced from 30-45 minutes to ~5 minutes
- **Error reduction**: Silent schedule failures surfaced immediately
- **Next steps**:
  - Run this audit weekly and keep a short backup health log
  - Review storage quotas on projects that frequently pause

## Tools Reference

| Tool | Domain | Purpose in This Tutorial |
|------|--------|--------------------------|
| [`backup/schedule/list`](/reference/tools/backup/backup-schedule-list/) | backup | Review existing backup schedules |
| [`backup/list`](/reference/tools/backup/backup-list/) | backup | Audit recent backups across projects |
| [`backup/get`](/reference/tools/backup/backup-get/) | backup | Inspect backup details and integrity |
| [`backup/create`](/reference/tools/backup/backup-create/) | backup | Trigger a manual backup |
| [`backup/schedule/create`](/reference/tools/backup/backup-schedule-create/) | backup | Add missing backup schedules |
| [`backup/schedule/update`](/reference/tools/backup/backup-schedule-update/) | backup | Fix or unpause schedules |

## Related Tutorials

- [Client Onboarding Automation](/case-studies/freelancer-client-onboarding/) - Automate new client setup workflow
