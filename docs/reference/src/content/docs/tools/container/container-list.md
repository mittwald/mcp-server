---
title: List Containers
description: List containers belonging to a project.
sidebar:
  label: List Containers
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Containers
  - tag: meta
    attrs:
      name: og:description
      content: List containers belonging to a project.
lastUpdated: 2026-01-23
---
## Overview

List containers belonging to a project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project (optional if default project is set in context) |
| `output` | `txt \| json \| yaml \| csv \| tsv` | No | Output format (default: txt) |
| `extended` | `boolean` | No | Show extended information |
| `noHeader` | `boolean` | No | Hide table header (only relevant for table output) |
| `noTruncate` | `boolean` | No | Do not truncate output (only relevant for table output) |
| `noRelativeDates` | `boolean` | No | Show dates in absolute format, not relative |
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

