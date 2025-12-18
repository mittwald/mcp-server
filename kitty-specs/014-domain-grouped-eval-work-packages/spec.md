# Feature Specification: Domain-Grouped Eval Work Packages

**Feature Branch**: `014-domain-grouped-eval-work-packages`
**Created**: 2025-12-18
**Status**: Draft
**Mission**: software-dev
**Predecessor**: `013-agent-based-mcp-tool-evaluation`

## Overview

### Problem Statement

Feature 013 created 116 eval prompt JSON files (organized by domain) for testing the post-012 MCP server, but they haven't been executed yet. There's no baseline data for MCP server health, and the eval prompts need to be run to validate the post-012 architecture works correctly for all tools.

### Solution

Execute all 116 evals by converting JSON prompts into domain-grouped Work Package (WP) files, running them via `/spec-kitty.implement`, and analyzing the results. Generate 12 WPs (one per domain) containing eval prompts ordered by dependency tier. Agents execute these WPs, calling MCP tools directly and saving self-assessments to disk. Aggregate results using feature 010's existing scripts to produce a comprehensive baseline coverage report. By the end of this feature, all 116 evals are executed and analyzed, establishing the post-014 baseline.

---

## User Scenarios & Testing

### User Story 1 - Domain Eval Execution (Priority: P1)

A test operator needs to execute all evals for a specific domain (e.g., identity, apps, databases) by running a single Work Package that contains all eval prompts for that domain, ordered by dependency tier.

**Why this priority**: This is the core execution workflow - without it, no evals run and no baseline is established.

**Independent Test**: Execute the identity domain WP via `/spec-kitty.implement` and verify all identity tools are tested, self-assessments are generated, and results are saved to `evals/results/identity/`.

**Acceptance Scenarios**:

1. **Given** a domain WP file exists (e.g., `apps.md`), **When** operator runs `/spec-kitty.implement evals/work-packages/apps.md`, **Then** agent executes all apps domain evals in tier order (0 → 4).
2. **Given** an agent is executing an eval prompt, **When** the prompt instructs tool execution, **Then** agent makes a live MCP tool call (not a simulation or script).
3. **Given** an eval completes, **When** agent generates output, **Then** self-assessment JSON is saved to `evals/results/{domain}/{tool-name}-result.json`.

---

### User Story 2 - Complete Baseline Execution (Priority: P1)

A test operator needs to execute all 12 domain WPs to run all 116 evals and establish the post-014 baseline for MCP server health.

**Why this priority**: Without executing all domains, the baseline is incomplete and MCP server health cannot be validated.

**Independent Test**: Execute all 12 domain WPs and verify all 116 self-assessments are saved to `evals/results/`.

**Acceptance Scenarios**:

1. **Given** 12 domain WP files exist, **When** operator executes all WPs via `/spec-kitty.implement`, **Then** all 116 evals run and self-assessments are saved.
2. **Given** an agent completes an eval, **When** self-assessment is generated, **Then** it contains all required fields: `success`, `confidence`, `tool_executed`, `timestamp`, `problems_encountered`, `resources_created`, `tool_response_summary`, `execution_notes`.
3. **Given** multiple evals complete in the same domain, **When** results are saved, **Then** each result is a separate JSON file in `evals/results/{domain}/{tool-name}-result.json`.

---

### User Story 3 - Result Aggregation and Analysis (Priority: P2)

After executing all evals, results must be aggregated into a comprehensive coverage report showing success rates, problem patterns, and domain/tier breakdowns.

**Why this priority**: Aggregation transforms raw eval results into actionable baseline data.

**Independent Test**: Run aggregation scripts on completed results and verify coverage report includes domain breakdown, tier breakdown, and success rate metrics.

**Acceptance Scenarios**:

1. **Given** all 116 self-assessments are saved, **When** aggregation scripts run, **Then** coverage report is generated with metrics: total tools (116), executed count, success count, failure count, success rate.
2. **Given** coverage report is generated, **When** examining domain breakdown, **Then** each of 12 domains shows tool count, success count, and success rate.
3. **Given** coverage report includes failure analysis, **When** examining problem types, **Then** failures are categorized (auth_error, api_error, dependency_missing, etc.) with affected tool lists.

---

### User Story 4 - Aggregation Script Validation (Priority: P3)

Feature 010's existing aggregation scripts must work correctly with the new result file structure to ensure accurate reporting.

