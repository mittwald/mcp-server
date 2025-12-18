# Implementation Plan: Agent-Based MCP Tool Evaluation

**Branch**: `013-agent-based-mcp-tool-evaluation` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)

## Summary

Update the eval suite for the post-012 MCP server architecture by (1) discovering the current tool inventory (115 tools vs feature 010's 175), (2) reconciling eval prompts to match current reality, (3) ensuring prompts instruct agents to CALL MCP tools directly (not write scripts), (4) formatting all evals as Langfuse-importable documents for future platform integration.

## Technical Context

| Decision | Choice | Source |
|----------|--------|--------|
| **Current Tool Count** | 115 tools across 19 domains | MCP server query (2025-12-18) |
| **Baseline Tool Count** | 175 tools from feature 010 | Feature 010 research.md |
| **Tool Reduction** | 60 tools removed/consolidated | Feature 012 CLI-to-library conversion |
| **Langfuse Schema** | Reuse feature 010 format: `input` (prompt, tool_name, context), `expectedOutput=null`, `metadata` (domain, tier) | Feature 010 D-001 |
| **Self-Assessment** | JSON schema with marker extraction (`<!-- SELF_ASSESSMENT_START/END -->`) | Feature 010 D-003 |
| **Execution Model** | Manual agent spawning by user; agents execute via `/spec-kitty.implement` on WP prompt files | User confirmation |
| **Agent Instructions** | Prompts MUST instruct agents to CALL MCP tools directly, NOT write automation scripts | User clarification |
| **Discovery Approach** | Both MCP server live query AND feature 012 analysis | User confirmation |
| **Langfuse Platform** | NOT in scope - only creating importable document format | User confirmation |

## Constitution Check

No project constitution is defined. Proceeding with standard engineering practices:
- TypeScript for tooling scripts
- JSON for eval prompt format (Langfuse-compatible)
- Markdown for documentation
- Reuse feature 010 infrastructure where applicable

## Quality Gates

### Before Reconciliation
- [x] Current tool inventory captured (115 tools confirmed)
- [ ] Feature 010 baseline understood (175 tools, existing prompts)
- [ ] Diff analysis completed (removed, renamed, new tools identified)
- [ ] Reconciliation strategy defined (update/archive/create prompts)

### Before Prompt Updates
- [ ] Feature 010 eval prompt format validated
- [ ] Self-assessment schema confirmed unchanged
- [ ] Prompt template reviewed for "CALL tools" emphasis (not "write scripts")
- [ ] Sample updated prompt tested manually

### Before Completion
- [ ] 100% of 115 current tools have valid eval prompts
- [ ] All prompts formatted as Langfuse-importable JSON
- [ ] Archived prompts for removed tools moved to `_archived/`
- [ ] Tool inventory documentation complete
- [ ] Agent execution guidance created (how to use WP prompts)

---

## Phase 0: Research & Discovery

### 0.1 Tool Inventory Discovery

**Output**: `research.md` with tool inventory analysis

**Completed**:
- ✅ Query mittwald MCP server: 115 tools confirmed
- ✅ Review feature 012 documentation
- ✅ Compare against feature 010 baseline: 175 tools
- ✅ Calculate delta: 60 tools removed/consolidated

**Remaining**:
- [ ] Generate detailed diff report (removed, renamed, new tools)
- [ ] Map old tool names to new tool names (renames/consolidations)
- [ ] Document rationale for tool changes (from feature 012)

### 0.2 Feature 010 Eval Infrastructure Review

**Output**: Documented understanding of reusable infrastructure

- [ ] Review feature 010's eval prompt format and template
- [ ] Validate self-assessment schema is still applicable
- [ ] Identify any infrastructure scripts to reuse (extraction, validation)
- [ ] Document dependency tier classification approach

---

## Phase 1: Design & Reconciliation

### 1.1 Diff Analysis & Reconciliation Strategy

**Output**: `data-model.md` with reconciliation plan

**Entities**:
- **ToolInventoryDiff**: Removed tools, renamed tools, new tools, unchanged tools
- **ReconciliationAction**: Update prompt, archive prompt, create new prompt
- **EvalPrompt**: Langfuse-compatible format (reuse feature 010 structure)
- **AgentWorkPackage**: WP prompt file for agent execution

**Analysis**:
- [ ] Categorize 60 removed tools by domain
- [ ] Identify renamed/consolidated tools (mapping table)
- [ ] Identify new tools not in feature 010 baseline
- [ ] Define reconciliation actions for each category

### 1.2 Eval Prompt Template Update

**Output**: `contracts/eval-prompt-template.md`

**Critical Update**: Ensure template emphasizes CALLING MCP tools, not writing scripts:

```markdown
## Task
Execute the `{tool_name}` MCP tool directly with appropriate parameters.

**IMPORTANT**: You must CALL the MCP tool directly. Do NOT write a script or automation to simulate the tool call.

### Steps:
1. Verify prerequisites are in place (or establish them if needed)
2. **CALL** `{tool_name}` using the MCP tool interface
3. Verify the operation succeeded by checking the response
4. Record the outcome in your self-assessment

### How to Execute:
Use the MCP tool directly:
- Claude Code: Tool will be available in your tool list
- Provide parameters as specified in the tool schema
- Observe the actual response from the production server
```

### 1.3 Agent Execution Guidance

**Output**: `quickstart.md`

**Purpose**: Instruct future agents (or users spawning agents) how to execute eval WPs

- [ ] Explain WP prompt structure (eval instructions embedded)
- [ ] Clarify agent should `/spec-kitty.implement` on WP file
- [ ] Emphasize "call tool directly" vs "write script"
- [ ] Document self-assessment requirement
- [ ] Provide example agent workflow

---

## Phase 2: Prompt Reconciliation (By Action Type)

### 2.1 Archive Removed Tools

**Output**: `evals/prompts/_archived/` with moved prompts

For each of the ~60 removed tools:
- [ ] Move existing prompt from feature 010 to `_archived/` directory
- [ ] Add archive metadata (date, reason, feature that removed it)
- [ ] Update inventory tracking

### 2.2 Update Prompts for Renamed/Changed Tools

**Output**: Updated prompts in `evals/prompts/{domain}/`

For tools that were renamed or had parameter changes:
- [ ] Update tool_name references (MCP name, display name)
- [ ] Update parameter examples if schema changed
- [ ] Verify success indicators still valid
- [ ] Re-apply "CALL tool directly" emphasis

### 2.3 Create Prompts for New Tools

**Output**: New prompts in `evals/prompts/{domain}/`

For tools that didn't exist in feature 010:
- [ ] Identify new tools from diff analysis
- [ ] Generate prompts following feature 010 template
- [ ] Classify by domain and tier
- [ ] Define dependencies and success indicators

### 2.4 Validate Unchanged Tools

**Output**: Validation report

For tools unchanged from feature 010:
- [ ] Verify existing prompts are still valid
- [ ] Check parameter schemas match current implementation
- [ ] Ensure "CALL tool directly" language is clear
- [ ] Update metadata if needed (tier, domain)

---

## Phase 3: Coverage Validation & Baseline

### 3.1 Coverage Verification

**Output**: Coverage report

- [ ] Count prompts: should match 115 current tools
- [ ] Verify no orphaned prompts (tools that don't exist)
- [ ] Check domain distribution matches current tool distribution
- [ ] Validate Langfuse format for all prompts

### 3.2 Dependency Tier Classification

**Output**: Tier analysis for 115 tools

Reuse feature 010's tier approach, updated for current tools:
- Tier 0: No dependencies
- Tier 1: Organization-level
- Tier 2: Server-level
- Tier 3: Project creation
- Tier 4: Requires project

- [ ] Classify all 115 tools by tier
- [ ] Update dependency graph if needed
- [ ] Document execution order recommendations

### 3.3 Baseline Documentation

**Output**: Updated `research.md`, `data-model.md`

- [ ] Document post-012 tool inventory (115 tools)
- [ ] Record reconciliation actions taken
- [ ] Establish this as "post-012 baseline" for future comparison
- [ ] Link to feature 010 for historical context

---

## File Structure

```
kitty-specs/013-agent-based-mcp-tool-evaluation/
├── spec.md
├── plan.md                    # This file
├── tasks.md                   # Work package definitions (created by /spec-kitty.tasks)
├── research.md                # Tool inventory & diff analysis
├── data-model.md              # Entities & reconciliation plan
├── quickstart.md              # Agent execution guidance
└── contracts/
    └── eval-prompt-template.md

evals/                         # Main output directory (existing from feature 010)
├── prompts/
│   ├── _archived/             # Prompts for removed tools (60 tools)
│   ├── app/                   # 8 tools
│   ├── backup/                # 8 tools
│   ├── certificate/           # 2 tools
│   ├── context/               # 3 tools
│   ├── conversation/          # 5 tools
│   ├── cronjob/               # 9 tools
│   ├── database/              # 14 tools
│   ├── domain/                # 9 tools
│   ├── mail/                  # 10 tools
│   ├── organization/          # 7 tools
│   ├── project/               # 10 tools
│   ├── server/                # 2 tools
│   ├── ssh/                   # 4 tools
│   ├── user/                  # 12 tools
│   └── ... (other domains)
└── inventory/
    ├── tools-current.json     # 115 tools (post-012)
    ├── tools-baseline.json    # 175 tools (feature 010)
    ├── diff-report.json       # Reconciliation analysis
    └── tier-analysis.md       # Updated tier classification
```

---

## Work Package Strategy

Work packages will be organized by reconciliation action type:
- **WP01-05**: Research & Discovery (inventory, diff, infrastructure review)
- **WP06-10**: Archive removed tool prompts (by domain batch)
- **WP11-15**: Update renamed/changed tool prompts (by domain batch)
- **WP16-20**: Create new tool prompts (by domain batch)
- **WP21-25**: Validate unchanged prompts (spot checks by domain)
- **WP26-30**: Coverage verification, tier classification, baseline documentation

**Note**: Actual WP generation happens via `/spec-kitty.tasks` command (NOT this planning phase).

---

## Success Criteria Mapping

| Success Criterion | Implementation Approach |
|-------------------|------------------------|
| SC-1: 100% tool coverage | Count prompts (115) = count current tools (115) |
| SC-2: Execution model | Prompts instruct "CALL tool directly", WP structure enables `/spec-kitty.implement` |
| SC-3: Quality threshold | Post-implementation goal (not planning phase deliverable) |
| SC-4: Results organization | Reuse feature 010 session log structure |
| SC-5: Dependency ordering | Tier classification (0-4) documented |
| SC-6: Baseline establishment | This feature establishes "post-012 baseline" |
| SC-7: Fixture validation | Fixture strategy deferred to execution phase |
| SC-8: Bug fixes | Iterative execution phase (post-implementation) |
| SC-9: Repeatability | Eval prompts are reusable for future runs |
| SC-10: Documentation | Inventory, diff report, tier analysis, quickstart |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-18 | Initial plan created | Claude |
