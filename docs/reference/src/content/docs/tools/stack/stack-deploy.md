---
title: Deploy Stack
description: Deploy a docker-compose compatible file to a Mittwald stack.
sidebar:
  label: Deploy Stack
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Deploy Stack
  - tag: meta
    attrs:
      name: og:description
      content: Deploy a docker-compose compatible file to a Mittwald stack.
lastUpdated: 2026-01-23
---
## Overview

Deploy a docker-compose compatible file to a Mittwald stack.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `stackId` | `string` | No | ID of a stack |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `composeFile` | `string` | No | Path to a compose file, or "-" to read from stdin |
| `envFile` | `string` | No | Alternative path to file with environment variables |

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

