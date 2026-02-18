---
title: Create MySQL User
description: Create a new MySQL user for a database.
sidebar:
  label: Create MySQL User
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create MySQL User
  - tag: meta
    attrs:
      name: og:description
      content: Create a new MySQL user for a database.
lastUpdated: 2026-01-23
---
## Overview

Create a new MySQL user for a database.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `databaseId` | `string` | Yes | ID or short ID of the MySQL database (format: mysql-XXXXX). |
| `description` | `string` | No | Friendly description shown in mStudio (defaults to username when provided). |
| `username` | `string` | No | Optional alias for description when creating the MySQL user. |
| `accessLevel` | `readonly \| full` | No | Access permissions for the MySQL user (defaults to full). |
| `password` | `string` | No | Password for the MySQL user. A secure password is generated when omitted. |
| `enableExternalAccess` | `boolean` | No | Enable external access for this MySQL user. |
| `accessIpMask` | `string` | No | Restrict external access to a specific IPv4/IPv6 address or CIDR mask. |
| `quiet` | `boolean` | No | Request quiet CLI output (recommended for machine-readable responses). |

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