**Why this priority**: Ensures aggregation infrastructure is compatible with the new execution model.

**Independent Test**: Run `extract-self-assessment.ts` and `generate-coverage-report.ts` on sample results and verify they produce valid output.

**Acceptance Scenarios**:

1. **Given** feature 010's `extract-self-assessment.ts` script exists, **When** running on results in `evals/results/{domain}/*.json`, **Then** script extracts all self-assessments without errors.
2. **Given** feature 010's `generate-coverage-report.ts` script exists, **When** running on extracted assessments, **Then** script produces coverage-report.json and baseline-report.md.
3. **Given** aggregation scripts need updates, **When** modifications are made, **Then** scripts maintain backward compatibility with feature 010/013 result formats.

---

### Edge Cases

- **WP contains eval with missing fixture dependency**: Agent marks self-assessment with `problem_type: "dependency_missing"` and continues to next eval.
- **Agent execution interrupted mid-WP**: Partial results are saved; operator can resume by skipping completed evals.
- **Self-assessment JSON is malformed**: Extraction script logs warning and marks eval as "extraction_failed".
- **Aggregation script encounters unexpected result file structure**: Script logs error with filename and continues processing remaining files.
- **Domain has no tools (empty WP)**: WP file is not created; domain skipped in coverage report.
- **Tool removed from MCP server during execution**: Eval fails with `problem_type: "api_error"`; documented in coverage report.

---

## Requirements

### Functional Requirements

**WP File Generation (Automated during task generation):**
- **FR-001**: System MUST generate 12 WP files during `/spec-kitty.tasks`, one per domain (access-users, apps, automation, backups, containers, context, databases, domains-mail, identity, misc, organization, project-foundation)
- **FR-002**: Each WP file MUST contain all eval prompts for its domain, extracted from JSON files in `evals/prompts/{domain}/`
- **FR-003**: Eval prompts within each WP MUST be ordered by tier (tier 0 first, tier 4 last)
- **FR-004**: Each eval prompt MUST include explicit instruction: "CALL the MCP tool `{tool_name}` directly (do NOT write automation scripts)"
- **FR-005**: WP files MUST be stored in feature tasks directory for execution via `/spec-kitty.implement`

**Eval Execution:**
- **FR-006**: All 116 evals MUST be executed during this feature's implementation phase
- **FR-007**: Agents MUST make live MCP tool calls to `mittwald-mcp-fly2.fly.dev`
- **FR-008**: Each eval prompt MUST include self-assessment instructions
- **FR-009**: Self-assessment MUST follow feature 010 schema with fields: `success`, `confidence`, `tool_executed`, `timestamp`, `problems_encountered`, `resources_created`, `tool_response_summary`, `execution_notes`
- **FR-010**: Self-assessment MUST be wrapped in markers: `<!-- SELF_ASSESSMENT_START -->` ... `<!-- SELF_ASSESSMENT_END -->`

**Result Persistence:**
- **FR-011**: System MUST save self-assessments to `evals/results/{domain}/{tool-name}-result.json`
- **FR-012**: Result files MUST contain only the self-assessment JSON (no surrounding markdown)
- **FR-013**: Result filenames MUST use tool display name (e.g., `app-list-result.json` for `mcp__mittwald__mittwald_app_list`)
- **FR-014**: System MUST create domain subdirectories in `evals/results/` as needed

**Result Aggregation:**
- **FR-015**: System MUST run aggregation scripts after all evals complete
- **FR-016**: Coverage report MUST include metrics: total tools (116), executed count, success count, failure count, success rate
- **FR-017**: Coverage report MUST include domain breakdown (per-domain success rates)
- **FR-018**: Coverage report MUST include tier breakdown (per-tier success rates)
- **FR-019**: Coverage report MUST categorize failures by problem type (auth_error, api_error, dependency_missing, etc.)
- **FR-020**: If aggregation scripts need updates, changes MUST maintain backward compatibility with feature 010/013 formats

### Key Entities

**WorkPackage:**
- `domain`: Domain name (e.g., "apps", "databases")
- `tier_order`: Array of tiers present in this domain (e.g., [0, 4])
- `eval_prompts`: Array of eval prompt objects
- `total_evals`: Count of evals in this WP
- `file_path`: Path to WP markdown file

