---
title: Update Project
description: Update an existing project.
sidebar:
  label: Update Project
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update Project
  - tag: meta
    attrs:
      name: og:description
      content: Update an existing project.
lastUpdated: 2026-01-23
---
## Overview

Update an existing project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |
| `description` | `string` | No | Set the project description |
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

