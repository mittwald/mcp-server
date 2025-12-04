# Session Log Analysis Summary

**Generated**: 2025-12-04
**Corpus**: 595 sessions from 005-mcp-functional-test

## Corpus Statistics

| Metric | Value |
|--------|-------|
| Total sessions | 595 |
| Total events | 5,666 |
| Total tokens | 338,050 |
| Average tokens/session | 568 |
| Average events/session | 9.5 |

## Confusion Patterns Detected

| Pattern | Count | Token Waste | Most Affected Domain |
|---------|-------|-------------|---------------------|
| unnecessary-delegation | 31 | 665,940 | domains-mail |
| wrong-tool-selection | 94 | 18,645 | containers |
| retry-loop | 35 | 5,677 | project-foundation |
| capability-mismatch | 42 | 1,705 | databases |
| stuck-indicator | 22 | 306 | identity |

## Top 10 Problematic Tools

| Rank | Tool | Incidents | Token Waste | Primary Pattern |
|------|------|-----------|-------------|-----------------|
| 1 | domain/virtualhost/list | 15 | 36,584 | wrong-tool-selection |
| 2 | cronjob/execution/get | 9 | 87,878 | unnecessary-delegation |
| 3 | backup/get | 9 | 88,737 | wrong-tool-selection |
| 4 | app/upgrade | 8 | 19,181 | wrong-tool-selection |
| 5 | project/membership/get | 7 | 25,918 | wrong-tool-selection |
| 6 | user/get | 6 | 196 | capability-mismatch |
| 7 | app/list | 5 | 119,183 | unnecessary-delegation |
| 8 | stack/delete | 5 | 410 | wrong-tool-selection |
| 9 | mail/deliverybox/get | 5 | 12,591 | wrong-tool-selection |
| 10 | app/list/upgrade/candidates | 4 | 229 | wrong-tool-selection |

## Domain Health

| Domain | Sessions | Incidents | Health Score | Status |
|--------|----------|-----------|--------------|--------|
| apps | 30 | 34 | 0% | ✗ critical |
| containers | 20 | 26 | 0% | ✗ critical |
| databases | 21 | 31 | 0% | ✗ critical |
| domains-mail | 22 | 40 | 0% | ✗ critical |
| automation | 13 | 18 | 0% | ✗ critical |
| backups | 10 | 19 | 0% | ✗ critical |
| identity | 26 | 13 | 50% | ✗ critical |
| access-users | 8 | 2 | 75% | ⚠ warning |
| project-foundation | 431 | 40 | 91% | ✓ healthy |
| organization | 14 | 1 | 93% | ✓ healthy |

## Generated Artifacts

See `manifest.json` for complete list of generated files.

---
*Analysis generated on 2025-12-04T19:59:41.994Z*