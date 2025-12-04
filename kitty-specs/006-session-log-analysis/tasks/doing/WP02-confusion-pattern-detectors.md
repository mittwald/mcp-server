---
work_package_id: "WP02"
subtasks:
  - "T009"
  - "T010"
  - "T011"
  - "T012"
  - "T013"
  - "T014"
  - "T015"
  - "T016"
  - "T017"
  - "T018"
title: "Confusion Pattern Detectors"
phase: "Phase 1 - Foundation"
lane: "doing"
assignee: "codex"
agent: "codex"
shell_pid: "70994"
history:
  - timestamp: "2025-12-04T18:30:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-04T20:12:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "29594"
    action: "Started implementation"
  - timestamp: "2025-12-04T19:19:33Z"
    lane: "planned"
    agent: "codex"
    shell_pid: "50769"
    action: "Returned for review fixes (severity scoring gaps, stuck indicator false positives, exploration coverage)"
  - timestamp: "2025-12-04T19:40:46Z"
    lane: "doing"
    agent: "codex"
    shell_pid: "70994"
    action: "Started implementation"
---

# Work Package Prompt: WP02 – Confusion Pattern Detectors

## Objectives & Success Criteria

- Implement 6 confusion pattern detectors
- Calculate severity scores for each incident
- Output `analysis-output/incidents.json` with all categorized incidents
- Detect at least 3 patterns in known-confusing session `0616a506-15b4-466f-9793-44ceebe2a82f`

**Success Metrics**:
- All 6 pattern types implemented and functional
- Known confusing session flags ≥3 patterns
- Severity scores calculated for all incidents
- incidents.json contains properly structured data

## Context & Constraints

- **Input**: Parsed sessions from WP01 (corpus-index.json or in-memory)
- **Output**: `tests/functional/analysis-output/incidents.json`
- **Depends on**: WP01 (Parser & Indexer)
- **Related docs**: [plan.md](../../plan.md), [data-model.md](../../data-model.md), [spec.md](../../spec.md) FR-021 through FR-028

### Known Confusing Session Example
Session `0616a506-15b4-466f-9793-44ceebe2a82f.jsonl` exhibits:
1. **wrong-tool-selection**: Used SlashCommand for `/mcp__mittwald__...`
2. **capability-mismatch**: WebSearch failed on Haiku model
3. **unnecessary-delegation**: Spawned Task agent for tool lookup
4. **exploration-waste**: Multiple Glob/Read before finding tool

## Subtasks & Detailed Guidance

### T009 – Create detector module structure
- **Purpose**: Establish detector module layout.
- **Steps**:
  1. Create `tests/functional/src/analysis/detectors/` directory
  2. Create files: `index.ts`, `wrong-tool.ts`, `retry-loop.ts`, `unnecessary-delegation.ts`, `stuck-indicator.ts`, `capability-mismatch.ts`, `exploration-waste.ts`
- **Files**: `tests/functional/src/analysis/detectors/*`
- **Parallel?**: No

### T010 – Implement detector orchestrator in index.ts
- **Purpose**: Run all detectors and aggregate results.
- **Steps**:
  1. Create `tests/functional/src/analysis/detectors/index.ts`
  2. Import all 6 detector functions
  3. Implement `detectAllPatterns(sessions: Session[]): IncidentReport`
  4. For each session, run all detectors, collect Incident[]
  5. Aggregate: byType counts, bySeverity counts, totalTokenWaste
- **Files**: `tests/functional/src/analysis/detectors/index.ts`
- **Interface**:
  ```typescript
  interface IncidentReport {
    incidents: Incident[];
    byType: Record<IncidentType, number>;
    bySeverity: { high: number; medium: number; low: number };
    totalTokenWaste: number;
  }
  ```

### T011 – Implement wrong-tool-selection detector
- **Purpose**: Detect when LLM used wrong tool type (FR-021).
- **Steps**:
  1. Create `tests/functional/src/analysis/detectors/wrong-tool.ts`
  2. Implement `detectWrongToolSelection(session: Session): Incident[]`
  3. Scan events for tool_use with name "SlashCommand" or "Bash"
  4. Check if input looks like MCP tool (contains `mcp__` or `/mcp__`)
  5. Create incident with: toolAttempted, toolNeeded (extract from input)
