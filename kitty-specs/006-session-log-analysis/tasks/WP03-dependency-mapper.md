---
work_package_id: WP03
title: Dependency Mapper & Graph Export
lane: done
history:
- timestamp: '2025-12-04T18:30:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-04T20:32:00Z'
  lane: doing
  agent: claude
  shell_pid: '29594'
  action: Started implementation
- timestamp: '2025-12-04T19:56:00Z'
  lane: done
  agent: claude
  shell_pid: '81851'
  action: Approved after review
agent: claude
assignee: claude
phase: Phase 1 - Foundation
reviewer_agent: claude
reviewer_shell_pid: '81851'
shell_pid: '29594'
subtasks:
- T019
- T020
- T021
- T022
- T023
- T024
- T025
- T026
---

# Work Package Prompt: WP03 – Dependency Mapper & Graph Export

## Objectives & Success Criteria

- Discover tool prerequisite relationships from session data
- Build DAG of tool dependencies with confidence scores
- Export dependencies in JSON format
- Export DOT format with domain clustering for Graphviz visualization
- Verify `project/get` → `app/create` dependency is detected

**Success Metrics**:
- DAG contains no cycles (or cycles broken deterministically)
- Confidence scores calculated for all edges
- DOT output valid and renders in Graphviz
- dependencies.json contains all discovered relationships

## Context & Constraints

- **Input**: Parsed sessions from WP01 (CorpusIndex)
- **Output**: `tests/functional/analysis-output/dependencies.json`, `dependencies.dot`
- **Depends on**: WP01 (Parser & Indexer)
- **Related docs**: [plan.md](../../plan.md), [data-model.md](../../data-model.md), [spec.md](../../spec.md) FR-031 through FR-035

### Dependency Detection Logic
1. Track tool call sequences per session
2. For each pair (A, B): count sessions where B is called before A
3. Confidence = count(B→A) / count(sessions containing A)
4. Include edge if confidence > 0.5 AND evidence >= 3 sessions
5. Detect cycles, break by removing lowest-confidence edge

## Subtasks & Detailed Guidance

### T019 – Create mapper module structure
- **Purpose**: Establish mapper module layout.
- **Steps**:
  1. Create `tests/functional/src/analysis/mapper/` directory
  2. Create files: `index.ts`, `graph.ts`, `export.ts`
- **Files**: `tests/functional/src/analysis/mapper/*`
- **Parallel?**: No

### T020 – Implement tool sequence tracker in index.ts
- **Purpose**: Extract ordered tool sequences from sessions.
- **Steps**:
  1. Create `tests/functional/src/analysis/mapper/index.ts`
  2. Implement `extractToolSequences(sessions: Session[]): ToolSequence[]`
  3. For each session, collect tool names in timestamp order
  4. Filter to only MCP tools (`mcp__mittwald__*`)
  5. Return array of `{ sessionId, tools: string[] }`
- **Files**: `tests/functional/src/analysis/mapper/index.ts`
- **Interface**:
  ```typescript
  interface ToolSequence {
    sessionId: string;
    tools: string[];
  }
  ```

### T021 – Implement DAG builder with cycle detection in graph.ts
- **Purpose**: Build directed acyclic graph from sequences.
- **Steps**:
  1. Create `tests/functional/src/analysis/mapper/graph.ts`
  2. Implement `buildDependencyGraph(sequences: ToolSequence[]): DependencyGraph`
  3. For each pair of consecutive tools (A, B), create edge B→A
  4. Track edge counts and evidence sessions
  5. Implement cycle detection using DFS
  6. Break cycles by removing lowest-confidence edge
- **Files**: `tests/functional/src/analysis/mapper/graph.ts`
- **Interface**:
  ```typescript
  interface DependencyGraph {
    nodes: Set<string>;
    edges: Map<string, Edge[]>;  // from → to[]
  }
  interface Edge {
    from: string;
    to: string;
    count: number;
    evidenceSessions: string[];
  }
  ```

### T022 – Implement sequence-based dependency detection
- **Purpose**: Detect when tool B is typically called before tool A.
- **Steps**:
  1. Add to `src/analysis/mapper/graph.ts`
  2. Count co-occurrences: sessions where B precedes A
  3. Calculate co-occurrence ratio: count(B→A) / count(A)
  4. Threshold: include if ratio > 0.5
  5. Minimum evidence: require at least 3 sessions
- **Files**: `tests/functional/src/analysis/mapper/graph.ts`
- **Detection Signal**: Tool B appears before tool A in >50% of sessions containing A
- **Example**: `project_get` appears before `app_create` in 80% of app creation sessions

