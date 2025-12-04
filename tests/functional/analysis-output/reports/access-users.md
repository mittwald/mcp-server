# Access Users Domain Analysis

## Overview

- **Sessions analyzed**: 8
- **Tools tested**: sftp/user/create, sftp/user/delete, sftp/user/list, sftp/user/update, ssh/user/create, ssh/user/delete, ssh/user/list, ssh/user/update
- **Total token usage**: 2,812

## Confusion Incidents

| Session | Pattern | Severity | Token Waste | Details |
|---------|---------|----------|-------------|---------|
| 4e2c7147 | wrong-tool-selection | medium | 110 | Used Bash instead of calling mcp__mittwald__mittwald_ssh_user_create directly |
| 3a06595c | stuck-indicator | low | 12 | 121s gap between events (possible stuck state) |

**Summary**: 2 incidents, 122 tokens wasted

## Tool Dependencies

Dependencies involving Access Users tools:

| Prerequisite | Required For | Confidence |
|--------------|--------------|------------|
| ssh/user/update | ssh/user/get | 100% |
| server/list | sftp/user/delete | 100% |
| sftp/user/create | server/get | 100% |
| ssh/user/get | ssh/user/list | 50% |

## Efficiency Metrics

| Metric | Value |
|--------|-------|
| Average tokens per session | 352 |
| Success rate | 100% |
| Most problematic tool | ssh/user/delete |
| Incident count | 2 |
| Average session duration | 1.9m |

## Recommendations

- access-users domain is performing well with minimal confusion patterns detected

---
*Generated on 2025-12-04*