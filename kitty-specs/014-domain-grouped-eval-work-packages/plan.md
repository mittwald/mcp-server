# Implementation Plan: Domain-Grouped Eval Work Packages

**Branch**: `014-domain-grouped-eval-work-packages` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)

## Summary

Execute all 116 MCP tool evals by generating 12 domain-grouped Work Package files, running them via `/spec-kitty.implement`, and aggregating results into a comprehensive baseline report. Generate WP files automatically during task generation using a TypeScript script that extracts eval prompts from existing JSON files (grouped by domain, ordered by tier). Agents execute WPs calling live MCP tools, saving self-assessments inline to disk. Aggregate results using feature 010's existing scripts to establish the post-014 baseline.

## Technical Context

| Decision | Choice | Source |
|----------|--------|--------|
| **Language/Version** | TypeScript (Node.js) | Existing eval infrastructure from feature 010 |
| **Primary Dependencies** | Node.js fs module, existing feature 010 aggregation scripts | Reuse existing infrastructure |
| **Storage** | File system (`evals/prompts/` for input, `evals/results/` for output) | Feature 013 structure |
| **Testing** | Manual execution validation (run sample WP, verify results saved) | Simple feature, no unit tests needed |
| **Target Platform** | macOS/Linux (developer workstation) | Local execution environment |
| **Project Type** | Single (eval infrastructure) | Extends existing eval system |
| **Performance Goals** | WP generation <5 seconds, eval execution depends on MCP server response time | Not performance-critical |
| **Constraints** | Must preserve existing JSON structure, maintain feature 010 schema compatibility | Backward compatibility |
| **Scale/Scope** | 116 tools across 12 domains, 5 tiers (0-4) | Fixed scope from feature 013 |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ No project constitution defined

**Standard Engineering Practices Applied**:
- TypeScript for tooling scripts (consistent with feature 010)
- Markdown for WP files (Spec Kitty standard)
- JSON for eval data (feature 010/013 standard)
- File-based storage for results (simple, auditable)

**No Violations**: Feature follows existing patterns from features 010 and 013.

## Project Structure

### Documentation (this feature)

```
kitty-specs/014-domain-grouped-eval-work-packages/
├── spec.md              # Feature specification
├── plan.md              # This file (/spec-kitty.plan output)
├── research.md          # Phase 0 output (if needed)
├── data-model.md        # Phase 1 output
├── tasks/               # Phase 2 output (/spec-kitty.tasks)
│   ├── WP-01-access-users.md
│   ├── WP-02-apps.md
│   ├── WP-03-automation.md
│   ├── WP-04-backups.md
│   ├── WP-05-containers.md
│   ├── WP-06-context.md
│   ├── WP-07-databases.md
│   ├── WP-08-domains-mail.md
│   ├── WP-09-identity.md
│   ├── WP-10-misc.md
│   ├── WP-11-organization.md
│   ├── WP-12-project-foundation.md
│   └── WP-13-aggregate-results.md
└── tasks.md             # Task overview (/spec-kitty.tasks output)
```

### Source Code (repository root)

```
evals/
├── prompts/                          # Input: Feature 013 eval JSON files
│   ├── access-users/*.json           # 7 tools
│   ├── apps/*.json                   # 8 tools
│   ├── automation/*.json             # 9 tools
│   ├── backups/*.json                # 8 tools
│   ├── containers/*.json             # 10 tools
│   ├── context/*.json                # 3 tools
│   ├── databases/*.json              # 14 tools
│   ├── domains-mail/*.json           # 22 tools
│   ├── identity/*.json               # 13 tools
│   ├── misc/*.json                   # 5 tools
│   ├── organization/*.json           # 7 tools
│   └── project-foundation/*.json     # 10 tools
│
├── results/                          # Output: Self-assessments saved here
│   ├── access-users/*.json
│   ├── apps/*.json
│   ├── automation/*.json
│   ├── backups/*.json
│   ├── containers/*.json
│   ├── context/*.json
│   ├── databases/*.json
│   ├── domains-mail/*.json
│   ├── identity/*.json
│   ├── misc/*.json
│   ├── organization/*.json
│   ├── project-foundation/*.json
│   ├── coverage-report.json          # Aggregated metrics
│   └── baseline-report.md            # Human-readable baseline
│
└── scripts/                          # Feature 010 aggregation scripts (reused)
    ├── extract-self-assessment.ts    # Extracts self-assessments from results
    └── generate-coverage-report.ts   # Generates coverage reports
```