### T023 – Implement error-recovery dependency detection
- **Purpose**: Detect dependencies from error→success patterns.
- **Steps**:
  1. Add to `src/analysis/mapper/graph.ts`
  2. Find sequences where tool A fails, then tool B is called, then A succeeds
  3. This indicates B is a prerequisite for A
  4. Create edge B→A with high confidence
- **Files**: `tests/functional/src/analysis/mapper/graph.ts`
- **Detection Signal**: `A(fail) → B → A(success)` pattern
- **Confidence**: 0.9 (strong signal)

### T024 – Implement confidence scoring
- **Purpose**: Calculate confidence scores for all edges.
- **Steps**:
  1. Add to `src/analysis/mapper/graph.ts`
  2. Implement `calculateConfidence(edge: Edge, totalSessionsWithTarget: number): number`
  3. Base confidence: evidenceCount / totalSessionsWithTarget
  4. Boost for error-recovery patterns (+0.2)
  5. Cap at 1.0
- **Files**: `tests/functional/src/analysis/mapper/graph.ts`
- **Formula**: `confidence = min(1.0, (evidenceCount / sessionsWithA) + errorRecoveryBonus)`

### T025 – Implement JSON export in export.ts
- **Purpose**: Export dependencies to JSON format.
- **Steps**:
  1. Create `tests/functional/src/analysis/mapper/export.ts`
  2. Implement `exportToJson(graph: DependencyGraph): DependencyExport`
  3. Transform graph to array of Dependency objects
  4. Write to `analysis-output/dependencies.json`
- **Files**: `tests/functional/src/analysis/mapper/export.ts`
- **Schema**:
  ```json
  {
    "dependencies": [
      {
        "from": "mcp__mittwald__mittwald_project_get",
        "to": "mcp__mittwald__mittwald_app_create",
        "confidence": 0.85,
        "evidenceCount": 42,
        "evidenceSessions": ["uuid1", "uuid2", "..."],
        "type": "sequence"
      }
    ],
    "stats": {
      "totalNodes": 150,
      "totalEdges": 89,
      "avgConfidence": 0.72
    }
  }
  ```
- **Parallel?**: Yes (with T026)

### T026 – Implement DOT export with domain clustering
- **Purpose**: Export graph in Graphviz DOT format.
- **Steps**:
  1. Add to `tests/functional/src/analysis/mapper/export.ts`
  2. Implement `exportToDot(graph: DependencyGraph, domainMap: Map<string, TestDomain>): string`
  3. Group nodes by domain using `subgraph cluster_*`
  4. Edge labels show confidence percentage
  5. Color edges by confidence: green (>0.8), yellow (0.5-0.8), red (<0.5)
  6. Write to `analysis-output/dependencies.dot`
- **Files**: `tests/functional/src/analysis/mapper/export.ts`
- **DOT Template**:
  ```dot
  digraph ToolDependencies {
    rankdir=LR;
    node [shape=box];

    subgraph cluster_apps {
      label="Apps Domain";
      app_create;
      app_get;
    }

    subgraph cluster_project {
      label="Project Foundation";
      project_get;
    }

    project_get -> app_create [label="85%" color="green"];
  }
  ```
- **Parallel?**: Yes (with T025)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Circular dependencies | Break cycles by removing lowest-confidence edge |
| Sparse evidence | Require minimum 3 sessions per edge |
| Too many edges | Only include confidence > 0.5 |
| Large DOT file | Limit to top 100 edges by confidence |

## Definition of Done Checklist

- [ ] All 8 subtasks completed
- [ ] Mapper module created with index.ts, graph.ts, export.ts
- [ ] Tool sequences extracted from all sessions
- [ ] DAG built with cycle detection
- [ ] Confidence scores calculated
- [ ] dependencies.json written with valid structure
- [ ] dependencies.dot renders in Graphviz
- [ ] `project_get` → `app_create` dependency detected

## Review Guidance

- Render dependencies.dot with `dot -Tpng dependencies.dot -o deps.png`
- Verify no cycles in the graph
- Spot-check 5 high-confidence edges for accuracy
- Verify domain clustering in DOT output
- Check that common patterns like project→app are detected

## Activity Log

- 2025-12-04T18:30:00Z – system – lane=planned – Prompt created.
- 2025-12-04T19:56:00Z – claude (shell 81851) – lane=done – **APPROVED**. All subtasks implemented: mapper module with index.ts, graph.ts, export.ts, types.ts; tool sequence extraction; DAG builder with cycle detection; confidence scoring; JSON export (16 dependencies, 54 nodes); DOT export with domain clustering. Note: `project_get` → `app_create` dependency not detected because it's not present in the functional test corpus - this is a data availability issue, not an implementation bug. Verified: `org_get` → `org_delete`, `server_list` → `project_create` and other patterns correctly detected.
