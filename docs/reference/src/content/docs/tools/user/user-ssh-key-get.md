---
title: Get SSH Key Details
description: Get a specific SSH key.. Retrieves information about a specific SSH key.
sidebar:
  label: Get SSH Key Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get SSH Key Details
  - tag: meta
    attrs:
      name: og:description
      content: Get a specific SSH key.. Retrieves information about a specific SSH key.
lastUpdated: 2026-01-23
---
## Overview

Get a specific SSH key.. Retrieves information about a specific SSH key.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyId` | `string` | Yes | The ID of an SSH key |
| `output` | `txt \| json \| yaml` | No | Output format (default: txt) |

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

