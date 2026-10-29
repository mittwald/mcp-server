import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../../src/server/session-manager.js', () => ({
  sessionManager: {
    getSession: vi.fn(),
  },
}));

vi.mock('../../../../../../src/utils/pending-domain-orders.js', () => ({
  takePendingDomainOrder: vi.fn(),
}));

vi.mock('../../../../../../src/utils/user-confirmation.js', () => ({
  requestUserConfirmation: vi.fn(),
}));

vi.mock('@mittwald-mcp/cli-core', async () => {
  const actual = await vi.importActual<typeof import('@mittwald-mcp/cli-core')>('@mittwald-mcp/cli-core');

  return {
    ...actual,
    orderDomain: vi.fn(),
  };
});

const { handleDomainOrderCli } = await import('../../../../../../src/handlers/tools/mittwald-cli/domain/order-cli.js');
const { sessionManager } = await import('../../../../../../src/server/session-manager.js');
const { takePendingDomainOrder } = await import('../../../../../../src/utils/pending-domain-orders.js');
const { requestUserConfirmation } = await import('../../../../../../src/utils/user-confirmation.js');
const { orderDomain } = await import('@mittwald-mcp/cli-core');

const mockGetSession = sessionManager.getSession as unknown as vi.Mock;
const mockTakePendingDomainOrder = takePendingDomainOrder as unknown as vi.Mock;
const mockRequestUserConfirmation = requestUserConfirmation as unknown as vi.Mock;
const mockOrderDomain = orderDomain as unknown as vi.Mock;

const pendingOrder = {
  userId: 'user-1',
  domain: 'example.de',
  projectId: 'p-1',
  owner: {
    type: 'person',
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

const parse = (result: { content: Array<{ text: string }> }) => JSON.parse(result.content[0].text);

describe('handleDomainOrderCli', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetSession.mockResolvedValue({ userId: 'user-1', mittwaldAccessToken: 'token-123' });
    mockTakePendingDomainOrder.mockResolvedValue(pendingOrder);
    mockOrderDomain.mockResolvedValue({ data: { orderId: 'o-1' }, durationMs: 1 });
  });

  it('places exactly the previewed order after the user confirmed it', async () => {
    mockRequestUserConfirmation.mockResolvedValue({ outcome: 'confirmed' });

    const result = await handleDomainOrderCli({ confirmationToken: 'token' }, 'session-1');

    expect(mockTakePendingDomainOrder).toHaveBeenCalledWith('token', 'user-1');
    expect(mockRequestUserConfirmation).toHaveBeenCalledWith(
      expect.stringContaining('Total: 13.67 EUR'),
      'Order example.de for 13.67 EUR'
    );
    expect(mockOrderDomain).toHaveBeenCalledWith({
      domain: 'example.de',
      projectId: 'p-1',
      authCode: undefined,
      ownerHandle: pendingOrder.ownerHandle,
      apiToken: 'token-123',
    });
    expect(result.isError).toBe(false);
    expect(parse(result).message).toContain('noreply@mittwald.de');
    expect(parse(result).data).toMatchObject({ orderId: 'o-1', confirmedVia: 'elicitation' });
  });

  it('orders on clients without elicitation support', async () => {
    mockRequestUserConfirmation.mockResolvedValue({ outcome: 'unsupported' });

    const result = await handleDomainOrderCli({ confirmationToken: 'token' }, 'session-1');

    expect(mockOrderDomain).toHaveBeenCalled();
    expect(parse(result).data.confirmedVia).toBe('agent');
  });

  it('does not order if the user rejects', async () => {
    mockRequestUserConfirmation.mockResolvedValue({ outcome: 'rejected', reason: 'The user chose to decline.' });

    const result = await handleDomainOrderCli({ confirmationToken: 'token' }, 'session-1');

    expect(mockOrderDomain).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(parse(result).message).toContain('NOT ordered');
  });

  it('does not order with an unknown or expired token', async () => {
    mockTakePendingDomainOrder.mockResolvedValue(null);

    const result = await handleDomainOrderCli({ confirmationToken: 'token' }, 'session-1');

    expect(mockRequestUserConfirmation).not.toHaveBeenCalled();
    expect(mockOrderDomain).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
  });
});
