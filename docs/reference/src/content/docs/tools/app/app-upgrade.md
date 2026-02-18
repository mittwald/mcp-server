---
title: Upgrade App Version
description: Upgrade app installation to target version.
sidebar:
  label: Upgrade App Version
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Upgrade App Version
  - tag: meta
    attrs:
      name: og:description
      content: Upgrade app installation to target version.
lastUpdated: 2026-01-23
---
## Overview

Upgrade app installation to target version.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `installationId` | `string` | Yes | ID or short ID of an app installation; this argument is optional if a default app installation is set in the context |
| `targetVersion` | `string` | No | Target version to upgrade app to; if omitted, target version will be prompted interactively |
| `force` | `boolean` | No | Do not ask for confirmation |
| `projectId` | `string` | Yes | ID or short ID of a project; this flag is optional if a default project is set in the context |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `wait` | `boolean` | No | Wait for the resource to be ready |
| `waitTimeout` | `string` | No | The duration to wait for the resource to be ready (common units like ms, s, m are accepted) |

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

