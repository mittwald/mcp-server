---
title: "List Cron Job Executions"
description: "List cronjob executions."
sidebar:
  label: "List Cron Job Executions"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Cron Job Executions"
  - tag: meta
    attrs:
      name: og:description
      content: "List cronjob executions."
lastUpdated: 2026-07-23
---
## Overview

List cronjob executions.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cronjobId` | `string` | Yes | ID of the cronjob |

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

