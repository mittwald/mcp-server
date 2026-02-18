# CS-003: E-commerce Launch Day Preparation

## Persona

**Segment**: SEG-003 E-commerce Specialist
**Role**: Shopware developer at a digital commerce agency preparing for a major client launch
**Context**: It's Thursday afternoon, and the client's new online fashion store goes live Monday morning for their Spring Collection launch. The marketing team has already sent press releases. There's no room for technical failures.

## Problem

E-commerce launches are high-stakes events where downtime means lost revenue and damaged brand reputation. The traditional pre-launch checklist involves manually verifying backups exist (and hoping they're recent), checking if the Shopware version has critical security patches, reviewing database configuration through phpMyAdmin, and hoping nothing was missed. Last quarter, a competitor's shop crashed on launch day because their database wasn't optimized for the traffic spike—their backup was 3 weeks old. The manual verification process takes 2-3 hours, creates anxiety, and still leaves gaps. One forgotten step can turn a successful launch into a PR disaster.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- Active Mittwald project with Shopware 6 installed
- Project ID available (e.g., `p-fashionstore`)
- Admin access to the project

### Step 1: Verify Existing Backup Status

```
List all backups for my Shopware project "Fashion Store Spring Launch"
and show me when the most recent backup was created.
```

**Tools Used**: `backup/list`
**Expected Output**: List of existing backups showing:
- Backup ID and creation timestamp
- Most recent backup: 5 days ago (too old for launch)
- Backup size and type (full/incremental)
- Alert: No backup in the last 24 hours

### Step 2: Create Fresh Pre-Launch Backup

```
Create a full backup of the Fashion Store project right now.
Label it "Pre-Launch Backup - Spring Collection" so we can identify it later.
```

**Tools Used**: `backup/create`
**Expected Output**: Backup job initiated:
- Backup ID: `bak-spring2025`
- Type: Full backup
- Status: In progress (estimated 15-20 minutes for 8GB project)
- Includes: Files, databases, configurations

### Step 3: Audit All Databases in Project

```
List all MySQL databases in this project. I need to verify the
production database is properly configured and no test databases
are left behind.
```

**Tools Used**: `database/mysql/list`
**Expected Output**: Database inventory:
- `fashionstore_prod` - 2.4GB (production)
- `fashionstore_staging` - 1.8GB (staging - consider cleanup)
- `fashionstore_test` - 0.3GB (test data - should remove)
- Total: 3 databases consuming 4.5GB

### Step 4: Check Production Database Configuration

```
Get the detailed configuration for the fashionstore_prod database.
I need to verify the MySQL version, character set, and connection limits
are appropriate for high traffic.
```

**Tools Used**: `database/mysql/get`
**Expected Output**: Database details:
- MySQL version: 8.0.35
- Character set: utf8mb4 (correct for international characters)
- Collation: utf8mb4_unicode_ci
- Max connections: 150 (may need increase for launch traffic)
- Storage engine: InnoDB
- Size: 2.4GB with 847 tables

### Step 5: Check Shopware App Version and Status

```
Get the current version and status of the Shopware application
installed in this project. I need to verify we're on a supported version.
```

**Tools Used**: `app/get`
**Expected Output**: Application details:
- App: Shopware 6
- Current version: 6.5.7.0
- Installation ID: `app-sw6-xyz`
- Document root: `/html/public`
- PHP version: 8.2
- Status: Running

### Step 6: Check for Available Upgrades

```
Are there any upgrade candidates for the apps in this project?
I want to ensure we're on the latest stable version before launch.
```

**Tools Used**: `app/list/upgrade/candidates`
**Expected Output**: Upgrade candidates found:
- Shopware 6: 6.5.7.0 → 6.5.8.1 available
  - Includes: Security patches, performance improvements
  - Release notes: Bug fixes for cart calculation
- Recommendation: Upgrade before launch (non-breaking changes)

### Step 7: Upgrade Shopware to Latest Version

```
Upgrade Shopware to version 6.5.8.1 in the Fashion Store project.
This includes the latest security patches before our Monday launch.
```

**Tools Used**: `app/upgrade`
**Expected Output**: Upgrade initiated:
- From: 6.5.8.0
- To: 6.5.8.1
- Status: In progress
- Estimated time: 5-10 minutes
- Note: Shop will be in maintenance mode during upgrade

### Step 8: Final Pre-Launch Verification

```
Give me a launch readiness summary for the Fashion Store project:
- Backup status (is the pre-launch backup complete?)
- Database health
- App version (is Shopware upgraded?)
```

**Tools Used**: `backup/list`, `database/mysql/get`, `app/get`
**Expected Output**: Launch Readiness Report:
- ✅ Backup: "Pre-Launch Backup - Spring Collection" completed (8.2GB)
- ✅ Database: fashionstore_prod healthy, MySQL 8.0.35, utf8mb4
- ✅ Shopware: 6.5.8.1 (latest stable)
- ✅ PHP: 8.2 compatible
- Ready for Monday launch

## Outcomes

- **Time Saved**: 2-3 hours of manual checking through MStudio, phpMyAdmin, and documentation reduced to 15-minute conversational workflow. The backup and upgrade run in parallel while you prepare other launch tasks.
- **Error Reduction**: No forgotten backups (verified and created fresh), no outdated software (upgrade candidates surfaced automatically), no surprise database issues (configuration verified). The structured workflow ensures nothing is missed.
- **Next Steps**:
  - Set up automated backup schedule with `backup/schedule/create`
  - Configure database monitoring alerts
  - Create a post-launch backup after successful launch
  - Document the launch configuration for future reference

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `backup/list` | backups | Verify existing backup status |
| `backup/create` | backups | Create fresh pre-launch backup |
| `database/mysql/list` | databases | Audit all databases in project |
| `database/mysql/get` | databases | Check production DB configuration |
| `app/get` | apps | Verify Shopware version and status |
| `app/list/upgrade/candidates` | apps | Find available upgrades |
| `app/upgrade` | apps | Upgrade to latest version |

**Total Tools**: 7 primary workflow tools (used across 8 steps)
