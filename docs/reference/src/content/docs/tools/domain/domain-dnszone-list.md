---
title: List DNS Zones
description: List DNS zones for a project..
sidebar:
  label: List DNS Zones
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List DNS Zones
  - tag: meta
    attrs:
      name: og:description
      content: List DNS zones for a project..
lastUpdated: 2026-01-23
---
## Overview

List DNS zones for a project..

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |
| `output` | `txt \| json \| yaml \| csv \| tsv` | No | Output format (internally converted to JSON for processing) |
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

