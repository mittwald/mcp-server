---
work_package_id: "WP29"
subtasks:
  - "T001"
title: "Extract All Self-Assessments"
phase: "Phase 5 - Aggregation & Export"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:29:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP29 – Extract All Self-Assessments

## Objective

Process all session logs from Phase 4 to extract self-assessment JSON blocks. This is the first step in aggregating baseline results.

## Prerequisites

- **WP-01** completed (extractor script ready)
- **WP-18 through WP-28** completed (all session logs exist)

## Input

Session logs from all domains:
```
evals/results/sessions/
├── identity/           (17 logs)
├── organization/       (14 logs)
├── project-foundation/ (16 logs)
├── apps/               (28 logs)
├── containers/         (19 logs)
├── databases/          (21 logs)
├── domains-mail/       (20 logs)
├── access-users/       (8 logs)
├── automation/         (10 logs)
├── backups/            (9 logs)
└── misc/               (13 logs)
```

**Total**: 175 session logs

## Extraction Process

### Step 1: Run Extractor on All Domains

```bash
npx ts-node evals/scripts/extract-self-assessment.ts --dir evals/results/sessions/identity/
npx ts-node evals/scripts/extract-self-assessment.ts --dir evals/results/sessions/organization/
# ... repeat for all domains
```

Or batch mode:
```bash
for domain in identity organization project-foundation apps containers databases domains-mail access-users automation backups misc; do
  npx ts-node evals/scripts/extract-self-assessment.ts --dir "evals/results/sessions/$domain/"
done
```

### Step 2: Validate Extractions

For each extraction:
1. Check JSON validity
2. Validate against self-assessment schema
3. Log any extraction failures

### Step 3: Organize Results

Output structure:
```
evals/results/self-assessments/
├── identity/
│   ├── user-get.json
│   └── ...
├── organization/
├── ... (all domains)
└── extraction-summary.json
```

### Step 4: Generate Extraction Summary

```json
{
  "extracted_at": "2025-12-16T00:00:00Z",
  "total_sessions": 175,
  "successful_extractions": N,
  "failed_extractions": N,
  "by_domain": {
    "identity": {"total": 17, "extracted": N, "failed": N},
    ...
  },
  "failures": [
    {"session": "...", "domain": "...", "error": "..."}
  ]
}
```

## Handling Failures

For each failed extraction:
1. Log the session file path
2. Document the error type
3. Try to manually inspect the log
4. Create a placeholder assessment if possible:

```json
{
  "success": null,
  "confidence": "low",
  "tool_executed": "...",
  "timestamp": "...",
  "problems_encountered": [{
    "type": "other",
    "description": "Self-assessment extraction failed: [reason]"
  }],
  "execution_notes": "Assessment could not be extracted from session log"
}
```

## Deliverables

- [ ] `evals/results/self-assessments/{domain}/*.json` - 175 assessment files
- [ ] `evals/results/self-assessments/extraction-summary.json`
- [ ] All valid assessments extracted
- [ ] Failures documented

## Acceptance Criteria

1. Extraction attempted for all 175 sessions
2. Extraction success rate > 90%
3. All failures documented
4. Valid JSON for all extracted assessments
5. Summary statistics accurate

## Success Metrics

Target extraction rates:
- **Overall**: >90% successful extraction
- **Tier 0 tools**: >95% (simple operations)
- **Tier 4 tools**: >85% (more complex)

## Parallelization Notes

- Can process domains in parallel
- Single WP but parallelizable internally
- Must complete before WP-30 (coverage report)

