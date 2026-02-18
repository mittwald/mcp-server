---
title: Get Mail Address Details
description: Get a specific mail address.
sidebar:
  label: Get Mail Address Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Mail Address Details
  - tag: meta
    attrs:
      name: og:description
      content: Get a specific mail address.
lastUpdated: 2026-01-23
---
## Overview

Get a specific mail address.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | ID of the mail address to retrieve |
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

