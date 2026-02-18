---
title: Open MySQL Shell
description: Connect to a MySQL database via the MySQL shell (provides command for interactive execution)
sidebar:
  label: Open MySQL Shell
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Open MySQL Shell
  - tag: meta
    attrs:
      name: og:description
      content: Connect to a MySQL database via the MySQL shell (provides command for interactive execution)
lastUpdated: 2026-01-23
---
## Overview

Connect to a MySQL database via the MySQL shell (provides command for interactive execution)

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `databaseId` | `string` | Yes | The ID or name of the database |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `sshUser` | `string` | No | Override the SSH user to connect with |
| `sshIdentityFile` | `string` | No | The SSH identity file (private key) to use for public key authentication |
| `mysqlPassword` | `string` | No | The password to use for the MySQL user (security risk - prefer environment variable MYSQL_PWD) |
| `mysqlCharset` | `string` | No | The character set to use for the MySQL connection |

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

