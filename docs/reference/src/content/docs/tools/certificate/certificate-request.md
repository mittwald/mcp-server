---
title: Request SSL Certificate
description: Request a new SSL/TLS certificate for a domain using Let's Encrypt.
sidebar:
  label: Request SSL Certificate
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Request SSL Certificate
  - tag: meta
    attrs:
      name: og:description
      content: Request a new SSL/TLS certificate for a domain using Let's Encrypt.
lastUpdated: 2026-01-23
---
## Overview

Request a new SSL/TLS certificate for a domain using Let's Encrypt.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project; this flag is optional if a default project is set in the context |
| `domain` | `string` | Yes | Domain name to request a certificate for |
| `autoRenew` | `boolean` | No | Enable automatic renewal of the certificate (default: true) |
| `subdomains` | `array` | No | Additional subdomains to include in the certificate (e.g., www, api) |

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

