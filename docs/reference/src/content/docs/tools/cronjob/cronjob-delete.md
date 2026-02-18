---
title: Delete Cron Job
description: Delete a cronjob.
sidebar:
  label: Delete Cron Job
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete Cron Job
  - tag: meta
    attrs:
      name: og:description
      content: Delete a cronjob.
lastUpdated: 2026-01-23
---
## Overview

Delete a cronjob.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cronjobId` | `string` | Yes | ID or short ID of a cronjob |
| `confirm` | `boolean` | Yes | Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone). |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `force` | `boolean` | No | Skip confirmation prompt |

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

