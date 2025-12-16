# Data Model: Langfuse MCP Eval Suite

**Feature**: 010-langfuse-mcp-eval
**Date**: 2025-12-16
**Status**: In Progress

## Overview

This document defines the entities, attributes, and relationships for the MCP evaluation suite with Langfuse integration.

---

## Core Entities

### 1. EvalPrompt

A Langfuse-compatible evaluation definition for a single MCP tool.

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique identifier (format: `eval-{domain}-{tool_name}`) |
| tool_name | string | Yes | MCP tool identifier (e.g., `mittwald_project_create`) |
| domain | enum | Yes | One of 10 functional domains |
| tier | integer | Yes | Dependency tier (0-4) |
| prompt_text | string | Yes | The evaluation prompt for the LLM |
| dependencies | array[string] | Yes | List of prerequisite tool names (empty for Tier 0) |
| setup_instructions | string | No | Instructions for establishing prerequisites |
| success_indicators | array[string] | Yes | Observable outcomes indicating success |
| created_at | datetime | Yes | ISO 8601 timestamp |
| langfuse_format | object | Yes | Langfuse-compatible input/metadata structure |

### 2. DependencyNode

A node in the tool dependency graph.

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| tool_name | string | Yes | MCP tool identifier |
| domain | enum | Yes | Functional domain |
| tier | integer | Yes | Calculated dependency depth |
| requires | array[string] | Yes | Direct prerequisites (adjacency list) |
| required_by | array[string] | Yes | Inverse adjacency (tools that depend on this) |

### 3. SelfAssessment

Structured LLM output after eval execution.

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| eval_id | string | Yes | Reference to EvalPrompt.id |
| session_id | string | Yes | Claude Code session identifier |
| success | boolean | Yes | Overall success determination |
| confidence | enum | Yes | `high`, `medium`, or `low` |
| problems_encountered | array[Problem] | Yes | List of issues (can be empty) |
| resources_created | array[Resource] | Yes | Resources created during eval |
| resources_verified | array[Verification] | Yes | Verification outcomes |
| execution_notes | string | No | Free-form observations |
| tool_response_summary | string | No | Key data from tool output |
| timestamp | datetime | Yes | When assessment was generated |

### 4. Problem (embedded in SelfAssessment)

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | Yes | Error category (e.g., `auth_error`, `resource_not_found`) |
| description | string | Yes | What happened |
| recovery_attempted | boolean | Yes | Whether recovery was tried |

### 5. Resource (embedded in SelfAssessment)

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | Yes | Resource type (e.g., `project`, `database`, `backup`) |
| id | string | Yes | Resource identifier from Mittwald |
| verified | boolean | Yes | Whether existence was confirmed |

### 6. Verification (embedded in SelfAssessment)

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | Yes | Resource type verified |
| id | string | Yes | Resource identifier |
| status | string | Yes | Verification outcome description |

### 7. EvalResult

Combined record of prompt + execution + assessment.

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique result identifier |
| eval_prompt | EvalPrompt | Yes | The eval definition |
| session_log_path | string | Yes | Path to raw session log |
| self_assessment | SelfAssessment | No | Extracted assessment (null if extraction failed) |
| execution_status | enum | Yes | `completed`, `interrupted`, `failed`, `pending` |
| started_at | datetime | No | Execution start time |
| completed_at | datetime | No | Execution end time |

### 8. CoverageReport

Aggregated execution status by domain.

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| domain | enum | Yes | Functional domain |
| total_tools | integer | Yes | Count of tools in domain |
| executed | integer | Yes | Count with execution attempts |
| success_count | integer | Yes | Count with success=true |
| failure_count | integer | Yes | Count with success=false |
| pending_count | integer | Yes | Count not yet executed |
| coverage_percent | float | Yes | executed / total_tools * 100 |

---

## Domain Enumeration

**Total Verified Tool Count: 175** (from `/src/handlers/tools/mittwald-cli/*-cli.ts`)

The 10 functional domains from sprint 005, with verified tool counts:

