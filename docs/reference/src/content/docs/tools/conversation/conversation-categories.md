---
title: List Conversation Categories
description: List conversation categories.
sidebar:
  label: List Conversation Categories
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Conversation Categories
  - tag: meta
    attrs:
      name: og:description
      content: List conversation categories.
lastUpdated: 2026-01-23
---
## Overview

List conversation categories.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `output` | `txt \| json \| yaml \| csv \| tsv` | No | Output format (txt, json, yaml, csv, tsv) |
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

