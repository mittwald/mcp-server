# Tasks: Mittwald MCP Use Case Research & Documentation

**Feature**: 015-mittwald-mcp-use-case-research
**Mission**: research
**Generated**: 2025-01-19

## Overview

This document tracks the work packages for synthesizing **13 case studies** demonstrating Mittwald MCP use cases. Each case study follows the streamlined 4-section tutorial format defined in `quickstart.md`.

*Note: Originally planned for 10 case studies, but review identified that only 53/115 tools (46%) would be covered. WP12-WP14 were added to achieve 100% tool coverage.*

**Key Constraints**:
- All 5 customer segments covered (at least 2 case studies each)
- All 115 MCP tools referenced across the collection
- Practical, developer-focused documentation tone
- Tool Reference appendix available at `findings/tool-reference.md`

## Subtask Registry

| ID | Description | Work Package | Parallel |
|----|-------------|--------------|----------|
| T001 | Research domain/mail/certificate tools for client setup | WP01 | [P] |
| T002 | Write CS-001 persona (SEG-001 Freelancer) | WP01 | |
| T003 | Write CS-001 problem statement | WP01 | |
| T004 | Write CS-001 workflow (5-7 steps) | WP01 | |
| T005 | Write CS-001 outcomes and tool summary | WP01 | |
| T006 | Research org/membership/misc tools | WP02 | [P] |
| T007 | Write CS-002 persona (SEG-002 Agency) | WP02 | |
| T008 | Write CS-002 problem statement | WP02 | |
| T009 | Write CS-002 workflow (5-7 steps) | WP02 | |
| T010 | Write CS-002 outcomes and tool summary | WP02 | |
| T011 | Research backup/database/app tools | WP03 | [P] |
| T012 | Write CS-003 persona (SEG-003 E-commerce) | WP03 | |
| T013 | Write CS-003 problem statement | WP03 | |
| T014 | Write CS-003 workflow (6-8 steps) | WP03 | |
| T015 | Write CS-003 outcomes and tool summary | WP03 | |
| T016 | Research app/database/domain/ssh tools | WP04 | [P] |
| T017 | Write CS-004 persona (SEG-004 TYPO3) | WP04 | |
| T018 | Write CS-004 problem statement | WP04 | |
| T019 | Write CS-004 workflow (6-8 steps) | WP04 | |
| T020 | Write CS-004 outcomes and tool summary | WP04 | |
| T021 | Research stack/registry/container/volume tools | WP05 | [P] |
| T022 | Write CS-005 persona (SEG-005 Modern Stack) | WP05 | |
| T023 | Write CS-005 problem statement | WP05 | |
| T024 | Write CS-005 workflow (6-8 steps) | WP05 | |
| T025 | Write CS-005 outcomes and tool summary | WP05 | |
| T026 | Research backup schedule tools | WP06 | [P] |
| T027 | Write CS-006 persona (SEG-001 Freelancer) | WP06 | |
| T028 | Write CS-006 problem statement | WP06 | |
| T029 | Write CS-006 workflow (4-6 steps) | WP06 | |
| T030 | Write CS-006 outcomes and tool summary | WP06 | |
| T031 | Research ssh/sftp/org/identity tools | WP07 | [P] |
| T032 | Write CS-007 persona (SEG-002 Agency) | WP07 | |
| T033 | Write CS-007 problem statement | WP07 | |
| T034 | Write CS-007 workflow (5-7 steps) | WP07 | |
| T035 | Write CS-007 outcomes and tool summary | WP07 | |
| T036 | Research database/mysql/redis tools | WP08 | [P] |
| T037 | Write CS-008 persona (SEG-003 E-commerce) | WP08 | |
| T038 | Write CS-008 problem statement | WP08 | |
| T039 | Write CS-008 workflow (5-7 steps) | WP08 | |
| T040 | Write CS-008 outcomes and tool summary | WP08 | |
| T041 | Research user/api/token/certificate tools | WP09 | [P] |
| T042 | Write CS-009 persona (SEG-004 TYPO3) | WP09 | |
| T043 | Write CS-009 problem statement | WP09 | |
| T044 | Write CS-009 workflow (5-7 steps) | WP09 | |
| T045 | Write CS-009 outcomes and tool summary | WP09 | |
| T046 | Research cronjob/stack/context tools | WP10 | [P] |
| T047 | Write CS-010 persona (SEG-005 Modern Stack) | WP10 | |
| T048 | Write CS-010 problem statement | WP10 | |
| T049 | Write CS-010 workflow (6-8 steps) | WP10 | |
| T050 | Write CS-010 outcomes and tool summary | WP10 | |
| T051 | Generate tool coverage matrix | WP11 | |
| T052 | Generate segment coverage matrix | WP11 | |
| T053 | Validate 100% tool coverage | WP11 | |
| T054 | Validate segment distribution | WP11 | |
| T055 | Create findings summary | WP11 | |
| T056 | Research project/server/org lifecycle tools | WP12 | [P] |
| T057 | Write CS-012 persona (SEG-002 Agency) | WP12 | |
| T058 | Write CS-012 problem statement | WP12 | |
| T059 | Write CS-012 workflow (7-9 steps) | WP12 | |
| T060 | Write CS-012 outcomes and tool summary | WP12 | |
| T061 | Research domain and mail CRUD tools | WP13 | [P] |
| T062 | Write CS-013 persona (SEG-001 Freelancer) | WP13 | |
| T063 | Write CS-013 problem statement | WP13 | |
| T064 | Write CS-013 workflow (6-8 steps) | WP13 | |
| T065 | Write CS-013 outcomes and tool summary | WP13 | |
| T066 | Research remaining maintenance/cleanup tools | WP14 | [P] |
| T067 | Write CS-014 persona (SEG-005 Modern Stack) | WP14 | |
| T068 | Write CS-014 problem statement | WP14 | |
| T069 | Write CS-014 workflow (8-10 steps) | WP14 | |
| T070 | Write CS-014 outcomes and tool summary | WP14 | |

