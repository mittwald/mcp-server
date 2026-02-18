---
title: Get Session Context
description: Get current user context from Redis session (session-aware, multi-tenant safe)
sidebar:
  label: Get Session Context
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Session Context
  - tag: meta
    attrs:
      name: og:description
      content: Get current user context from Redis session (session-aware, multi-tenant safe)
lastUpdated: 2026-01-23
---
## Overview

Get current user context from Redis session (session-aware, multi-tenant safe)

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `output` | `txt \| json \| yaml` | No | The output format to use; use "txt" for a human readable text representation, "json" for a machine-readable JSON representation, or "yaml" for YAML format |

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

