---
title: List MySQL Character Sets
description: List available MySQL character sets and collations.
sidebar:
  label: List MySQL Character Sets
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List MySQL Character Sets
  - tag: meta
    attrs:
      name: og:description
      content: List available MySQL character sets and collations.
lastUpdated: 2026-01-23
---
## Overview

List available MySQL character sets and collations.

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

