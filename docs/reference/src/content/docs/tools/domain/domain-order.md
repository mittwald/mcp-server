---
title: "Order Domain"
description: "Order (register or transfer) a domain. This costs money. Only call this after you showed the overview from mittwald_domain_order_preview to the user and the user explicitly approved the order. The order is placed exactly as previewed; to change anything, run the preview again. Depending on the client, the user is asked to confirm the order once more."
sidebar:
  label: "Order Domain"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "Order Domain"
  - tag: meta
    attrs:
      name: og:description
      content: "Order (register or transfer) a domain. This costs money. Only call this after you showed the overview from mittwald_domain_order_preview to the user and the user explicitly approved the order. The order is placed exactly as previewed; to change anything, run the preview again. Depending on the client, the user is asked to confirm the order once more."
lastUpdated: 2026-10-29
---
## Overview

Order (register or transfer) a domain. This costs money. Only call this after you showed the overview from mittwald_domain_order_preview to the user and the user explicitly approved the order. The order is placed exactly as previewed; to change anything, run the preview again. Depending on the client, the user is asked to confirm the order once more.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `confirmationToken` | `string` | Yes | confirmationToken returned by mittwald_domain_order_preview; it can be used only once |

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

