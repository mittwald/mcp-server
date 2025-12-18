# Eval Coverage Baseline Report

**Generated**: 12/19/2025, 12:32:08 AM

## Overall Summary

- **Total Tools**: 115
- **Executed**: 115 (100%)
- **Successful**: 61
- **Failed**: 54
- **Success Rate**: 53.0%

## Domain Breakdown

| Domain | Executed | Successful | Failed | Success Rate |
|--------|----------|------------|--------|--------------|
| app | 8 | 3 | 5 | 37.5% |
| backup | 8 | 8 | 0 | 100.0% |
| certificate | 2 | 0 | 2 | 0.0% |
| container | 1 | 1 | 0 | 100.0% |
| context | 3 | 3 | 0 | 100.0% |
| conversation | 5 | 0 | 5 | 0.0% |
| cronjob | 9 | 1 | 8 | 11.1% |
| database | 14 | 9 | 5 | 64.3% |
| domain | 9 | 4 | 5 | 44.4% |
| mail | 10 | 6 | 4 | 60.0% |
| org | 7 | 1 | 6 | 14.3% |
| project | 10 | 5 | 5 | 50.0% |
| registry | 4 | 2 | 2 | 50.0% |
| server | 2 | 2 | 0 | 100.0% |
| sftp | 2 | 2 | 0 | 100.0% |
| ssh | 4 | 4 | 0 | 100.0% |
| stack | 4 | 2 | 2 | 50.0% |
| user | 12 | 7 | 5 | 58.3% |
| volume | 1 | 1 | 0 | 100.0% |

## Problem Summary

| Problem Type | Count | Sample Tools |
|--------------|-------|--------------|
| dependency_missing | 29 | app_upgrade, cronjob_delete +27 |
| other | 13 | app_copy, app_uninstall +11 |
| permission_denied | 8 | database_redis_versions, domain_get +6 |
| validation_error | 4 | app_versions, registry_create +2 |
| api_error | 4 | app_versions, cronjob_create +2 |
| resource_not_found | 1 | database_redis_create |

## Recommendations

### Domains Needing Attention

- **app**: 37.5% success (5/8 failed)
- **certificate**: 0.0% success (2/2 failed)
- **conversation**: 0.0% success (5/5 failed)
- **cronjob**: 11.1% success (8/9 failed)
- **domain**: 44.4% success (5/9 failed)
- **org**: 14.3% success (6/7 failed)

### Top Problem Types

- **dependency_missing**: 29 occurrences
- **other**: 13 occurrences
- **permission_denied**: 8 occurrences
- **validation_error**: 4 occurrences
- **api_error**: 4 occurrences
