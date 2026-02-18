---
title: Delete Registry
description: Delete a registry from Mittwald.
sidebar:
  label: Delete Registry
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete Registry
  - tag: meta
    attrs:
      name: og:description
      content: Delete a registry from Mittwald.
lastUpdated: 2026-01-23
---
## Overview

Delete a registry from Mittwald.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `registryId` | `string` | Yes | ID of the registry to delete |
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