**EvalPrompt:**
- `tool_name`: MCP tool name (e.g., "mcp__mittwald__mittwald_app_list")
- `display_name`: Short name (e.g., "app/list")
- `tier`: Dependency tier (0-4)
- `prompt_text`: Full markdown instructions for agent
- `dependencies`: Array of prerequisite tool names
- `success_indicators`: Expected outcomes

**SelfAssessment** (reused from feature 010):
- `success`: Boolean pass/fail
- `confidence`: "high" | "medium" | "low"
- `tool_executed`: MCP tool name that was called
- `timestamp`: ISO 8601 timestamp
- `problems_encountered`: Array of problem objects (type, description)
- `resources_created`: Array of created resources (type, id, name, verified)
- `tool_response_summary`: Brief description of tool output
- `execution_notes`: Freeform observations

**CoverageReport:**
- `total_tools`: 116
- `executed_count`: How many evals ran
- `success_count`: Passed evals
- `failure_count`: Failed evals
- `success_rate`: Percentage
- `domain_breakdown`: Per-domain stats
- `tier_breakdown`: Per-tier stats
- `problem_summary`: Count by problem type

---

## Success Criteria

1. **Complete Execution**: All 116 evals executed during this feature's implementation
2. **Result Capture**: 100% of evals have self-assessments saved to `evals/results/{domain}/{tool}-result.json`
3. **Schema Compliance**: 100% of self-assessments contain all required fields (success, confidence, tool_executed, timestamp, problems_encountered, resources_created, tool_response_summary, execution_notes)
4. **Coverage Report Generated**: Aggregation scripts produce coverage-report.json and baseline-report.md
5. **Domain Breakdown**: Coverage report shows per-domain metrics (tool count, success count, success rate) for all 12 domains
6. **Tier Breakdown**: Coverage report shows per-tier metrics for tiers 0-4
7. **Problem Categorization**: Coverage report categorizes failures by type (auth_error, api_error, dependency_missing, etc.)
8. **Baseline Established**: Post-014 baseline documented and ready for future comparison
9. **Direct Tool Calls**: 100% of eval prompts explicitly instruct agents to CALL MCP tools (not write scripts)
10. **Tier Ordering**: Evals within each domain WP are ordered by tier (0 → 4)

---

## Assumptions

- Feature 013's 116 eval prompt JSON files are complete and valid
- Feature 010's aggregation scripts (`extract-self-assessment.ts`, `generate-coverage-report.ts`) exist and are functional
- Spec Kitty's `/spec-kitty.implement` command works for executing WP files
- Agents executing WPs have access to `mittwald-mcp-fly2.fly.dev` via OAuth
- Domain classification from feature 013 is stable (12 domains)
- Tier classification (0-4) is documented in eval prompt JSON metadata
- Self-assessment schema from feature 010 is still valid

---

## Dependencies

- Feature 013: Provides 116 eval prompt JSON files organized by domain
- Feature 010: Provides aggregation infrastructure (extraction, coverage reporting)
- Spec Kitty: Provides `/spec-kitty.implement` command for WP execution
- MCP Server: Deployed at `mittwald-mcp-fly2.fly.dev` with 116 tools
- OAuth Bridge: Enables agent authentication to MCP server

---

## Out of Scope

- Langfuse platform integration (import/export deferred to future work)
- New fixture creation beyond feature 010/013 fixtures (reuse existing)
- MCP server bug fixes discovered during eval execution (documented for future features)
- Performance optimization of eval execution (focus is correctness and baseline establishment)
- Eval prompts for tools added after feature 014 completes (future work)
- Automated retry logic for failed evals (manual investigation required)
- Real-time progress dashboard (existing status tracker sufficient)

---

## Key Concepts & Terminology

- **Work Package (WP)**: A Spec Kitty task file containing eval prompts for a domain, executable via `/spec-kitty.implement`
- **Eval Prompt**: Instructions for testing a specific MCP tool, including goal, context, and self-assessment format
- **Self-Assessment**: Agent's structured evaluation of eval success, problems encountered, and resources used
- **Domain**: Functional grouping of MCP tools (apps, databases, identity, etc.)
- **Tier**: Dependency depth classification (Tier 0 = no dependencies, Tier 4 = complex dependencies)
- **Aggregation**: Process of collecting individual self-assessments into coverage reports
- **Baseline**: Reference snapshot of eval results for future comparison
- **Direct Tool Call**: Agent invokes MCP tool via function call (not writing a script to call the tool)
