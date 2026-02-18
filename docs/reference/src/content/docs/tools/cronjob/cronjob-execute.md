---
title: Execute Cron Job
description: Execute a cronjob.
sidebar:
  label: Execute Cron Job
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Execute Cron Job
  - tag: meta
    attrs:
      name: og:description
      content: Execute a cronjob.
lastUpdated: 2026-01-23
---
## Overview

Execute a cronjob.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cronjobId` | `string` | Yes | ID or short ID of a cronjob |
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

