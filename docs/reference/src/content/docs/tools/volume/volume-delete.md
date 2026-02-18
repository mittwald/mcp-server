---
title: Delete Volume
description: "Delete a persistent volume. WARNING: This permanently removes stored data."
sidebar:
  label: Delete Volume
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete Volume
  - tag: meta
    attrs:
      name: og:description
      content: "Delete a persistent volume. WARNING: This permanently removes stored data."
lastUpdated: 2026-01-23
---
## Overview

Delete a persistent volume. WARNING: This permanently removes stored data.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `volumeId` | `string` | No | Identifier of the volume to delete (accepts volume name as reported by the CLI). |
| `name` | `string` | No | Alias for volumeId; volume name as shown by `mw volume list`. |
| `projectId` | `string` | Yes | Project ID where the volume is located (format: p-xxxxx). |
| `confirm` | `boolean` | Yes | Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone). |
| `force` | `boolean` | No | Force deletion even if the volume is still mounted to containers (use with extreme caution). |
| `quiet` | `boolean` | No | Suppress CLI progress output and return only the deleted volume name. |

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

