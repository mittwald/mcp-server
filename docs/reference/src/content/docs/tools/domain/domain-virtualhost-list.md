---
title: List Virtual Hosts
description: List domain virtualhosts.
sidebar:
  label: List Virtual Hosts
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Virtual Hosts
  - tag: meta
    attrs:
      name: og:description
      content: List domain virtualhosts.
lastUpdated: 2026-01-23
---
## Overview

List domain virtualhosts.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project; this argument is optional if a default project is set in the context |
| `all` | `boolean` | No | Show all virtualhosts across all projects |
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

