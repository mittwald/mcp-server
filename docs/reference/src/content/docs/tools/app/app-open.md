---
title: Open App in Browser
description: Open an app installation in the browser.
sidebar:
  label: Open App in Browser
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Open App in Browser
  - tag: meta
    attrs:
      name: og:description
      content: Open an app installation in the browser.
lastUpdated: 2026-01-23
---
## Overview

Open an app installation in the browser.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `installationId` | `string` | Yes | ID or short ID of an app installation; this argument is optional if a default app installation is set in the context |

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

