# Organization Domain Analysis

## Overview

- **Sessions analyzed**: 14
- **Tools tested**: extension/install, extension/list, extension/list/installed, extension/uninstall, org/delete, org/get, org/invite, org/invite/list, org/invite/list/own, org/invite/revoke, org/list, org/membership/list, org/membership/list/own, org/membership/revoke
- **Total token usage**: 2,286

## Confusion Incidents

| Session | Pattern | Severity | Token Waste | Details |
|---------|---------|----------|-------------|---------|
| 5c466c0e | unnecessary-delegation | high | 26,669 | Spawned Task agent for: "Review documentation for org/delete tool" |

**Summary**: 1 incidents, 26,669 tokens wasted

## Tool Dependencies

Dependencies involving Organization tools:

| Prerequisite | Required For | Confidence |
|--------------|--------------|------------|
| org/invite/list | org/invite/revoke | 100% |
| org/get | org/delete | 100% |
| context/reset/session | org/membership/list | 100% |
| org/invite/list | org/invite/list/own | 50% |
| user/accessible/projects | org/invite/list | 50% |
| user/accessible/projects | org/list | 50% |
| org/membership/list | project/list | 50% |

## Efficiency Metrics

| Metric | Value |
|--------|-------|
| Average tokens per session | 163 |
| Success rate | 93% |
| Most problematic tool | unknown |
| Incident count | 1 |
| Average session duration | 56.7s |

## Recommendations

- Address 1 high-severity incidents in organization domain

---
*Generated on 2025-12-04*