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
| 1 | Bash | 106 | 23,030 | wrong-tool-selection |
| 2 | WebSearch | 37 | 1,639 | capability-mismatch |
| 3 | Task | 35 | 665,966 | unnecessary-delegation |
| 4 | unknown | 22 | 306 | stuck-indicator |
| 5 | Skill | 12 | 835 | retry-loop |
| 6 | SlashCommand | 11 | 457 | wrong-tool-selection |
| 7 | WebFetch | 1 | 40 | capability-mismatch |

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
*Analysis generated on 2025-12-04T19:28:31.241Z*