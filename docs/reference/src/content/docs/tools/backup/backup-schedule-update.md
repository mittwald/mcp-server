---
title: Update Backup Schedule
description: Update a backup schedule.
sidebar:
  label: Update Backup Schedule
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update Backup Schedule
  - tag: meta
    attrs:
      name: og:description
      content: Update a backup schedule.
lastUpdated: 2026-01-23
---
## Overview

Update a backup schedule.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupScheduleId` | `string` | Yes | ID or short ID of a backup schedule |
| `description` | `string` | No | Description for the backup schedule |
| `schedule` | `string` | No | Cron expression for the backup schedule |
| `ttl` | `string` | No | Time-to-live for backups (7d - 400d) |
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

