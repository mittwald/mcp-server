---
title: List Stack Services
description: List all services within a given stack.
sidebar:
  label: List Stack Services
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Stack Services
  - tag: meta
    attrs:
      name: og:description
      content: List all services within a given stack.
lastUpdated: 2026-01-23
---
## Overview

List all services within a given stack.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `stackId` | `string` | No | ID of a stack |
| `projectId` | `string` | No | ID of the project containing the stack |
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

