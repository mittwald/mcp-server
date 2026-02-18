---
title: List MySQL Users
description: List MySQL users for a database.
sidebar:
  label: List MySQL Users
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List MySQL Users
  - tag: meta
    attrs:
      name: og:description
      content: List MySQL users for a database.
lastUpdated: 2026-01-23
---
## Overview

List MySQL users for a database.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `databaseId` | `string` | Yes | ID or short ID of the MySQL database to list users for. |
| `outputFormat` | `json \| yaml \| txt \| csv \| tsv` | No | Preferred CLI output format. JSON enables structured responses. |
| `extended` | `boolean` | No | Include extended columns such as access level. |
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

