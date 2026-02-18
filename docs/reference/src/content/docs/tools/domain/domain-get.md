---
title: Get Domain Info
description: Get domain information..
sidebar:
  label: Get Domain Info
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Domain Info
  - tag: meta
    attrs:
      name: og:description
      content: Get domain information..
lastUpdated: 2026-01-23
---
## Overview

Get domain information..

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainId` | `string` | Yes | The domain ID |
| `output` | `txt \| json \| yaml` | No | Output format (internally converted to JSON for processing) |

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

