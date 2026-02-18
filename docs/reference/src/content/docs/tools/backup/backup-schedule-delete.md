---
title: Delete Backup Schedule
description: Delete a backup schedule.
sidebar:
  label: Delete Backup Schedule
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete Backup Schedule
  - tag: meta
    attrs:
      name: og:description
      content: Delete a backup schedule.
lastUpdated: 2026-01-23
---
## Overview

Delete a backup schedule.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupScheduleId` | `string` | Yes | ID or short ID of a backup schedule |
| `confirm` | `boolean` | Yes | Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone). |
| `force` | `boolean` | No | Skip confirmation prompt |
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

