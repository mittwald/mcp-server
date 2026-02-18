---
title: List My SSH Keys
description: Get your stored SSH keys.. Lists all SSH keys for the current user.
sidebar:
  label: List My SSH Keys
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List My SSH Keys
  - tag: meta
    attrs:
      name: og:description
      content: Get your stored SSH keys.. Lists all SSH keys for the current user.
lastUpdated: 2026-01-23
---
## Overview

Get your stored SSH keys.. Lists all SSH keys for the current user.

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

