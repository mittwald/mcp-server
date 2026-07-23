---
title: "List Backup Schedules"
description: "List backup schedules."
sidebar:
  label: "List Backup Schedules"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Backup Schedules"
  - tag: meta
    attrs:
      name: og:description
      content: "List backup schedules."
lastUpdated: 2026-07-23
---
## Overview

List backup schedules.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |

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

