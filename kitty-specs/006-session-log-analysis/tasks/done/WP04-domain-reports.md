---
work_package_id: "WP04"
subtasks:
  - "T027"
  - "T028"
  - "T029"
  - "T030"
  - "T031"
  - "T032"
  - "T033"
  - "T034"
  - "T035"
  - "T036"
  - "T037"
  - "T038"
  - "T039"
  - "T040"
  - "T041"
  - "T042"
  - "T043"
title: "Domain Reports Generator"
phase: "Phase 2 - Analysis"
lane: "done"
assignee: "claude"
agent: "claude"
shell_pid: "81851"
reviewer_agent: "claude"
reviewer_shell_pid: "81851"
history:
  - timestamp: "2025-12-04T18:30:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-04T19:58:00Z"
    lane: "done"
    agent: "claude"
    shell_pid: "81851"
    action: "Approved after review"
---

# Work Package Prompt: WP04 – Domain Reports Generator

## Objectives & Success Criteria

- Generate comprehensive Markdown reports for all 10 functional domains
- Include incident analysis, dependency visualization, and efficiency metrics per domain
- Generate actionable recommendations for each domain
- Output reports to `analysis-output/reports/`

**Success Metrics**:
- All 10 domain reports generated
- Each report contains: overview, incidents table, dependencies, metrics, recommendations
- Automation domain report includes cronjob sessions
- Reports are human-readable and actionable

## Context & Constraints

- **Input**: CorpusIndex from WP01, incidents from WP02, dependencies from WP03
- **Output**: `tests/functional/analysis-output/reports/{domain}.md`
- **Depends on**: WP01, WP02, WP03
- **Related docs**: [plan.md](../../plan.md), [data-model.md](../../data-model.md), [spec.md](../../spec.md) FR-041 through FR-045

### Domain List (from grouping.ts)
1. identity
2. organization
3. project-foundation
4. apps
5. containers
6. databases
7. domains-mail
8. access-users
9. automation
10. backups

## Subtasks & Detailed Guidance

### T027 – Create reporters module structure
- **Purpose**: Establish reporters module layout.
- **Steps**:
  1. Create `tests/functional/src/analysis/reporters/` directory
  2. Create files: `index.ts`, `domain-report.ts`, `summary-report.ts`, `recommendations.ts`
- **Files**: `tests/functional/src/analysis/reporters/*`
- **Parallel?**: No

### T028 – Implement domain report generator in domain-report.ts
- **Purpose**: Core report generation logic.
- **Steps**:
  1. Create `tests/functional/src/analysis/reporters/domain-report.ts`
  2. Implement `DomainReportGenerator` class
  3. Constructor takes: corpusIndex, incidents, dependencies
  4. Method: `generateReport(domain: TestDomain): DomainReport`
  5. Method: `renderMarkdown(report: DomainReport): string`
- **Files**: `tests/functional/src/analysis/reporters/domain-report.ts`
- **Interface**:
  ```typescript
  interface DomainReport {
    domain: TestDomain;
    overview: { sessionCount: number; toolList: string[]; totalTokens: number };
    incidents: Incident[];
    dependencies: Dependency[];
    metrics: EfficiencyMetrics;
    recommendations: string[];
  }
  ```

### T029 – Implement domain filtering by tool patterns
- **Purpose**: Filter sessions and tools by domain.
- **Steps**:
  1. Add to `domain-report.ts`
  2. Implement `filterByDomain(corpus: CorpusIndex, domain: TestDomain): Session[]`
  3. Use `mapToolToDomain()` from inventory/grouping.ts
  4. Return only sessions where targetTool belongs to the domain
- **Files**: `tests/functional/src/analysis/reporters/domain-report.ts`

### T030 – Implement incident aggregation per domain
- **Purpose**: Aggregate incidents for a specific domain.
- **Steps**:
  1. Add to `domain-report.ts`
  2. Implement `aggregateIncidents(incidents: Incident[], sessionIds: string[]): IncidentSummary`
  3. Filter incidents to only those in domain sessions
  4. Group by type, count by severity
  5. Calculate total token waste for domain