**Structure Decision**: Extends existing `evals/` directory structure from features 010 and 013. WP files are generated as task files (in feature tasks/ directory), not as permanent artifacts in evals/. Results are persisted in evals/results/ for aggregation.

## Parallel Work Analysis

**Sequential Execution Required**: This feature executes evals in dependency order:

1. **Tier 0 tools** (no dependencies): identity, organization, context - can run in parallel
2. **Tier 1-3 tools** (organizational/project setup): Must run after tier 0
3. **Tier 4 tools** (require project): Must run after project creation

**Work Distribution**:
- **Phase 0 (Setup)**: Generate all 12 WP files via script (automated, ~1 minute)
- **Phase 1 (Tier 0)**: Execute identity, organization, context WPs in parallel (~3 WPs, ~30 min)
- **Phase 2 (Tier 1-3)**: Execute project-foundation WP (creates project for tier 4)
- **Phase 3 (Tier 4)**: Execute remaining 8 domain WPs (can run in parallel once project exists)
- **Phase 4 (Aggregation)**: Run aggregation scripts on all results

**Agent Assignments**: User manually executes WPs via `/spec-kitty.implement`. No multi-agent parallelization.

---

## Phase 0: Research

**Status**: ✅ No research needed

**Rationale**:
- WP generation approach confirmed (TypeScript script)
- Self-assessment persistence confirmed (inline save during execution)
- Aggregation approach confirmed (reuse feature 010 scripts)
- All technology choices use existing infrastructure
- JSON structure well-defined from feature 013
- Feature 010 aggregation scripts already validated

**Skipping research.md generation** - all technical decisions made during planning interrogation.

---

## Phase 1: Design & Contracts

### Data Model

See `data-model.md` for:
- WorkPackage structure (domain, tier_order, eval_prompts)
- EvalPrompt structure (tool_name, display_name, tier, prompt_text)
- SelfAssessment schema (reused from feature 010)
- CoverageReport structure

### API Contracts

**N/A** - This feature has no API contracts. Interactions are:
- File system (read JSON files, write result files)
- Spec Kitty CLI (`/spec-kitty.implement`)
- Feature 010 scripts (command-line invocation)

### Quickstart

See `quickstart.md` for:
- How to generate WP files
- How to execute WPs
- How to run aggregation
- How to interpret baseline report

---

## Quality Gates

### Before Phase 2 (Task Generation)

- [x] All planning questions answered
- [x] Technical context complete
- [x] Constitution check passed
- [x] Data model documented
- [x] No research blockers

**Status**: ✅ Ready for `/spec-kitty.tasks`

---

## Implementation Notes

**WP Generation Strategy**:
- Script reads all JSON files in `evals/prompts/{domain}/`
- Sorts by `metadata.tier` (ascending)
- Extracts `input.prompt` field
- Generates markdown WP file with structure:
  ```markdown
  # Eval: {domain}

  Execute all {domain} domain evals in tier order.

  ## Tier 0
  [eval prompts]

  ## Tier 4
  [eval prompts]

  **CRITICAL**: After EACH eval, save self-assessment to:
  `evals/results/{domain}/{tool-name}-result.json`
  ```

**Self-Assessment Inline Save**:
- Each eval prompt includes instruction: "After completing this eval, immediately save the self-assessment JSON to `evals/results/{domain}/{tool-name}-result.json`"
- Agent writes result file before moving to next eval
- No batch save at end (prevents data loss if execution interrupted)

**Aggregation**:
- After all WPs execute, run `npx tsx evals/scripts/generate-coverage-report.ts`
- Reads all `evals/results/*/*.json` files
- Produces `coverage-report.json` and `baseline-report.md`
- Feature 010 scripts already handle this structure

**Success Validation**:
- Count files in `evals/results/`: Should be 116 JSON files
- Run coverage report: Should show 116/116 tools executed
- Inspect baseline-report.md: Should show success rates and problem categorization
