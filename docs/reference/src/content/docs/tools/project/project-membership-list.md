---
title: List Project Members
description: List project memberships.
sidebar:
  label: List Project Members
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Project Members
  - tag: meta
    attrs:
      name: og:description
      content: List project memberships.
lastUpdated: 2026-01-23
---
## Overview

List project memberships.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |
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

