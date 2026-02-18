---
title: Install Nextcloud
description: Install Nextcloud application.
sidebar:
  label: Install Nextcloud
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Install Nextcloud
  - tag: meta
    attrs:
      name: og:description
      content: Install Nextcloud application.
lastUpdated: 2026-01-23
---
## Overview

Install Nextcloud application.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |
| `version` | `string` | No | Nextcloud version to install (defaults to latest if not specified) |
| `host` | `string` | No | Host to configure the app with |
| `adminUser` | `string` | No | Administrator username |
| `adminEmail` | `string` | No | Administrator email |
| `adminPass` | `string` | No | Administrator password |
| `siteTitle` | `string` | No | Title for the Nextcloud installation |
| `quiet` | `boolean` | No | Only output the installation ID |
| `wait` | `boolean` | No | Wait for installation to complete |
| `waitTimeout` | `number` | No | Maximum time to wait in seconds |

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

