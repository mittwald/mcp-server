import { randomUUID } from 'node:crypto';
import type { DomainOrderPreview, DomainOwner, DomainOwnerHandleField } from '@mittwald-mcp/cli-core';
import { redisClient } from './redis-client.js';

/**
 * Previewed domain orders, keyed by the confirmation token handed to the agent.
 *
 * `mittwald_domain_order` only accepts such a token, so the order that is
 * placed is exactly the one the user saw in the preview.
 */

export const PENDING_DOMAIN_ORDER_TTL_SECONDS = 15 * 60;

export interface PendingDomainOrder {
  userId: string;
  domain: string;
  projectId: string;
  authCode?: string;
  owner: DomainOwner;
  ownerHandle: DomainOwnerHandleField[];
  price: DomainOrderPreview;
}

function key(token: string): string {
  return `domain-order:${token}`;
}

export async function storePendingDomainOrder(order: PendingDomainOrder): Promise<string> {
  const token = randomUUID();
  await redisClient.set(key(token), JSON.stringify(order), PENDING_DOMAIN_ORDER_TTL_SECONDS);
  return token;
}

/**
 * Returns the pending order and invalidates its token, so that a token can
 * never be used for more than one order. Returns null for unknown, expired or
 * foreign tokens.
 */
export async function takePendingDomainOrder(token: string, userId: string): Promise<PendingDomainOrder | null> {
  const raw = await redisClient.getClient().getdel(key(token));
  if (!raw) {
    return null;
  }
  const order = JSON.parse(raw) as PendingDomainOrder;
  return order.userId === userId ? order : null;
}
