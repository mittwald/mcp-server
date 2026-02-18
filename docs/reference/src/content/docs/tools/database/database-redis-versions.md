---
title: List Redis Versions
description: List available Redis versions for deployment.
sidebar:
  label: List Redis Versions
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Redis Versions
  - tag: meta
    attrs:
      name: og:description
      content: List available Redis versions for deployment.
lastUpdated: 2026-01-23
---
## Overview

List available Redis versions for deployment.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | No | Optional project context used to filter available versions. |
| `outputFormat` | `json \| yaml \| txt \| csv \| tsv` | No | Preferred CLI output format. JSON enables structured responses. |
| `extended` | `boolean` | No | Include additional metadata about each version. |
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