- **Files**: `tests/functional/src/analysis/detectors/wrong-tool.ts`
- **Detection Signal**: `name === "SlashCommand"` AND input contains `mcp__`
- **Severity**: tokenWaste × 2.0 (high multiplier - indicates fundamental confusion)
- **Parallel?**: Yes

### T012 – Implement retry-loop detector
- **Purpose**: Detect 3+ consecutive errors before success (FR-022).
- **Steps**:
  1. Create `tests/functional/src/analysis/detectors/retry-loop.ts`
  2. Implement `detectRetryLoop(session: Session): Incident[]`
  3. Track consecutive tool results with `is_error: true`
  4. If count ≥3 before success, create incident
  5. Record: iteration count, time between first error and success
- **Files**: `tests/functional/src/analysis/detectors/retry-loop.ts`
- **Detection Signal**: 3+ consecutive `toolUseResult.is_error === true`
- **Severity**: iterations × avgTokensPerAttempt × 1.5
- **Parallel?**: Yes

### T013 – Implement unnecessary-delegation detector
- **Purpose**: Detect Task agent spawned for simple operations (FR-023).
- **Steps**:
  1. Create `tests/functional/src/analysis/detectors/unnecessary-delegation.ts`
  2. Implement `detectUnnecessaryDelegation(session: Session): Incident[]`
  3. Find events where `name === "Task"` (sub-agent spawn)
  4. Check if task prompt is for single tool lookup/call
  5. Calculate token cost from sub-agent execution
- **Files**: `tests/functional/src/analysis/detectors/unnecessary-delegation.ts`
- **Detection Signal**: `name === "Task"` with prompt containing single tool name
- **Severity**: subAgentTokens (from toolUseResult.totalTokens)
- **Parallel?**: Yes

### T014 – Implement stuck-indicator detector
- **Purpose**: Detect >60s gaps between tool calls (FR-024).
- **Steps**:
  1. Create `tests/functional/src/analysis/detectors/stuck-indicator.ts`
  2. Implement `detectStuckIndicator(session: Session): Incident[]`
  3. Calculate time gaps between consecutive events
  4. If gap > 60 seconds without user input, create incident
  5. Exclude gaps caused by user messages
- **Files**: `tests/functional/src/analysis/detectors/stuck-indicator.ts`
- **Detection Signal**: `timestamp[n+1] - timestamp[n] > 60000ms` between non-user events
- **Severity**: gapSeconds × 0.1 (lower multiplier - may be legitimate thinking)
- **Parallel?**: Yes

### T015 – Implement capability-mismatch detector
- **Purpose**: Detect tool failures due to model limitations (FR-025).
- **Steps**:
  1. Create `tests/functional/src/analysis/detectors/capability-mismatch.ts`
  2. Implement `detectCapabilityMismatch(session: Session): Incident[]`
  3. Scan tool results for errors containing "does not support"
  4. Also check for: "not available", "invalid_request_error" with tool type
  5. Record: tool attempted, model constraint hit
- **Files**: `tests/functional/src/analysis/detectors/capability-mismatch.ts`
- **Detection Signal**: Error message contains "does not support" OR "not support tool types"
- **Severity**: tokenWaste × 1.0
- **Parallel?**: Yes
- **Example**: `'claude-3-haiku-20240307' does not support tool types: web_search_20250305`

### T016 – Implement exploration-waste detector
- **Purpose**: Detect excessive exploration before MCP tool call (FR-026).
- **Steps**:
  1. Create `tests/functional/src/analysis/detectors/exploration-waste.ts`
  2. Implement `detectExplorationWaste(session: Session): Incident[]`
  3. Track exploratory tools: Glob, Grep, Read, WebSearch
  4. Count consecutive exploratory calls before first MCP tool
  5. If count > 3, create incident
- **Files**: `tests/functional/src/analysis/detectors/exploration-waste.ts`
- **Detection Signal**: >3 of (Glob|Grep|Read|WebSearch) before `mcp__mittwald__*`
- **Severity**: exploratoryTokens × 1.0
- **Parallel?**: Yes

