---
title: List MySQL Versions
description: List available MySQL versions.
sidebar:
  label: List MySQL Versions
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List MySQL Versions
  - tag: meta
    attrs:
      name: og:description
      content: List available MySQL versions.
lastUpdated: 2026-01-23
---
## Overview

List available MySQL versions.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `output` | `txt \| json \| yaml \| csv \| tsv` | No | Output format (default: json for structured data) |
| `extended` | `boolean` | No | Show extended information |
| `noHeader` | `boolean` | No | Hide table header (only relevant for txt output) |
| `noTruncate` | `boolean` | No | Do not truncate output (only relevant for txt output) |
| `noRelativeDates` | `boolean` | No | Show dates in absolute format, not relative (only relevant for txt output) |
| `csvSeparator` | `, \| ;` | No | Separator for CSV output (only relevant for CSV output) |

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

