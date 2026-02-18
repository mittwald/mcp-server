---
title: Get Session Details
description: Get a specific session.. Retrieves information about a specific user session.
sidebar:
  label: Get Session Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Session Details
  - tag: meta
    attrs:
      name: og:description
      content: Get a specific session.. Retrieves information about a specific user session.
lastUpdated: 2026-01-23
---
## Overview

Get a specific session.. Retrieves information about a specific user session.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | `string` | Yes | Token ID to identify the specific session |
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

