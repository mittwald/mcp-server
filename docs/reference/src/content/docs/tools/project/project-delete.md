---
title: Delete Project
description: Delete a project.
sidebar:
  label: Delete Project
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete Project
  - tag: meta
    attrs:
      name: og:description
      content: Delete a project.
lastUpdated: 2026-01-23
---
## Overview

Delete a project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |
| `confirm` | `boolean` | Yes | Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone). |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `force` | `boolean` | No | Do not ask for confirmation |

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

