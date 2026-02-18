---
title: List Redis Databases
description: List Redis databases for a project.
sidebar:
  label: List Redis Databases
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Redis Databases
  - tag: meta
    attrs:
      name: og:description
      content: List Redis databases for a project.
lastUpdated: 2026-01-23
---
## Overview

List Redis databases for a project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | Project ID or short ID used to filter Redis databases. |
| `outputFormat` | `json \| yaml \| txt \| csv \| tsv` | No | Preferred CLI output format. JSON enables structured responses. |
| `extended` | `boolean` | No | Include extended columns such as status and hostname. |
| `noHeader` | `boolean` | No | Hide table headers for text and CSV output. |
| `noTruncate` | `boolean` | No | Disable truncation for wide text output. |
| `noRelativeDates` | `boolean` | No | Show absolute timestamps instead of relative strings. |
| `csvSeparator` | `, \| ;` | No | Custom separator for CSV output. |

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

