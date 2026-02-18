---
title: List My API Tokens
description: List all API tokens of the user.. Shows all API tokens belonging to the current user.
sidebar:
  label: List My API Tokens
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List My API Tokens
  - tag: meta
    attrs:
      name: og:description
      content: List all API tokens of the user.. Shows all API tokens belonging to the current user.
lastUpdated: 2026-01-23
---
## Overview

List all API tokens of the user.. Shows all API tokens belonging to the current user.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `output` | `txt \| json \| yaml \| csv \| tsv` | No | Output format (default: txt) |
| `extended` | `boolean` | No | Show extended information |
| `noHeader` | `boolean` | No | Hide table header |
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

