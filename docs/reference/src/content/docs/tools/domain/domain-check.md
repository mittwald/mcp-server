---
title: "Check Domain Availability"
description: "Check whether a domain can be registered (or, if it is taken, transferred) at mittwald, and which owner details its domain ending requires. Use this before mittwald_domain_order_preview when a user wants to register or buy a domain."
sidebar:
  label: "Check Domain Availability"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "Check Domain Availability"
  - tag: meta
    attrs:
      name: og:description
      content: "Check whether a domain can be registered (or, if it is taken, transferred) at mittwald, and which owner details its domain ending requires. Use this before mittwald_domain_order_preview when a user wants to register or buy a domain."
lastUpdated: 2026-10-29
---
## Overview

Check whether a domain can be registered (or, if it is taken, transferred) at mittwald, and which owner details its domain ending requires. Use this before mittwald_domain_order_preview when a user wants to register or buy a domain.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | `string` | Yes | Fully qualified domain name, e.g. example.de |
| `authCode` | `string` | No | Auth code from the current registrar; only needed to check whether a taken domain can be transferred |

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