| Domain | Description | Verified Tool Count | Tool Prefixes |
|--------|-------------|---------------------|---------------|
| apps | App installation, management, dependencies | 28 | `app/` |
| databases | MySQL, Redis databases and users | 22 | `database/` |
| domains-mail | DNS, domains, virtualhosts, mail | 18 | `domain/`, `mail/` |
| identity | User profile, sessions, SSH keys, API tokens | 17 | `user/`, `context/` |
| project-foundation | Project CRUD, server access, filesystem | 16 | `project/`, `server/` |
| containers | Container lifecycle, logs, stacks, volumes, registries | 15 | `container/`, `stack/`, `volume/`, `registry/` |
| organization | Org management, memberships, invites, extensions | 14 | `org/`, `extension/` |
| automation | Cronjobs (extensions moved to org) | 11 | `cronjob/` |
| backups | Backup lifecycle, schedules | 9 | `backup/` |
| access-users | SSH users, SFTP users | 8 | `sftp/`, `ssh/` |

**Additional tools requiring domain assignment:**
- `conversation/` (6 tools) - Support conversations
- `login/` (3 tools) - Authentication (likely identity)
- `ddev/` (2 tools) - Local development integration
- `certificate/` (2 tools) - SSL certificates (likely domains-mail)

---

## Tool Tier Classification

### Tier 0 - Foundational (No Prerequisites)

Tools that can run without any prior resource setup:

| Domain | Tools |
|--------|-------|
| identity | `user_get`, `user_session_list`, `user_ssh_key_list`, `user_api_token_list` |
| organization | `org_list`, `org_membership_list_own` |
| project-foundation | `context_get`, `project_list` |

### Tier 1 - Organization Context Required

Tools requiring user/org context but no project:

| Domain | Tools |
|--------|-------|
| organization | `org_get`, `org_invite`, `server_list` |
| project-foundation | `project_create` |

### Tier 2 - Project Required

Tools requiring an existing project:

| Domain | Tools |
|--------|-------|
| apps | `app_create_*`, `app_install_*`, `app_list` |
| databases | `database_mysql_create`, `database_redis_create` |
| containers | `container_run`, `container_list` |
| backups | `backup_list`, `backup_schedule_list` |

### Tier 3 - App/Resource Required

Tools requiring an existing app, database, or other resource:

| Domain | Tools |
|--------|-------|
| apps | `app_get`, `app_update`, `app_upgrade`, `app_dependency_*` |
| databases | `database_mysql_user_create`, `database_mysql_dump` |
| backups | `backup_create`, `backup_schedule_create` |
| automation | `cronjob_create` |

### Tier 4 - Dependent Operations

Tools requiring specific resources from Tier 3:

| Domain | Tools |
|--------|-------|
| backups | `backup_get`, `backup_download`, `backup_delete` |
| automation | `cronjob_execute`, `cronjob_execution_*` |
| apps | `app_uninstall` |

---

## Relationships

```
EvalPrompt 1 ----* DependencyNode (tool has prerequisites)
EvalPrompt 1 ----1 EvalResult (execution outcome)
EvalResult 1 ----1 SelfAssessment (extracted from session)
SelfAssessment 1----* Problem
SelfAssessment 1----* Resource
SelfAssessment 1----* Verification
CoverageReport 1----* EvalResult (aggregated by domain)
```

---

## File Structure

```
kitty-specs/010-langfuse-mcp-eval/
├── research.md              # This research document
├── data-model.md            # Entity definitions (this file)
├── research/
│   ├── evidence-log.csv     # Findings audit trail
│   └── source-register.csv  # Source documentation
└── (future sprint artifacts)

evals/
├── datasets/
│   └── mittwald-mcp-tools.json    # Langfuse-format dataset
├── dependency-graph/
│   ├── tools.json                 # Adjacency list
│   └── tools.dot                  # Graphviz visualization
├── prompts/
│   ├── identity/                  # Domain-organized prompts
│   ├── organization/
│   ├── project-foundation/
│   ├── apps/
│   ├── containers/
│   ├── databases/
│   ├── domains-mail/
│   ├── access-users/
│   ├── automation/
│   └── backups/
└── results/
    ├── manifest.jsonl             # Execution manifest
    ├── self-assessments/          # Extracted assessments
    └── coverage-report.json       # Aggregated coverage
```

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-16 | Initial data model created | Claude |
