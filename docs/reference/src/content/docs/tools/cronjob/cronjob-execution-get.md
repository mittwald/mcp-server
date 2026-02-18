---
title: Get Cron Job Execution Details
description: Get details of a cronjob execution.
sidebar:
  label: Get Cron Job Execution Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Cron Job Execution Details
  - tag: meta
    attrs:
      name: og:description
      content: Get details of a cronjob execution.
lastUpdated: 2026-01-23
---
## Overview

Get details of a cronjob execution.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cronjobId` | `string` | Yes | ID or short ID of a cronjob |
| `executionId` | `string` | Yes | ID of the execution to get details for |
| `output` | `txt \| json \| yaml` | No | Output format (txt, json, yaml) |

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