- **Files**: `tests/functional/src/analysis/reporters/domain-report.ts`
- **Interface**:
  ```typescript
  interface IncidentSummary {
    incidents: Incident[];
    byType: Record<IncidentType, number>;
    bySeverity: { high: number; medium: number; low: number };
    totalTokenWaste: number;
  }
  ```

### T031 – Implement dependency filtering for domain-specific view
- **Purpose**: Filter dependencies to show domain-relevant edges.
- **Steps**:
  1. Add to `domain-report.ts`
  2. Implement `filterDependencies(deps: Dependency[], domainTools: string[]): Dependency[]`
  3. Include edges where either `from` or `to` is in domainTools
  4. Include cross-domain edges that relate to this domain
- **Files**: `tests/functional/src/analysis/reporters/domain-report.ts`

### T032 – Implement efficiency metrics calculation
- **Purpose**: Calculate domain-specific efficiency metrics.
- **Steps**:
  1. Add to `domain-report.ts`
  2. Implement `calculateMetrics(sessions: Session[], incidents: Incident[]): EfficiencyMetrics`
  3. Metrics:
     - avgTokensPerSession: total tokens / session count
     - successRate: sessions without high-severity incidents / total
     - mostProblematicTool: tool with most incidents
     - avgTimePerSession: total duration / session count
- **Files**: `tests/functional/src/analysis/reporters/domain-report.ts`
- **Interface**:
  ```typescript
  interface EfficiencyMetrics {
    avgTokensPerSession: number;
    successRate: number;
    mostProblematicTool: string;
    incidentCount: number;
    avgTimePerSession: number;
  }
  ```

### T033 – Implement recommendation generation per domain
- **Purpose**: Generate actionable recommendations based on findings.
- **Steps**:
  1. Add to `domain-report.ts`
  2. Implement `generateRecommendations(report: DomainReport): string[]`
  3. Rules:
     - If wrong-tool-selection > 5: "Improve tool descriptions for [tools]"
     - If retry-loop > 3: "Add error recovery guidance for [tools]"
     - If exploration-waste > 3: "Provide direct tool references in documentation"
     - If capability-mismatch > 0: "Document model requirements for [tools]"
- **Files**: `tests/functional/src/analysis/reporters/domain-report.ts`

### T034 – Generate identity.md report
- **Purpose**: Generate report for identity domain.
- **Steps**:
  1. Call `generator.generateReport('identity')`
  2. Write to `analysis-output/reports/identity.md`
