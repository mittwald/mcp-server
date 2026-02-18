---
title: Abort Cron Job Execution
description: Abort a cronjob execution.
sidebar:
  label: Abort Cron Job Execution
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Abort Cron Job Execution
  - tag: meta
    attrs:
      name: og:description
      content: Abort a cronjob execution.
lastUpdated: 2026-01-23
---
## Overview

Abort a cronjob execution.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cronjobId` | `string` | Yes | ID or short ID of a cronjob |
| `executionId` | `string` | Yes | ID of the execution to abort |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |

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

