---
title: Get API Token Details
description: Get a specific API token.. Retrieves information about a specific API token.
sidebar:
  label: Get API Token Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get API Token Details
  - tag: meta
    attrs:
      name: og:description
      content: Get a specific API token.. Retrieves information about a specific API token.
lastUpdated: 2026-01-23
---
## Overview

Get a specific API token.. Retrieves information about a specific API token.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | `string` | Yes | The ID of an API token |
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

