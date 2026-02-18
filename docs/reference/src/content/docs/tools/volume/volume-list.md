---
title: List Volumes
description: List persistent volumes that belong to a project stack.
sidebar:
  label: List Volumes
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Volumes
  - tag: meta
    attrs:
      name: og:description
      content: List persistent volumes that belong to a project stack.
lastUpdated: 2026-01-23
---
## Overview

List persistent volumes that belong to a project stack.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | Project ID to inspect (format: p-xxxxx). |
| `extended` | `boolean` | No | Include extended information returned by the Mittwald CLI. |
| `noHeader` | `boolean` | No | Hide table header in textual CLI output. |
| `noTruncate` | `boolean` | No | Do not truncate columns in textual CLI output. |
| `noRelativeDates` | `boolean` | No | Show absolute dates instead of relative ones. |
| `csvSeparator` | `, \| ;` | No | Separator used for CSV exports. |

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

