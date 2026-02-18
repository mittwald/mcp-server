---
title: Install TYPO3
description: Install TYPO3 application.
sidebar:
  label: Install TYPO3
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Install TYPO3
  - tag: meta
    attrs:
      name: og:description
      content: Install TYPO3 application.
lastUpdated: 2026-01-23
---
## Overview

Install TYPO3 application.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |
| `version` | `string` | No | TYPO3 version to install (defaults to latest if not specified) |
| `installMode` | `composer \| symlink` | No | Installation mode (composer or symlink, defaults to composer if not specified) |
| `host` | `string` | No | Host to configure the app with |
| `adminUser` | `string` | No | Administrator username |
| `adminEmail` | `string` | No | Administrator email |
| `adminPass` | `string` | No | Administrator password |
| `siteTitle` | `string` | No | Title for the TYPO3 installation |
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

