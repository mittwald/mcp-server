# CS-006: Automated Backup Monitoring

## Persona

**Segment**: SEG-001 Freelance Web Developer
**Role**: Solo WordPress developer managing 8 client websites across multiple Mittwald projects
**Context**: Last year, a client's WooCommerce store database got corrupted during a plugin update. The most recent backup was 3 weeks old because the automated schedule had silently failed. It cost 40 hours to reconstruct orders from email receipts. Never again.

## Problem

Freelancers managing multiple client sites face a constant low-grade anxiety: "Are my backups actually running?" Mittwald creates backups, but verifying them across 8 different projects means logging into each project, navigating to the backup section, and hoping the timestamps look recent. When schedules fail silently (disk quota reached, configuration drift), you only discover the problem after disaster strikes. Manual backup audits take 30-45 minutes weekly—time that gets skipped when deadlines loom. The result: inconsistent backup coverage and a nagging fear that one client's site is vulnerable.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- Multiple Mittwald projects with backup capability enabled
- Awareness of client project IDs or ability to list projects

### Step 1: Audit All Backups Across Projects

```
List all recent backups across all my projects. I need to see
which clients have fresh backups and which might have gaps.
Show me the most recent backup for each project.
```

**Tools Used**: `backup/list`
**Expected Output**: Backup audit across 8 projects:
| Project | Last Backup | Age | Size |
|---------|-------------|-----|------|
| Müller Bäckerei | 2025-01-19 03:00 | 12h | 2.1GB |
| Schmidt Dental | 2025-01-18 03:00 | 36h | 1.4GB |
| Weber Fashion | 2025-01-15 03:00 | 4 days ⚠️ | 3.2GB |
| ... | ... | ... | ... |

Alert: Weber Fashion backup is 4 days old (should be daily).

### Step 2: Investigate Backup Gap

```
Get the details of the most recent backup for the Weber Fashion
project. I need to understand why there's a 4-day gap.
```

**Tools Used**: `backup/get`
**Expected Output**: Backup details for Weber Fashion:
- Backup ID: `bak-wf-20250115`
- Created: 2025-01-15 03:00:12
- Type: Full
- Size: 3.2GB
- Status: Completed successfully
- Files: 45,892 files backed up
- Note: Last successful backup; subsequent attempts may have failed

### Step 3: Check Backup Schedules

```
List all backup schedules for the Weber Fashion project.
I need to see if the schedule is configured correctly or if it failed.
```

**Tools Used**: `backup/schedule/list`
**Expected Output**: Backup schedule for Weber Fashion:
- Schedule ID: `sched-wf-daily`
- Frequency: Daily at 03:00
- Retention: 7 days
- Status: **Paused** (storage quota exceeded)
- Last run: 2025-01-15 (failed on 01/16)
- Reason: Project exceeded 5GB storage limit

Problem identified: Storage quota caused schedule to pause.

### Step 4: Create Missing Backup Schedule

```
One of my newer clients, "Neumann Legal", doesn't have a backup schedule.
Create a daily backup schedule at 04:00 with 14-day retention.
```

**Tools Used**: `backup/schedule/create`
**Expected Output**: Backup schedule created:
- Schedule ID: `sched-nl-daily`
- Project: Neumann Legal
- Frequency: Daily at 04:00
- Retention: 14 days (keeps last 14 daily backups)
- Status: Active
- First backup: Tonight at 04:00

### Step 5: Update Existing Schedule

```
Update the Weber Fashion backup schedule to run at 02:00 instead
of 03:00, and increase retention to 14 days. Also, unpause it
now that I've cleared some storage space.
```

**Tools Used**: `backup/schedule/update`
**Expected Output**: Backup schedule updated:
- Schedule ID: `sched-wf-daily`
- Changes applied:
  - Time: 03:00 → 02:00
  - Retention: 7 days → 14 days
  - Status: Paused → Active
- Next backup: Tonight at 02:00
- Note: Manual backup recommended to restore coverage immediately

### Step 6: Generate Backup Health Report

```
Give me a summary of backup health across all my client projects:
- How many have active schedules?
- Any with gaps > 24 hours?
- Any schedules paused or failing?
```

**Tools Used**: `backup/list`, `backup/schedule/list`
**Expected Output**: Backup Health Report:
- **Projects monitored**: 8
- **With active schedules**: 7 (Neumann Legal now added)
- **Backups < 24h old**: 7/8
- **Gaps > 24h**: 1 (Weber Fashion - now fixed)
- **Paused schedules**: 0 (Weber Fashion reactivated)

✅ All projects now have active backup schedules.

## Outcomes

- **Time Saved**: 30-45 minute weekly manual audits reduced to a 5-minute conversational check. Can be done during morning coffee instead of being skipped under deadline pressure.
- **Error Reduction**: Silent schedule failures (like Weber Fashion's storage issue) are caught immediately instead of discovered after data loss. No more "I thought backups were running" surprises.
- **Next Steps**:
  - Set up a weekly MCP reminder to run backup audit
  - Consider creating a backup alert cronjob
  - Review storage quotas across all projects to prevent future pauses
  - Document backup SLAs for each client

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `backup/list` | backups | Audit backups across all projects |
| `backup/get` | backups | Investigate specific backup details |
| `backup/schedule/list` | backups | Review existing backup schedules |
| `backup/schedule/create` | backups | Create new backup schedule |
| `backup/schedule/update` | backups | Modify existing schedule |

**Total Tools**: 5 primary workflow tools (all from backups domain)
