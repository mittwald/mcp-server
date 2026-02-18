---
title: List SFTP Users
description: List all SFTP users for a project.
sidebar:
  label: List SFTP Users
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List SFTP Users
  - tag: meta
    attrs:
      name: og:description
      content: List all SFTP users for a project.
lastUpdated: 2026-01-23
---
## Overview

List all SFTP users for a project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project; this flag is optional if a default project is set in the context |
| `output` | `txt \| json \| yaml \| csv \| tsv` | No | Output in a more machine friendly format |
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