## Work Packages

### Phase 1: SEG-001 & SEG-002 Case Studies (Foundational)

---

#### WP01: CS-001 Freelancer Client Onboarding
**Prompt File**: `tasks/WP01-freelancer-client-onboarding.md`
**Priority**: P1 | **Segment**: SEG-001 | **Estimated Lines**: ~350

**Goal**: Write case study demonstrating how a freelancer can automate new client setup (project, domain, DNS, email, SSL) using MCP.

**Included Subtasks**:
- [ ] T001: Research domain/mail/certificate tools for client setup
- [ ] T002: Write CS-001 persona (SEG-001 Freelancer)
- [ ] T003: Write CS-001 problem statement
- [ ] T004: Write CS-001 workflow (5-7 steps)
- [ ] T005: Write CS-001 outcomes and tool summary

**Primary Tools**: `project/create`, `domain/virtualhost/create`, `domain/dnszone/update`, `mail/address/create`, `mail/deliverybox/create`, `certificate/request`

**Dependencies**: None (can start immediately)

**Risks**: Ensure workflow is realistic for solo developer use case

---

#### WP02: CS-002 Agency Multi-Project Management
**Prompt File**: `tasks/WP02-agency-multi-project.md`
**Priority**: P1 | **Segment**: SEG-002 | **Estimated Lines**: ~350

**Goal**: Write case study demonstrating how an agency can manage multiple client projects, team coordination, and support conversations using MCP.

**Included Subtasks**:
- [ ] T006: Research org/membership/misc tools
- [ ] T007: Write CS-002 persona (SEG-002 Agency)
- [ ] T008: Write CS-002 problem statement
- [ ] T009: Write CS-002 workflow (5-7 steps)
- [ ] T010: Write CS-002 outcomes and tool summary

**Primary Tools**: `project/list`, `org/get`, `org/membership/list`, `conversation/create`, `conversation/list`, `conversation/reply`

**Dependencies**: None (can run in parallel with WP01)

**Risks**: misc domain tools (conversations) may have limited use cases

---

### Phase 2: SEG-003 & SEG-004 Case Studies (Complex Workflows)

---

#### WP03: CS-003 E-commerce Launch Day Preparation
**Prompt File**: `tasks/WP03-ecommerce-launch-day.md`
**Priority**: P1 | **Segment**: SEG-003 | **Estimated Lines**: ~400

**Goal**: Write case study demonstrating how an e-commerce specialist can prepare for a shop launch (backups, database optimization, app upgrades) using MCP.

**Included Subtasks**:
- [ ] T011: Research backup/database/app tools
- [ ] T012: Write CS-003 persona (SEG-003 E-commerce)
- [ ] T013: Write CS-003 problem statement
- [ ] T014: Write CS-003 workflow (6-8 steps)
- [ ] T015: Write CS-003 outcomes and tool summary

**Primary Tools**: `backup/create`, `backup/list`, `database/mysql/get`, `database/mysql/list`, `app/get`, `app/upgrade`, `app/list/upgrade/candidates`

**Dependencies**: None (can run in parallel)

