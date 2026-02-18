---
title: List Servers
description: List servers for an organization or user.. Shows all servers accessible to the current user.
sidebar:
  label: List Servers
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Servers
  - tag: meta
    attrs:
      name: og:description
      content: List servers for an organization or user.. Shows all servers accessible to the current user.
lastUpdated: 2026-01-23
---
## Overview

List servers for an organization or user.. Shows all servers accessible to the current user.

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

