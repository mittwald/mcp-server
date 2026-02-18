---
title: Create Registry
description: Create a new registry in Mittwald.
sidebar:
  label: Create Registry
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create Registry
  - tag: meta
    attrs:
      name: og:description
      content: Create a new registry in Mittwald.
lastUpdated: 2026-01-23
---
## Overview

Create a new registry in Mittwald.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uri` | `string` | Yes | URI of the registry |
| `description` | `string` | Yes | Description of the registry |
| `projectId` | `string` | Yes | ID or short ID of a project |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
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