**Risks**: Higher complexity - ensure workflow is comprehensive but not overwhelming

---

#### WP04: CS-004 TYPO3 Multi-Site Deployment
**Prompt File**: `tasks/WP04-typo3-multisite.md`
**Priority**: P1 | **Segment**: SEG-004 | **Estimated Lines**: ~450

**Goal**: Write case study demonstrating how an enterprise TYPO3 developer can coordinate multi-site deployments with database, domain, and SSH configuration using MCP.

**Included Subtasks**:
- [ ] T016: Research app/database/domain/ssh tools
- [ ] T017: Write CS-004 persona (SEG-004 TYPO3)
- [ ] T018: Write CS-004 problem statement
- [ ] T019: Write CS-004 workflow (6-8 steps)
- [ ] T020: Write CS-004 outcomes and tool summary

**Primary Tools**: `app/copy`, `app/update`, `database/mysql/create`, `domain/list`, `domain/virtualhost/create`, `project/ssh`, `ssh/user/list`

**Dependencies**: None (can run in parallel)

**Risks**: TYPO3-specific workflow details - ensure accuracy

---

### Phase 3: SEG-005 Case Studies (Modern Stack)

---

#### WP05: CS-005 Container Stack Deployment
**Prompt File**: `tasks/WP05-container-stack.md`
**Priority**: P1 | **Segment**: SEG-005 | **Estimated Lines**: ~450

**Goal**: Write case study demonstrating how a modern stack developer can deploy Docker stacks with registry, volumes, and containers using MCP.

**Included Subtasks**:
- [ ] T021: Research stack/registry/container/volume tools
- [ ] T022: Write CS-005 persona (SEG-005 Modern Stack)
- [ ] T023: Write CS-005 problem statement
- [ ] T024: Write CS-005 workflow (6-8 steps)
- [ ] T025: Write CS-005 outcomes and tool summary

**Primary Tools**: `stack/deploy`, `stack/list`, `stack/ps`, `registry/create`, `registry/list`, `container/list`, `volume/list`

**Dependencies**: None (can run in parallel)

**Risks**: Container domain requires DevOps familiarity

---

### Phase 4: Supplementary Case Studies (All Segments)

---

#### WP06: CS-006 Automated Backup Monitoring
**Prompt File**: `tasks/WP06-backup-monitoring.md`
**Priority**: P2 | **Segment**: SEG-001 | **Estimated Lines**: ~300

**Goal**: Write case study demonstrating how a freelancer can automate backup verification and scheduling using MCP.

**Included Subtasks**:
- [ ] T026: Research backup schedule tools
- [ ] T027: Write CS-006 persona (SEG-001 Freelancer)
- [ ] T028: Write CS-006 problem statement
- [ ] T029: Write CS-006 workflow (4-6 steps)
- [ ] T030: Write CS-006 outcomes and tool summary

**Primary Tools**: `backup/list`, `backup/get`, `backup/schedule/list`, `backup/schedule/create`, `backup/schedule/update`

**Dependencies**: Depends on WP01 (same segment context)

**Risks**: Lower complexity - ensure value proposition is clear

---

#### WP07: CS-007 New Developer Onboarding
**Prompt File**: `tasks/WP07-developer-onboarding.md`
**Priority**: P2 | **Segment**: SEG-002 | **Estimated Lines**: ~350

**Goal**: Write case study demonstrating how an agency can onboard new developers with proper SSH, SFTP, and organization access using MCP.

**Included Subtasks**:
- [ ] T031: Research ssh/sftp/org/identity tools
- [ ] T032: Write CS-007 persona (SEG-002 Agency)
- [ ] T033: Write CS-007 problem statement
- [ ] T034: Write CS-007 workflow (5-7 steps)
- [ ] T035: Write CS-007 outcomes and tool summary

**Primary Tools**: `ssh/user/create`, `ssh/user/list`, `sftp/user/list`, `org/invite`, `org/membership/list`, `user/ssh/key/create`

**Dependencies**: Depends on WP02 (same segment context)

**Risks**: Security considerations - emphasize proper access management

---

#### WP08: CS-008 Database Performance Optimization
**Prompt File**: `tasks/WP08-database-performance.md`
**Priority**: P2 | **Segment**: SEG-003 | **Estimated Lines**: ~350

**Goal**: Write case study demonstrating how an e-commerce specialist can optimize MySQL and Redis databases for performance using MCP.

