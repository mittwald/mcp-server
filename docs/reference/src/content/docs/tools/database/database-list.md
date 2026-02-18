---
title: List Databases
description: List all databases.
sidebar:
  label: List Databases
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Databases
  - tag: meta
    attrs:
      name: og:description
      content: List all databases.
lastUpdated: 2026-01-23
---
## Overview

List all databases.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | Optional project ID to filter databases by project |
| `output` | `txt \| json \| yaml \| csv \| tsv` | No | Output format (default: json for structured data) |
| `extended` | `boolean` | No | Show extended information |
| `noHeader` | `boolean` | No | Omit header row |
| `noTruncate` | `boolean` | No | Do not truncate output |
| `noRelativeDates` | `boolean` | No | Show absolute dates instead of relative dates |
| `csvSeparator` | `, \| ;` | No | CSV separator character |

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

