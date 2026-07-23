---
title: "Get MySQL Import Instructions"
description: "Get a ready-to-run command that imports a local dump file into a MySQL database via SSH. This tool does not import anything itself - run the returned command locally. Note that running the returned command overwrites data in the target database."
sidebar:
  label: "Get MySQL Import Instructions"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "Get MySQL Import Instructions"
  - tag: meta
    attrs:
      name: og:description
      content: "Get a ready-to-run command that imports a local dump file into a MySQL database via SSH. This tool does not import anything itself - run the returned command locally. Note that running the returned command overwrites data in the target database."
lastUpdated: 2026-07-23
---
## Overview

Get a ready-to-run command that imports a local dump file into a MySQL database via SSH. This tool does not import anything itself - run the returned command locally. Note that running the returned command overwrites data in the target database.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `databaseId` | `string` | Yes | The ID or name of the database |
| `input` | `string` | No | Local dump file to import; defaults to <database>.sql (or .sql.gz with gzip) |
| `mysqlPassword` | `string` | No | Password of the MySQL user; if omitted, the returned command contains a placeholder to fill in |
| `mysqlCharset` | `string` | No | Character set for the MySQL connection; defaults to the database's own character set |
| `gzip` | `boolean` | No | The input file is gzip-compressed and should be decompressed while importing |
| `sshUser` | `string` | No | Override the SSH user to connect with; if omitted, your own mStudio user will be used |
| `sshIdentityFile` | `string` | No | The SSH identity file (private key) to include in the returned ssh command |

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

