---
title: List Projects
description: List all projects that you have access to.
sidebar:
  label: List Projects
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Projects
  - tag: meta
    attrs:
      name: og:description
      content: List all projects that you have access to.
lastUpdated: 2026-01-23
---
## Overview

List all projects that you have access to.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `output` | `txt \| json \| yaml \| csv \| tsv` | No | Output format |
| `extended` | `boolean` | No | Show extended information |
| `csvSeparator` | `, \| ;` | No | Separator for CSV output (only relevant for CSV output) |
| `noHeader` | `boolean` | No | Hide table header |
| `noRelativeDates` | `boolean` | No | Show dates in absolute format, not relative (only relevant for txt output) |
| `noTruncate` | `boolean` | No | Do not truncate output (only relevant for txt output) |

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

