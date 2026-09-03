---
title: "List Stacks"
description: "List stacks for a given project. Environment variable values on each service are redacted by default; pass revealEnvironmentVariables=true to include their real values."
sidebar:
  label: "List Stacks"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Stacks"
  - tag: meta
    attrs:
      name: og:description
      content: "List stacks for a given project. Environment variable values on each service are redacted by default; pass revealEnvironmentVariables=true to include their real values."
lastUpdated: 2026-08-31
---
## Overview

List stacks for a given project. Environment variable values on each service are redacted by default; pass revealEnvironmentVariables=true to include their real values.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |
| `revealEnvironmentVariables` | `boolean` | No | Include real environment variable values (which may contain secrets) instead of redacting them. Defaults to false. |

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

