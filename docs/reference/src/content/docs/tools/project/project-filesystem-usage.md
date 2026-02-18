---
title: Get Filesystem Usage
description: Get a project directory filesystem usage.
sidebar:
  label: Get Filesystem Usage
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Filesystem Usage
  - tag: meta
    attrs:
      name: og:description
      content: Get a project directory filesystem usage.
lastUpdated: 2026-01-23
---
## Overview

Get a project directory filesystem usage.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |
| `output` | `txt \| json \| yaml` | No | Output format |
| `human` | `boolean` | No | Display human readable sizes |

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