**Included Subtasks**:
- [ ] T036: Research database/mysql/redis tools
- [ ] T037: Write CS-008 persona (SEG-003 E-commerce)
- [ ] T038: Write CS-008 problem statement
- [ ] T039: Write CS-008 workflow (5-7 steps)
- [ ] T040: Write CS-008 outcomes and tool summary

**Primary Tools**: `database/mysql/list`, `database/mysql/get`, `database/mysql/user/list`, `database/redis/create`, `database/redis/list`, `database/mysql/versions`

**Dependencies**: Depends on WP03 (same segment context)

**Risks**: Database performance is nuanced - focus on MCP capabilities, not deep DBA work

---

#### WP09: CS-009 Security Audit Automation
**Prompt File**: `tasks/WP09-security-audit.md`
**Priority**: P2 | **Segment**: SEG-004 | **Estimated Lines**: ~350

**Goal**: Write case study demonstrating how an enterprise TYPO3 developer can automate security audits (API tokens, SSH keys, certificates) using MCP.

**Included Subtasks**:
- [x] T041: Research user/api/token/certificate tools
- [x] T042: Write CS-009 persona (SEG-004 TYPO3)
- [x] T043: Write CS-009 problem statement
- [x] T044: Write CS-009 workflow (5-7 steps)
- [x] T045: Write CS-009 outcomes and tool summary

**Primary Tools**: `user/api/token/list`, `user/api/token/get`, `user/ssh/key/list`, `certificate/list`, `user/session/list`

**Dependencies**: Depends on WP04 (same segment context)

**Risks**: Compliance focus - ensure accuracy of security audit workflows

---

#### WP10: CS-010 CI/CD Pipeline Integration
**Prompt File**: `tasks/WP10-cicd-pipeline.md`
**Priority**: P2 | **Segment**: SEG-005 | **Estimated Lines**: ~400

**Goal**: Write case study demonstrating how a modern stack developer can integrate MCP with CI/CD pipelines using cronjobs and context management.

**Included Subtasks**:
- [ ] T046: Research cronjob/stack/context tools
- [ ] T047: Write CS-010 persona (SEG-005 Modern Stack)
- [ ] T048: Write CS-010 problem statement
- [ ] T049: Write CS-010 workflow (6-8 steps)
- [ ] T050: Write CS-010 outcomes and tool summary

**Primary Tools**: `cronjob/create`, `cronjob/list`, `cronjob/execute`, `cronjob/execution/list`, `stack/deploy`, `context/set/session`, `context/get/session`

**Dependencies**: Depends on WP05 (same segment context)

**Risks**: CI/CD integration is advanced - ensure accessible to target audience

---

### Phase 5: Tool Coverage Completion (Added via Review)

*Note: WP12-WP14 were added after review of WP01-WP10 identified that only 53/115 tools (46%) were covered. These work packages ensure 100% tool coverage.*

---

#### WP12: CS-012 Project Lifecycle Management
**Prompt File**: `tasks/WP12-project-lifecycle-management.md`
**Priority**: P1 | **Segment**: SEG-002 | **Estimated Lines**: ~400

**Goal**: Write case study demonstrating complete project lifecycle management—from setup through archival and deletion—covering the missing "list", "delete", and "management" operations.

**Included Subtasks**:
- [x] T056: Research project/server/org lifecycle tools
- [x] T057: Write CS-012 persona (SEG-002 Agency)
- [x] T058: Write CS-012 problem statement
- [x] T059: Write CS-012 workflow (7-9 steps)
- [x] T060: Write CS-012 outcomes and tool summary

**Primary Tools**: `server/get`, `server/list`, `project/delete`, `project/update`, `project/invite/get`, `project/invite/list`, `project/membership/get`, `org/list`, `org/invite/list`, `org/invite/revoke`, `org/membership/revoke`, `app/list`, `app/uninstall`, `app/versions`

**Dependencies**: None

**Risks**: Delete operations require careful documentation of warnings/confirmations

---

#### WP13: CS-013 Email & Domain Administration
**Prompt File**: `tasks/WP13-email-domain-administration.md`
**Priority**: P1 | **Segment**: SEG-001 | **Estimated Lines**: ~350

**Goal**: Write case study demonstrating comprehensive email and domain administration—including the missing "get", "update", and "delete" operations.

**Included Subtasks**:
- [x] T061: Research domain and mail CRUD tools
- [x] T062: Write CS-013 persona (SEG-001 Freelancer)
- [x] T063: Write CS-013 problem statement
- [x] T064: Write CS-013 workflow (6-8 steps)
- [x] T065: Write CS-013 outcomes and tool summary

