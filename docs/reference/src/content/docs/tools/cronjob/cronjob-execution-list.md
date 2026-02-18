---
title: List Cron Job Executions
description: List cronjob executions.
sidebar:
  label: List Cron Job Executions
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Cron Job Executions
  - tag: meta
    attrs:
      name: og:description
      content: List cronjob executions.
lastUpdated: 2026-01-23
---
## Overview

List cronjob executions.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cronjobId` | `string` | Yes | ID or short ID of a cronjob |
| `output` | `txt \| json \| yaml \| csv \| tsv` | No | Output format (txt, json, yaml, csv, tsv) |
| `extended` | `boolean` | No | Show extended information |
| `noHeader` | `boolean` | No | Omit header row |
| `noTruncate` | `boolean` | No | Do not truncate output |
| `noRelativeDates` | `boolean` | No | Show absolute dates instead of relative dates |
| `csvSeparator` | `, \| ;` | No | CSV separator character |

## Return Type

**Type**: `object`

**Description**: Tool execution result with status, message, and data

**Example Response**:

```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": null,
  "metadata": {
    "durationMs": 0
  }
}
```

