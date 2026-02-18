---
title: Update Registry
description: Update an existing registry in Mittwald.
sidebar:
  label: Update Registry
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update Registry
  - tag: meta
    attrs:
      name: og:description
      content: Update an existing registry in Mittwald.
lastUpdated: 2026-01-23
---
## Overview

Update an existing registry in Mittwald.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `registryId` | `string` | Yes | ID of the registry to update |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `description` | `string` | No | New description for the registry |
| `uri` | `string` | No | New URI for the registry |
| `username` | `string` | No | Username for registry authentication |
| `password` | `string` | No | Password for registry authentication |

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

