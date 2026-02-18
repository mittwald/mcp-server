---
title: List Installed Extensions
description: List installed extensions in a project or organization.
sidebar:
  label: List Installed Extensions
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Installed Extensions
  - tag: meta
    attrs:
      name: og:description
      content: List installed extensions in a project or organization.
lastUpdated: 2026-01-23
---
## Overview

List installed extensions in a project or organization.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID of the project to list installed extensions for |
| `orgId` | `string` | No | ID of the organization to list installed extensions for |
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