### T017 – Implement severity scoring algorithm
- **Purpose**: Calculate consistent severity scores (FR-027, FR-028).
- **Steps**:
  1. Add to `tests/functional/src/analysis/detectors/index.ts`
  2. Implement `calculateSeverity(incident: Incident): SeverityLevel`
  3. Formula: `severityScore = tokenWaste × timeWasteMultiplier × typeMultiplier`
  4. Thresholds: high > 1000, medium > 100, low ≤ 100
  5. Type multipliers:
     - wrong-tool-selection: 2.0
     - retry-loop: 1.5
     - unnecessary-delegation: 1.0
     - stuck-indicator: 0.1
     - capability-mismatch: 1.0
     - exploration-waste: 1.0
- **Files**: `tests/functional/src/analysis/detectors/index.ts`

### T018 – Export incidents.json with categorized incidents
- **Purpose**: Persist incident data for downstream modules.
- **Steps**:
  1. After detection, serialize IncidentReport to JSON
  2. Write to `tests/functional/analysis-output/incidents.json`
  3. Include: incidents array, byType counts, bySeverity counts, totalTokenWaste
- **Files**: `tests/functional/analysis-output/incidents.json`
- **Schema**:
  ```json
  {
    "incidents": [
      {
        "id": "inc-001",
        "type": "wrong-tool-selection",
        "severity": "high",
        "severityScore": 1234,
        "sessionId": "0616a506-...",
        "toolAttempted": "SlashCommand",
        "toolNeeded": "mcp__mittwald__mittwald_cronjob_execution_get",
        "tokenWaste": 617,
        "timeWasteMs": 5000,
        "context": {
          "eventRange": [5, 8],
          "errorMessages": ["Unknown slash command"],
          "description": "Used SlashCommand instead of MCP tool"
        }
      }
    ],
    "byType": { "wrong-tool-selection": 45, ... },
    "bySeverity": { "high": 12, "medium": 89, "low": 234 },
    "totalTokenWaste": 45678
  }
  ```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| False positives | Start with conservative thresholds, tune later |
| Missing token data | Estimate from message length if usage absent |
| Pattern overlap | Allow same event to trigger multiple patterns |
| Performance | Early exit if session has no tool calls |

## Definition of Done Checklist

- [ ] All 10 subtasks completed
- [ ] 6 detector files created and functional
- [ ] Orchestrator aggregates all detector outputs
- [ ] Severity scoring implemented with thresholds
- [ ] incidents.json written with valid structure
- [ ] Known confusing session triggers ≥3 patterns
- [ ] Detector coverage: all 6 types can detect real incidents

## Review Guidance

- Run detectors on session `0616a506-*`, verify ≥3 patterns detected
- Spot-check 5 high-severity incidents for accuracy
- Verify severity distribution looks reasonable (not all high or all low)
- Check token waste calculations are plausible

## Review Feedback

- tests/functional/src/analysis/detectors/index.ts:72-115 plus per-detector files – Severity scoring ignores FR-028: scores come solely from per-detector tokenWaste (with small multipliers) and never factor timeWasteMs or corpus frequency. `calculateSeverity` (which includes time) is not applied, and no frequency weighting exists, so severity levels are systematically understated and non-compliant.
- tests/functional/src/analysis/detectors/stuck-indicator.ts:17-55 – Stuck detection measures any >60s gap between arbitrary events (including user→assistant), not “between tool calls without user input” (FR-024). This flags user think-time as LLM stuck. Please constrain gaps to consecutive tool events and explicitly skip user-driven pauses.
- tests/functional/src/analysis/detectors/exploration-waste.ts:14-89 – Exploration waste never fires (0 incidents) and only counts a narrow tool list. The dataset uses exploration via Task/Task agents and repeated Read/Grep; detector should tolerate interleaved non-MCP tool uses and consider task-spawned exploration so coverage criterion (“all 6 types detect real incidents”) is met.

## Activity Log

- 2025-12-04T18:30:00Z – system – lane=planned – Prompt created.
- 2025-12-04T20:12:00Z – claude – shell_pid=29594 – lane=doing – Started implementation
- 2025-12-04T20:30:00Z – claude – shell_pid=29594 – lane=doing – Completed: 224 incidents detected, 4 patterns found in confusing session
- 2025-12-04T19:19:33Z – codex – shell_pid=50769 – lane=planned – Returned with review feedback (severity formula, stuck detector scope, exploration coverage)
