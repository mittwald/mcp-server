import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
const mockSet = vi.fn(async (key: string, value: string) => {
  store.set(key, value);
  return 'OK';
});

vi.mock('../../../src/utils/redis-client.js', () => ({
  redisClient: {
    set: (key: string, value: string, ttl?: number) => mockSet(key, value, ttl),
    getClient: () => ({
      getdel: async (key: string) => {
        const value = store.get(key) ?? null;
        store.delete(key);
        return value;
      },
    }),
  },
}));

const { PENDING_DOMAIN_ORDER_TTL_SECONDS, storePendingDomainOrder, takePendingDomainOrder } = await import(
  '../../../src/utils/pending-domain-orders.js'
);

const order = {
  userId: 'user-1',
  domain: 'example.de',
  projectId: 'p-1',
  owner: {
    type: 'person' as const,
    name: 'Max Mustermann',
    email: 'max@example.com',
    street: 'Musterstraße 12',
    postalCode: '32312',
    city: 'Espelkamp',
    country: 'DE',
    phone: '+49 5772 2930',
  },
  ownerHandle: [{ name: 'name', value: 'Max Mustermann' }],
  price: { domainPrice: 1068, feePrice: 299, totalPrice: 1367, contractDurationInMonths: 12 },
};

describe('pending domain orders', () => {
  beforeEach(() => {
    store.clear();
    mockSet.mockClear();
  });

  it('stores orders with a TTL', async () => {
    await storePendingDomainOrder(order);

    expect(mockSet).toHaveBeenCalledWith(expect.any(String), JSON.stringify(order), PENDING_DOMAIN_ORDER_TTL_SECONDS);
  });

  it('hands out each order only once', async () => {
    const token = await storePendingDomainOrder(order);

    await expect(takePendingDomainOrder(token, 'user-1')).resolves.toEqual(order);
    await expect(takePendingDomainOrder(token, 'user-1')).resolves.toBeNull();
  });

  it('does not hand out orders of other users', async () => {
    const token = await storePendingDomainOrder(order);

    await expect(takePendingDomainOrder(token, 'user-2')).resolves.toBeNull();
  });

  it('returns null for unknown tokens', async () => {
    await expect(takePendingDomainOrder('unknown', 'user-1')).resolves.toBeNull();
  });
});