- **Files**: `tests/functional/analysis-output/reports/identity.md`
- **Expected Tools**: user/*, profile/*, sshkey/*
- **Parallel?**: Yes (with T035-T043)

### T035 – Generate organization.md report
- **Purpose**: Generate report for organization domain.
- **Steps**:
  1. Call `generator.generateReport('organization')`
  2. Write to `analysis-output/reports/organization.md`
- **Files**: `tests/functional/analysis-output/reports/organization.md`
- **Expected Tools**: customer/*, contract/*
- **Parallel?**: Yes

### T036 – Generate project-foundation.md report
- **Purpose**: Generate report for project-foundation domain.
- **Steps**:
  1. Call `generator.generateReport('project-foundation')`
  2. Write to `analysis-output/reports/project-foundation.md`
- **Files**: `tests/functional/analysis-output/reports/project-foundation.md`
- **Expected Tools**: project/*, server/*
- **Parallel?**: Yes

### T037 – Generate apps.md report
- **Purpose**: Generate report for apps domain.
- **Steps**:
  1. Call `generator.generateReport('apps')`
  2. Write to `analysis-output/reports/apps.md`
- **Files**: `tests/functional/analysis-output/reports/apps.md`
- **Expected Tools**: app/*
- **Parallel?**: Yes

### T038 – Generate containers.md report
- **Purpose**: Generate report for containers domain.
- **Steps**:
  1. Call `generator.generateReport('containers')`
  2. Write to `analysis-output/reports/containers.md`
- **Files**: `tests/functional/analysis-output/reports/containers.md`
- **Expected Tools**: container/*
- **Parallel?**: Yes

### T039 – Generate databases.md report
- **Purpose**: Generate report for databases domain.
- **Steps**:
  1. Call `generator.generateReport('databases')`
  2. Write to `analysis-output/reports/databases.md`
- **Files**: `tests/functional/analysis-output/reports/databases.md`
- **Expected Tools**: database/*, mysql/*, redis/*
- **Parallel?**: Yes

### T040 – Generate domains-mail.md report
- **Purpose**: Generate report for domains-mail domain.
- **Steps**:
  1. Call `generator.generateReport('domains-mail')`
  2. Write to `analysis-output/reports/domains-mail.md`
- **Files**: `tests/functional/analysis-output/reports/domains-mail.md`
- **Expected Tools**: domain/*, dns/*, ingress/*, mail/*
- **Parallel?**: Yes

### T041 – Generate access-users.md report
- **Purpose**: Generate report for access-users domain.
- **Steps**:
  1. Call `generator.generateReport('access-users')`
  2. Write to `analysis-output/reports/access-users.md`
- **Files**: `tests/functional/analysis-output/reports/access-users.md`
- **Expected Tools**: sftp/*, ssh/*
- **Parallel?**: Yes

### T042 – Generate automation.md report
- **Purpose**: Generate report for automation domain.
- **Steps**:
  1. Call `generator.generateReport('automation')`
  2. Write to `analysis-output/reports/automation.md`
- **Files**: `tests/functional/analysis-output/reports/automation.md`
- **Expected Tools**: cronjob/*
- **Parallel?**: Yes

### T043 – Generate backups.md report
- **Purpose**: Generate report for backups domain.
- **Steps**:
  1. Call `generator.generateReport('backups')`
  2. Write to `analysis-output/reports/backups.md`
- **Files**: `tests/functional/analysis-output/reports/backups.md`
- **Expected Tools**: backup/*
- **Parallel?**: Yes

## Report Template

```markdown
# {Domain} Domain Analysis

## Overview
- **Sessions analyzed**: {sessionCount}
- **Tools tested**: {toolList.join(', ')}
- **Total token usage**: {totalTokens}

## Confusion Incidents

| Session | Pattern | Severity | Token Waste | Details |
|---------|---------|----------|-------------|---------|
| {sessionId} | {type} | {severity} | {tokenWaste} | {context.description} |

**Summary**: {incidentCount} incidents, {tokenWaste} tokens wasted

## Tool Dependencies

Dependencies involving {domain} tools:

| Prerequisite | Required For | Confidence |
|--------------|--------------|------------|
| {from} | {to} | {confidence}% |

## Efficiency Metrics

| Metric | Value |
|--------|-------|
| Average tokens per session | {avgTokensPerSession} |
| Success rate | {successRate}% |
| Most problematic tool | {mostProblematicTool} |
| Average session duration | {avgTimePerSession}ms |

## Recommendations

{recommendations.map(r => `- ${r}`).join('\n')}
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Empty domains | Generate report with "No sessions analyzed" message |
| Large incident tables | Limit to top 20 by severity, link to incidents.json |
| Missing metrics | Use 0 or "N/A" for undefined values |
| Slow generation | Generate all 10 reports in parallel |

## Definition of Done Checklist

- [ ] All 17 subtasks completed
- [ ] Reporters module created with all files
- [ ] DomainReportGenerator class implemented
- [ ] All filtering, aggregation, and metrics functions working
- [ ] All 10 domain reports generated
- [ ] Automation domain includes cronjob sessions
- [ ] Reports follow consistent template
- [ ] Recommendations are actionable

## Review Guidance

- Open each report in a Markdown viewer
- Verify automation.md includes cronjob tools
- Check that incident tables are sorted by severity
- Verify recommendations make sense for the incidents found
- Spot-check metrics calculations on 2 domains

## Activity Log

- 2025-12-04T18:30:00Z – system – lane=planned – Prompt created.
- 2025-12-04T19:58:00Z – claude (shell 81851) – lane=done – **APPROVED**. All 17 subtasks implemented. Reporters module created with domain-report.ts, summary-report.ts, recommendations.ts, index.ts, types.ts, manifest.ts. All 10 domain reports generated (identity, organization, project-foundation, apps, containers, databases, domains-mail, access-users, automation, backups). Automation domain includes all cronjob tools. Reports follow consistent template with overview, incidents table (sorted by severity), dependencies, efficiency metrics, and actionable recommendations. "Most problematic tool" correctly shows MCP tools (e.g., app/upgrade, cronjob/execution/get).
