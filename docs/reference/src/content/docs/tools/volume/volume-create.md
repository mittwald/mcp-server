---
title: Create Volume
description: Create a new named volume inside a project stack.
sidebar:
  label: Create Volume
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create Volume
  - tag: meta
    attrs:
      name: og:description
      content: Create a new named volume inside a project stack.
lastUpdated: 2026-01-23
---
## Overview

Create a new named volume inside a project stack.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | Project ID where the volume should be created (format: p-xxxxx). |
| `name` | `string` | Yes | Unique volume name (lowercase letters, numbers and hyphen). |
| `quiet` | `boolean` | No | Suppress CLI progress output and return only the created volume name. |

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

