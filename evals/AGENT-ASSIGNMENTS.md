# Multi-Agent Eval Execution Plan

**Total Tools**: 115
**Agents**: 5
**Average Load**: ~23 tools per agent

## Execution Strategy

Execute agents **sequentially by phase** to maintain tier dependencies:

1. **Phase 1** (Tier 0): Agent 1 (foundation)
2. **Phase 2** (Tier 1-3): Agent 2 (project setup)
3. **Phase 3** (Tier 4): Agents 3, 4, 5 in **parallel** (requires project context)

---

## 🤖 Agent 1: Foundation (Tier 0)

**Domains**: identity, organization, context
**Tool Count**: 22 tools
**Dependencies**: None (can run first)
**Estimated Time**: 20-25 minutes

### Tools to Execute

**Identity (12 tools)**:
1. user-api-token-create
2. user-api-token-get
3. user-api-token-list
4. user-api-token-revoke
5. user-get
6. user-session-get
7. user-session-list
8. user-ssh-key-create
9. user-ssh-key-delete
10. user-ssh-key-get
11. user-ssh-key-import
12. user-ssh-key-list

**Organization (7 tools)**:
1. org-get
2. org-invite
3. org-invite-list
4. org-invite-revoke
5. org-list
6. org-membership-list
7. org-membership-revoke

**Context (3 tools)**:
1. context-get-session
2. context-reset-session
3. context-set-session

---

## 🤖 Agent 2: Project Setup (Tier 1-3)

**Domains**: project-foundation, misc
**Tool Count**: 17 tools
**Dependencies**: Requires organization from Agent 1
**Estimated Time**: 15-20 minutes

### Tools to Execute

**Project Foundation (12 tools)**:
1. project-create
2. project-delete
3. project-get
4. project-invite-get
5. project-invite-list
6. project-list
7. project-membership-get
8. project-membership-list
9. project-ssh
10. project-update
11. server-get
12. server-list

**Misc (5 tools)**:
1. conversation-categories
2. conversation-create
3. conversation-list
4. conversation-reply
5. conversation-show

---

## 🤖 Agent 3: Apps & Automation (Tier 4)

**Domains**: apps, automation, backups
**Tool Count**: 25 tools
**Dependencies**: Requires project from Agent 2
**Estimated Time**: 20-25 minutes

### Tools to Execute

**Apps (8 tools)**:
1. app-copy
2. app-get
3. app-list
4. app-list-upgrade-candidates
5. app-uninstall
6. app-update
7. app-upgrade
8. app-versions

**Automation (9 tools)**:
1. cronjob-create
2. cronjob-delete
3. cronjob-execute
4. cronjob-execution-abort
5. cronjob-execution-get
6. cronjob-execution-list
7. cronjob-get
8. cronjob-list
9. cronjob-update

**Backups (8 tools)**:
1. backup-create
2. backup-delete
3. backup-get
4. backup-list
5. backup-schedule-create
6. backup-schedule-delete
7. backup-schedule-list
8. backup-schedule-update

---

## 🤖 Agent 4: Data & Containers (Tier 4)

**Domains**: databases, containers
**Tool Count**: 24 tools
**Dependencies**: Requires project from Agent 2
**Estimated Time**: 20-25 minutes

### Tools to Execute

**Databases (14 tools)**:
1. database-mysql-create
2. database-mysql-delete
3. database-mysql-get
4. database-mysql-list
5. database-mysql-user-create
6. database-mysql-user-delete
7. database-mysql-user-get
8. database-mysql-user-list
9. database-mysql-user-update
10. database-mysql-versions
11. database-redis-create
12. database-redis-get
13. database-redis-list
14. database-redis-versions

**Containers (10 tools)**:
1. container-list
2. registry-create
3. registry-delete
4. registry-list
5. registry-update
6. stack-delete
7. stack-deploy
8. stack-list
9. stack-ps
10. volume-list

---

## 🤖 Agent 5: Domains & Access (Tier 4)

**Domains**: domains-mail, access-users (sftp, ssh), certificates
**Tool Count**: 27 tools
**Dependencies**: Requires project from Agent 2
**Estimated Time**: 25-30 minutes

### Tools to Execute

**Domains & Mail (20 tools)**:
1. certificate-list
2. certificate-request
3. domain-dnszone-get
4. domain-dnszone-list
5. domain-dnszone-update
6. domain-get
7. domain-list
8. domain-virtualhost-create
9. domain-virtualhost-delete
10. domain-virtualhost-get
11. domain-virtualhost-list
12. mail-address-create
13. mail-address-delete
14. mail-address-get
15. mail-address-list
16. mail-address-update
17. mail-deliverybox-create
18. mail-deliverybox-delete
19. mail-deliverybox-get
20. mail-deliverybox-list
21. mail-deliverybox-update

**SFTP Users (2 tools)**:
1. sftp-user-delete
2. sftp-user-list

**SSH Users (4 tools)**:
1. ssh-user-create
2. ssh-user-delete
3. ssh-user-list
4. ssh-user-update

**Note**: certificate-list is in domains-mail, certificate-request is separate domain

---

## Execution Order

### Phase 1: Foundation (Sequential)
```bash
# Agent 1 must complete first
/spec-kitty.implement evals/agent-assignments/AGENT-1-foundation.md
```

### Phase 2: Project Setup (Sequential)
```bash
# Agent 2 runs after Agent 1 completes
/spec-kitty.implement evals/agent-assignments/AGENT-2-project-setup.md
```

### Phase 3: Project-Dependent (Parallel - FASTEST!)
```bash
# Agents 3, 4, 5 can run in parallel after Agent 2
/spec-kitty.implement evals/agent-assignments/AGENT-3-apps-automation.md &
/spec-kitty.implement evals/agent-assignments/AGENT-4-data-containers.md &
/spec-kitty.implement evals/agent-assignments/AGENT-5-domains-access.md &
wait
```

### Phase 4: Generate Report
```bash
npm run eval:report
```

---

## Workload Distribution

| Agent | Domains | Tools | % of Total | Phase |
|-------|---------|-------|------------|-------|
| 1 | identity, organization, context | 22 | 19.1% | Foundation (Tier 0) |
| 2 | project-foundation, misc | 17 | 14.8% | Setup (Tier 1-3) |
| 3 | apps, automation, backups | 25 | 21.7% | Parallel (Tier 4) |
| 4 | databases, containers | 24 | 20.9% | Parallel (Tier 4) |
| 5 | domains-mail, access-users, certs | 27 | 23.5% | Parallel (Tier 4) |

**Total**: 115 tools, balanced within 5% variance

---

## Benefits

✅ **No agent overload**: Max 27 tools per agent (vs 115 in single WP)
✅ **Parallel execution**: Agents 3-5 run simultaneously (3x faster)
✅ **Dependency safety**: Sequential phases ensure fixtures available
✅ **Smaller batches**: Agents less likely to skip/batch operations
✅ **Clear progress**: Track completion per agent

---

## Troubleshooting

**If Agent 1 fails**: Fix before proceeding (foundation is critical)
**If Agent 2 fails**: Agents 3-5 will fail (no project context)
**If Agent 3/4/5 fails**: Other agents can continue, re-run only failed agent

---

## Success Criteria

- ✅ All 5 agents complete successfully
- ✅ 115/115 tools executed (100% coverage)
- ✅ Success rate ≥ 65%
- ✅ All results saved to active run
- ✅ No batching or script generation detected

Ready to generate the agent assignment files!
