---
title: Get DNS Zone Details
description: Get DNS zone information..
sidebar:
  label: Get DNS Zone Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get DNS Zone Details
  - tag: meta
    attrs:
      name: og:description
      content: Get DNS zone information..
lastUpdated: 2026-01-23
---
## Overview

Get DNS zone information..

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dnszoneId` | `string` | Yes | The DNS zone ID |
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

