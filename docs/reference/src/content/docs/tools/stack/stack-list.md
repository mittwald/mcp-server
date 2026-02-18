---
title: List Stacks
description: List stacks for a given project.
sidebar:
  label: List Stacks
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Stacks
  - tag: meta
    attrs:
      name: og:description
      content: List stacks for a given project.
lastUpdated: 2026-01-23
---
## Overview

List stacks for a given project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |
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

