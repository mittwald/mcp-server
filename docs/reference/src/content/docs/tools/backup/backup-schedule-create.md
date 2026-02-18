---
title: Create Backup Schedule
description: Create a backup schedule.
sidebar:
  label: Create Backup Schedule
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create Backup Schedule
  - tag: meta
    attrs:
      name: og:description
      content: Create a backup schedule.
lastUpdated: 2026-01-23
---
## Overview

Create a backup schedule.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project; this argument is optional if a default project is set in the context |
| `schedule` | `string` | Yes | Cron expression for the backup schedule |
| `ttl` | `string` | Yes | Time-to-live for backups (7d - 400d) |
| `description` | `string` | No | Description for the backup schedule |
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

