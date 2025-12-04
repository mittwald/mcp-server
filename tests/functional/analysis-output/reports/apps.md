# Apps Domain Analysis

## Overview

- **Sessions analyzed**: 30
- **Tools tested**: app/copy, app/create/node, app/create/php, app/create/php/worker, app/create/python, app/create/static, app/dependency/list, app/dependency/update, app/dependency/versions, app/download, app/get, app/install/contao, app/install/joomla, app/install/matomo, app/install/nextcloud, app/install/shopware5, app/install/shopware6, app/install/typo3, app/install/wordpress, app/list, app/list/upgrade/candidates, app/open, app/ssh, app/uninstall, app/update, app/upgrade, app/upload, app/versions
- **Total token usage**: 19,307

## Confusion Incidents

| Session | Pattern | Severity | Token Waste | Details |
|---------|---------|----------|-------------|---------|
| 47c1eaca | unnecessary-delegation | high | 67,096 | Spawned Task agent for: "Identify the MCP tool for listing apps in a projec" |
| 47c1eaca | unnecessary-delegation | high | 52,060 | Spawned Task agent for: "Identify the MCP tool for listing apps in a projec" |
| d84db770 | unnecessary-delegation | high | 22,224 | Spawned Task agent for: "Look up information about the mcp__mittwald__mittw" |
| 7c856626 | unnecessary-delegation | high | 17,732 | Spawned Task agent for: "Look up documentation for mcp__mittwald__mittwald_" |
| 7c856626 | retry-loop | medium | 496 | 3 consecutive errors before success |
| e744990e | retry-loop | medium | 354 | 3 consecutive errors before success |
| 7c856626 | wrong-tool-selection | medium | 273 | Used Bash instead of calling mcp__mittwald__mittwald_app_upgrade directly |
| cfdc8f40 | wrong-tool-selection | medium | 182 | Used Bash instead of calling mcp__mittwald__mittwald_app_install_matomo directly |
| 7c856626 | wrong-tool-selection | medium | 176 | Used Bash instead of calling mcp__mittwald__mittwald_app_upgrade directly |
| 7c856626 | wrong-tool-selection | medium | 166 | Used Bash instead of calling mcp__mittwald__mittwald_app_upgrade directly |
| 7c856626 | wrong-tool-selection | medium | 165 | Used Bash instead of calling mcp__mittwald__mittwald_app_upgrade directly |
| 7c856626 | wrong-tool-selection | medium | 165 | Used Bash instead of calling mcp__mittwald__mittwald_app_upgrade directly |
| 1e35750f | capability-mismatch | medium | 155 | Model claude-3-haiku-20240307 does not support WebSearch |
| cfdc8f40 | wrong-tool-selection | medium | 125 | Used Bash instead of calling mcp__mittwald__mittwald_app_install_matomo directly |
| b2e5c0df | capability-mismatch | medium | 114 | Model claude-3-haiku-20240307 does not support WebSearch |
| b2e5c0df | retry-loop | medium | 112 | 3 consecutive errors before success |
| d84db770 | wrong-tool-selection | medium | 107 | Used Bash instead of calling mcp__mittwald__mittwald_app_upload directly |
| b0174440 | wrong-tool-selection | medium | 98 | Used SlashCommand instead of calling mcp__mittwald__mittwald_app_install_nextcloud directly |
| e744990e | retry-loop | medium | 88 | 3 consecutive errors before success |
| 0f400ad1 | stuck-indicator | low | 20 | 197s gap between events (possible stuck state) |

**Summary**: 34 incidents, 162,007 tokens wasted

## Tool Dependencies

Dependencies involving Apps tools:

| Prerequisite | Required For | Confidence |
|--------------|--------------|------------|
| app/list | app/dependency/list | 50% |

## Efficiency Metrics

| Metric | Value |
|--------|-------|
| Average tokens per session | 644 |
| Success rate | 90% |
| Most problematic tool | app/upgrade |
| Incident count | 34 |
| Average session duration | 1.1m |

## Recommendations

- Improve tool descriptions for apps domain tools to reduce wrong tool selection (13 incidents)
- Add error recovery guidance for apps tools to reduce retry loops (4 incidents)
- Document model requirements for apps tools with capability mismatches (7 incidents)
- Investigate high token waste in apps domain (162,007 tokens)
- Address 4 high-severity incidents in apps domain
- Focus attention on app/upgrade - most frequent incident source

---
*Generated on 2025-12-04*