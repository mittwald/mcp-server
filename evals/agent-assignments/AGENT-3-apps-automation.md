# Agent 3: Apps & Automation (Tier 4)

**Phase**: 3 (Parallel Execution)
**Workload**: 25 tools
**Domains**: apps, automation, backups
**Dependencies**: Agent 2 must complete first (needs project context)
**Estimated Duration**: 20-25 minutes

---

## ⚠️ CRITICAL INSTRUCTIONS

1. **Wait for Agent 2** to complete before starting
2. **Execute ALL 25 evals** - Do NOT batch or skip
3. **CALL MCP tools directly** - No scripts
4. **Save immediately** to `evals/results/active/{domain}/{tool-name}-result.json`
5. **Can run in parallel** with Agents 4 and 5

---

## Domain: Apps (8 tools)

Read from `evals/prompts/apps/*.json`, save to `evals/results/active/apps/`:

1. app-list → `app-list-result.json`
2. app-get → `app-get-result.json`
3. app-versions → `app-versions-result.json`
4. app-copy → `app-copy-result.json`
5. app-update → `app-update-result.json`
6. app-list-upgrade-candidates → `app-list-upgrade-candidates-result.json`
7. app-upgrade → `app-upgrade-result.json`
8. app-uninstall → `app-uninstall-result.json`

---

## Domain: Automation (9 tools)

Read from `evals/prompts/automation/*.json`, save to `evals/results/active/automation/`:

1. cronjob-list → `cronjob-list-result.json`
2. cronjob-create → `cronjob-create-result.json`
3. cronjob-get → `cronjob-get-result.json`
4. cronjob-update → `cronjob-update-result.json`
5. cronjob-execute → `cronjob-execute-result.json`
6. cronjob-execution-list → `cronjob-execution-list-result.json`
7. cronjob-execution-get → `cronjob-execution-get-result.json`
8. cronjob-execution-abort → `cronjob-execution-abort-result.json`
9. cronjob-delete → `cronjob-delete-result.json`

---

## Domain: Backups (8 tools)

Read from `evals/prompts/backups/*.json`, save to `evals/results/active/backups/`:

1. backup-list → `backup-list-result.json`
2. backup-create → `backup-create-result.json`
3. backup-get → `backup-get-result.json`
4. backup-delete → `backup-delete-result.json`
5. backup-schedule-list → `backup-schedule-list-result.json`
6. backup-schedule-create → `backup-schedule-create-result.json`
7. backup-schedule-update → `backup-schedule-update-result.json`
8. backup-schedule-delete → `backup-schedule-delete-result.json`

---

## Progress Tracking

- [ ] Apps (8/8)
- [ ] Automation (9/9)
- [ ] Backups (8/8)

**Tools Completed**: _____ / 25
