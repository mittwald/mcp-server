---
title: Get Delivery Box Details
description: Get a specific delivery box.
sidebar:
  label: Get Delivery Box Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Delivery Box Details
  - tag: meta
    attrs:
      name: og:description
      content: Get a specific delivery box.
lastUpdated: 2026-01-23
---
## Overview

Get a specific delivery box.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | ID of the delivery box to retrieve |
| `output` | `txt \| json \| yaml` | No | Output format |

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

