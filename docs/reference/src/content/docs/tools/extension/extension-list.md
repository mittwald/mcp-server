---
title: List Available Extensions
description: List all available extensions.
sidebar:
  label: List Available Extensions
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Available Extensions
  - tag: meta
    attrs:
      name: og:description
      content: List all available extensions.
lastUpdated: 2026-01-23
---
## Overview

List all available extensions.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `output` | `txt \| json \| yaml \| csv \| tsv` | No | Output format |
| `extended` | `boolean` | No | Show extended information |
| `noHeader` | `boolean` | No | Hide table header |
| `noTruncate` | `boolean` | No | Do not truncate output |
| `noRelativeDates` | `boolean` | No | Show dates in absolute format |
| `csvSeparator` | `, \| ;` | No | Separator for CSV output |

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

