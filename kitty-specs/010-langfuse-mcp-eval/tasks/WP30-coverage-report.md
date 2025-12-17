---
work_package_id: WP30
title: Generate Coverage Report
lane: planned
history:
- timestamp: '2025-12-16T13:30:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
agent: ''
assignee: ''
phase: Phase 5 - Aggregation & Export
review_status: ''
reviewed_by: ''
shell_pid: ''
subtasks:
- T001
---

# Work Package Prompt: WP30 – Generate Coverage Report

## Objective

Generate comprehensive coverage report aggregating all self-assessments by domain and tier.

## Prerequisites

- **WP-03** completed (coverage reporter script ready)
- **WP-29** completed (all assessments extracted)
- **WP-04** completed (tool inventory available)

## Input

- `evals/inventory/tools.json` - Complete tool inventory
- `evals/results/self-assessments/` - Extracted assessments

## Execution

```bash
npx ts-node evals/scripts/generate-coverage-report.ts \
  evals/results/self-assessments \
  evals/inventory/tools.json \
  evals/results
```

## Output

### coverage-report.json

```json
{
  "generated_at": "2025-12-16T00:00:00Z",
  "summary": {
    "total_tools": 175,
    "total_executed": 175,
    "total_success": N,
    "total_failure": N,
    "overall_success_rate": N.N,
    "overall_coverage_rate": 100.0
  },
  "by_domain": [
    {
      "domain": "identity",
      "total_tools": 17,
      "executed": 17,
      "success_count": N,
      "failure_count": N,
      "success_rate": N.N,
      "coverage_rate": 100.0
    },
    // ... all domains
  ],
  "by_tier": [
    {
      "tier": 0,
      "total_tools": N,
      "executed": N,
      "success_count": N,
      "failure_count": N,
      "success_rate": N.N
    },
    // ... tiers 0-4
  ],
  "problems": [
    {
      "type": "auth_error",
      "count": N,
      "affected_tools": ["..."],
      "sample_descriptions": ["..."]
    },
    // ... all problem types
  ],
  "tools_without_assessment": []
}
```

### Expected Metrics

Based on typical MCP server testing:

| Metric | Target | Notes |
|--------|--------|-------|
| Overall Coverage | 100% | All 175 tools attempted |
| Overall Success | >80% | Most tools should work |
| Tier 0 Success | >95% | No dependencies |
| Tier 4 Success | >75% | More complex |
| Problem Rate | <20% | Most operations succeed |

## Deliverables

- [ ] `evals/results/coverage-report.json`
- [ ] All 175 tools represented
- [ ] Domain breakdown complete
- [ ] Tier breakdown complete
- [ ] Problem patterns identified

## Acceptance Criteria

1. JSON report validates
2. All domains represented
3. All tiers represented
4. Percentages calculated correctly
5. No orphaned tools

## Parallelization Notes

- Sequential with WP-29 (needs extracted assessments)
- Can run in parallel with WP-31 (independent outputs)