**Primary Tools**: `domain/get`, `domain/dnszone/get`, `domain/dnszone/list`, `domain/virtualhost/get`, `domain/virtualhost/delete`, `mail/address/get`, `mail/address/delete`, `mail/address/update`, `mail/deliverybox/get`, `mail/deliverybox/list`, `mail/deliverybox/delete`, `mail/deliverybox/update`

**Dependencies**: None

**Risks**: Migration scenario must show clear before/after state

---

#### WP14: CS-014 Infrastructure Maintenance & Cleanup
**Prompt File**: `tasks/WP14-infrastructure-maintenance.md`
**Priority**: P1 | **Segment**: SEG-005 | **Estimated Lines**: ~500

**Goal**: Write case study demonstrating comprehensive infrastructure maintenance—covering all remaining tools including database user management, credential rotation, and cleanup operations.

**Included Subtasks**:
- [x] T066: Research remaining maintenance and cleanup tools
- [x] T067: Write CS-014 persona (SEG-005 Modern Stack)
- [ ] T068: Write CS-014 problem statement
- [ ] T069: Write CS-014 workflow (8-10 steps)
- [ ] T070: Write CS-014 outcomes and tool summary

**Primary Tools**: `backup/delete`, `backup/schedule/delete`, `database/mysql/delete`, `database/mysql/user/*` (4), `database/redis/get`, `database/redis/versions`, `registry/delete`, `registry/update`, `stack/delete`, `sftp/user/delete`, `ssh/user/delete`, `ssh/user/update`, `cronjob/get`, `cronjob/update`, `cronjob/delete`, `cronjob/execution/get`, `cronjob/execution/abort`, `context/reset/session`, `conversation/categories`, `conversation/show`, `user/get`, `user/session/get`, `user/api/token/create`, `user/api/token/revoke`, `user/ssh/key/get`, `user/ssh/key/delete`, `user/ssh/key/import`

**Dependencies**: None

**Risks**: Large tool count (30) requires well-organized workflow sections

---

### Phase 6: Validation

---

#### WP11: Coverage Matrices & Validation
**Prompt File**: `tasks/WP11-coverage-validation.md`
**Priority**: P1 | **Estimated Lines**: ~250

**Goal**: Generate coverage matrices and validate that all 115 MCP tools and all 5 customer segments are covered across the 13 case studies.

**Included Subtasks**:
- [ ] T051: Generate tool coverage matrix
- [ ] T052: Generate segment coverage matrix
- [ ] T053: Validate 100% tool coverage
- [ ] T054: Validate segment distribution
- [ ] T055: Create findings summary

**Output Files**:
- `findings/tool-coverage-matrix.md`
- `findings/segment-coverage-matrix.md`
- `findings/research-summary.md`

**Dependencies**: Depends on WP01-WP10, WP12-WP14 (all case studies complete)

**Risks**: Should now pass with WP12-WP14 addressing coverage gaps

---

### Appendix: Tool Reference

**File**: `findings/tool-reference.md`
**Created by**: Review process

A complete reference of all 115 MCP tools organized by domain, with brief descriptions and case study cross-references. This serves as standalone documentation separate from the case studies.

---

## Parallelization Strategy

**Phase 1** (WP01, WP02): Can run in parallel - different segments, no dependencies
**Phase 2** (WP03, WP04): Can run in parallel - different segments, no dependencies
**Phase 3** (WP05): Can run in parallel with Phase 2
**Phase 4** (WP06-WP10): Can partially parallelize:
  - WP06 after WP01, WP07 after WP02 (same segment pairs)
  - WP08 after WP03, WP09 after WP04, WP10 after WP05
**Phase 5** (WP12, WP13, WP14): Can run in parallel - independent coverage completion
**Phase 6** (WP11): Sequential - requires all case studies complete

**Maximum Parallel Agents**: 5 (one per segment in early phases)

## Acceptance Criteria

1. **13 case studies** complete in `findings/` directory (10 original + 3 coverage completion)
2. **100% segment coverage**: At least 2 case studies per segment
3. **100% tool coverage**: All 115 tools referenced across case studies
4. **Quality validation**: All case studies pass `quickstart.md` checklist
5. **Coverage matrices**: Both tool and segment matrices generated
6. **Tool reference**: Complete tool reference appendix available

## Next Steps

After task generation:
1. Run `/spec-kitty.implement WP01` to start first case study
2. Can run WP01-WP05 in parallel (one per segment)
3. Run `/spec-kitty.review` after each WP completes
4. Run WP12-WP14 in parallel for coverage completion
5. Run WP11 last for final validation
