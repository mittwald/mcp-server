---
title: "List App Upgrade Candidates"
description: "List upgrade candidates for an app installation."
sidebar:
  label: "List App Upgrade Candidates"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List App Upgrade Candidates"
  - tag: meta
    attrs:
      name: og:description
      content: "List upgrade candidates for an app installation."
lastUpdated: 2026-07-23
---
## Overview

List upgrade candidates for an app installation.

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

