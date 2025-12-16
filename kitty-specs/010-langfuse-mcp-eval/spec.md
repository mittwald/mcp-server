# Feature Specification: Langfuse MCP Eval Suite

**Feature Branch**: `010-langfuse-mcp-eval`
**Created**: 2025-12-16
**Status**: Draft
**Input**: Create a comprehensive evaluation suite for the Mittwald MCP server with Langfuse-compatible eval prompts for all ~174 tools across 10 domains. Research Langfuse eval format, map MCP tool dependencies, write eval prompts, standardize LLM self-assessment capture, and manually execute the full suite to establish baseline results. Leverage existing sprint 005-009 session log processing infrastructure.

## Research Questions & Scope

### Primary Research Question
What is the correct Langfuse dataset/eval format structure so that eval prompts and results can be imported into Langfuse in a future sprint?

### Sub-Questions
1. What fields does Langfuse expect in an eval dataset (input, expected output, metadata)?
2. How should eval prompts be structured for MCP tool testing?
3. What is the complete dependency chain for each of the ~174 MCP tools?

### Scope
- **In Scope**:
  - Langfuse eval format research and documentation
  - Complete MCP tool dependency mapping for all ~174 tools
  - Eval prompt creation in Langfuse-compatible format
  - LLM self-assessment capture standardization
  - Manual execution of full eval suite
  - Baseline result collection using existing infrastructure
- **Out of Scope**:
  - Formal scoring criteria/expected results definition (deferred to future sprint)
  - Automated Langfuse import pipeline
  - Automated scoring based on self-assessments

### Expected Outcomes
- Langfuse format documentation for future import
- Complete tool dependency graph (JSON + visual)
- ~174 eval prompts in Langfuse-compatible format
- Standardized self-assessment schema
- Baseline execution results for all tools

## User Scenarios & Testing

### User Story 1 - Langfuse Format Research (Priority: P1)

A developer needs to understand the Langfuse eval dataset format so that all eval prompts created in this sprint can be imported into Langfuse in a future sprint without modification.

**Why this priority**: Without understanding the target format, all subsequent work risks being incompatible.

**Independent Test**: Create a sample eval entry and verify it matches Langfuse's expected schema.

**Acceptance Scenarios**:

1. **Given** Langfuse documentation is available, **When** the format is researched, **Then** a documented schema is produced showing required and optional fields.
2. **Given** the schema is documented, **When** a sample eval prompt is created, **Then** it validates against the documented schema structure.

---

### User Story 2 - Tool Dependency Mapping (Priority: P1)

A test operator needs to understand what prerequisites must exist before each MCP tool can be successfully invoked. For example, `backup/restore` requires an existing backup, which requires a database, which requires a project.

**Why this priority**: Evals cannot succeed without understanding and establishing prerequisites.

**Independent Test**: Select a complex tool (e.g., `backup/restore`) and verify its complete dependency chain is documented.

**Acceptance Scenarios**:

1. **Given** the MCP server exposes ~174 tools, **When** dependency analysis completes, **Then** each tool has a documented list of prerequisite tools/resources.
2. **Given** tool dependencies are mapped, **When** exported to JSON, **Then** the dependency graph can be traversed programmatically.
3. **Given** the dependency graph exists, **When** visualized, **Then** operators can see the full chain for any tool.

---

### User Story 3 - Eval Prompt Creation (Priority: P1)

A test operator needs eval prompts for all ~174 MCP tools, written in Langfuse-compatible format, that test actual functionality on Mittwald infrastructure.

**Why this priority**: The eval prompts are the core deliverable of this sprint.

**Independent Test**: Pick an eval prompt and verify it: (a) follows Langfuse format, (b) includes necessary context for dependencies, (c) can be executed by Claude Code.

**Acceptance Scenarios**:

1. **Given** a tool is identified, **When** its eval prompt is created, **Then** the prompt includes: goal statement, required context, success indicators, and dependency setup instructions.
2. **Given** eval prompts exist, **When** stored on disk, **Then** they follow the Langfuse dataset schema structure.
3. **Given** an eval prompt, **When** an LLM executes it, **Then** the prompt is self-contained enough for the LLM to complete the task.

---

### User Story 4 - LLM Self-Assessment Capture (Priority: P1)

After executing each eval, the LLM must provide a structured self-assessment of success/failure and problems encountered. This data informs future Langfuse scoring criteria.

**Why this priority**: Without standardized self-assessment, baseline data is inconsistent and unusable for future scoring.

**Independent Test**: Execute an eval and verify the LLM outputs a self-assessment matching the defined schema.

**Acceptance Scenarios**:

1. **Given** an eval prompt, **When** it includes self-assessment instructions, **Then** the LLM outputs a structured assessment at completion.
2. **Given** the self-assessment schema is defined, **When** multiple evals run, **Then** all assessments follow the same structure.
3. **Given** self-assessments are captured, **When** stored, **Then** they can be parsed programmatically for analysis.

---

### User Story 5 - Full Suite Execution (Priority: P2)

A test operator manually executes all ~174 evals to establish baseline results, using the existing session log infrastructure from sprints 005-009.

**Why this priority**: Execution validates the evals work and produces the baseline dataset.

**Independent Test**: Execute a subset of evals (e.g., one domain) and verify results are captured in the manifest.

**Acceptance Scenarios**:

1. **Given** eval prompts exist for all tools, **When** executed via the existing test harness, **Then** results are captured in the JSONL manifest.
2. **Given** sessions complete, **When** session logs are processed, **Then** self-assessments are extracted and stored.
3. **Given** all evals complete, **When** coverage is queried, **Then** all ~174 tools show execution status.

---

### User Story 6 - Domain-Organized Execution (Priority: P2)

Evals are organized by the 10 functional domains, allowing operators to execute and review results by domain.

**Why this priority**: Organized execution enables systematic progress tracking.

**Independent Test**: Execute all evals in one domain and verify domain-level coverage reporting.

**Acceptance Scenarios**:

1. **Given** tools are grouped into 10 domains, **When** evals are created, **Then** each eval is tagged with its domain.
2. **Given** domain-tagged evals, **When** execution runs by domain, **Then** progress can be tracked per domain.
3. **Given** a domain completes, **When** results are queried, **Then** domain-specific success/failure rates are visible.

---

### Edge Cases

- **Tool with no dependencies (e.g., `user/get`)**: Mark as "Tier 0" with empty dependency list; can be executed without setup.
- **Circular dependencies**: Should not exist; if detected, document as a bug in dependency mapping.
- **Tool requires resource from another domain**: Document cross-domain dependency explicitly.
- **Mittwald API temporarily unavailable**: Existing harness handles retry/backoff; eval marked as `interrupted` if unrecoverable.
- **LLM fails to provide self-assessment**: Prompt design must enforce assessment output; if missing, log as incomplete.

## Requirements

### Functional Requirements

**Research & Documentation:**
- **FR-001**: System MUST document Langfuse eval dataset schema (fields, types, required vs optional)
- **FR-002**: System MUST provide sample Langfuse-compatible eval entry as reference
- **FR-003**: System MUST document how Langfuse imports datasets for future reference

**Dependency Mapping:**
- **FR-004**: System MUST analyze all ~174 MCP tools for prerequisites
- **FR-005**: System MUST produce a dependency graph in JSON format (adjacency list)
- **FR-006**: System MUST classify tools into tiers (Tier 0 = no dependencies, Tier N = depends on Tier N-1)
- **FR-007**: System MUST document cross-domain dependencies explicitly
- **FR-008**: System MUST produce a visual dependency graph (DOT format for Graphviz)

**Eval Prompt Structure:**
- **FR-009**: Each eval prompt MUST follow Langfuse dataset schema structure
- **FR-010**: Each eval prompt MUST include: goal, context, success indicators
- **FR-011**: Each eval prompt MUST reference its dependency chain
- **FR-012**: Each eval prompt MUST include self-assessment instructions
- **FR-013**: Eval prompts MUST be stored in a structured directory by domain
- **FR-014**: Eval prompts MUST be machine-readable (JSON or JSONL format)

**Self-Assessment Schema:**
- **FR-015**: System MUST define a standardized self-assessment schema
- **FR-016**: Self-assessment MUST include: success (boolean), confidence (high/medium/low), problems_encountered (array), resources_created (array), resources_verified (array)
- **FR-017**: Self-assessment MUST include free-form notes field for unexpected observations
- **FR-018**: Self-assessment schema MUST be documented for future Langfuse scoring development

**Execution & Results:**
- **FR-019**: System MUST execute evals using existing test harness from sprint 005
- **FR-020**: System MUST capture session logs using existing infrastructure
- **FR-021**: System MUST extract self-assessments from session logs
- **FR-022**: System MUST aggregate results by domain
- **FR-023**: System MUST produce baseline coverage report

**Coverage:**
- **FR-024**: System MUST track eval execution status for all ~174 tools
- **FR-025**: System MUST report coverage by domain
- **FR-026**: System MUST identify any tools without evals

### Key Entities

- **EvalPrompt**: A Langfuse-compatible eval definition (tool_name, domain, prompt_text, dependencies, metadata)
- **DependencyGraph**: Directed graph of tool prerequisites (nodes = tools, edges = "requires")
- **SelfAssessment**: Structured LLM output after eval execution (success, confidence, problems, resources, notes)
- **EvalResult**: Combination of EvalPrompt + execution session + SelfAssessment
- **ToolTier**: Classification of tools by dependency depth (Tier 0-4)

**Domain Classification** (10 domains from sprint 005):
- identity
- organization
- project-foundation
- apps
- containers
- databases
- domains-mail
- access-users
- automation
- backups

## Success Criteria

### Measurable Outcomes

- **SC-001**: Langfuse dataset format is documented with all required fields identified
- **SC-002**: Dependency graph covers all ~174 tools with no orphaned nodes
- **SC-003**: All ~174 tools have a corresponding eval prompt in Langfuse-compatible format
- **SC-004**: Self-assessment schema is defined and documented
- **SC-005**: All ~174 evals are executed with results captured
- **SC-006**: Self-assessments are extracted from 100% of completed sessions
- **SC-007**: Coverage report shows execution status for all tools across all 10 domains
- **SC-008**: Baseline dataset is ready for future Langfuse import (format validated)

## Assumptions

- The existing test harness from sprint 005 is functional and can be reused
- The Mittwald project used for testing has sufficient quota for all operations
- Langfuse's dataset format is stable and documented publicly
- Session log parser from sprint 006 can extract self-assessment content
- MCP server tools have not changed significantly since sprint 005 inventory

## Key Concepts & Terminology

- **Langfuse**: An open-source LLM engineering platform for tracing, evals, and prompt management
- **Eval Prompt**: A structured prompt designed to test a specific capability, formatted for eval framework import
- **Self-Assessment**: The executing LLM's own evaluation of task success and problems encountered
- **Dependency Chain**: The ordered sequence of tools/resources that must exist before a target tool can succeed
- **Tool Tier**: Classification based on dependency depth (Tier 0 = foundational, Tier 4 = most dependent)
- **Baseline Results**: Initial execution outcomes used to inform future scoring criteria
