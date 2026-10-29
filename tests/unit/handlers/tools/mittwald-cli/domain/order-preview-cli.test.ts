import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../../src/server/session-manager.js', () => ({
  sessionManager: {
    getSession: vi.fn(),
  },
}));

vi.mock('../../../../../../src/utils/pending-domain-orders.js', () => ({
  PENDING_DOMAIN_ORDER_TTL_SECONDS: 900,
  storePendingDomainOrder: vi.fn(),
}));

vi.mock('@mittwald-mcp/cli-core', async () => {
  const actual = await vi.importActual<typeof import('@mittwald-mcp/cli-core')>('@mittwald-mcp/cli-core');

  return {
    ...actual,
    buildDomainOwnerHandle: vi.fn(),
    previewDomainOrder: vi.fn(),
    orderDomain: vi.fn(),
  };
});

const { handleDomainOrderPreviewCli } = await import(
  '../../../../../../src/handlers/tools/mittwald-cli/domain/order-preview-cli.js'
);
const { sessionManager } = await import('../../../../../../src/server/session-manager.js');
const { storePendingDomainOrder } = await import('../../../../../../src/utils/pending-domain-orders.js');
const { buildDomainOwnerHandle, LibraryError, orderDomain, previewDomainOrder } = await import('@mittwald-mcp/cli-core');

const mockGetSession = sessionManager.getSession as unknown as vi.Mock;
const mockStorePendingDomainOrder = storePendingDomainOrder as unknown as vi.Mock;
const mockBuildDomainOwnerHandle = buildDomainOwnerHandle as unknown as vi.Mock;
const mockPreviewDomainOrder = previewDomainOrder as unknown as vi.Mock;

const owner = {
  type: 'person' as const,
  name: 'Max Mustermann',
  email: 'max@example.com',
  street: 'Musterstraße 12',
  postalCode: '32312',
  city: 'Espelkamp',
  country: 'DE',
  phone: '+49 5772 2930',
};
const ownerHandle = [{ name: 'name', value: 'Max Mustermann' }];

const parse = (result: { content: Array<{ text: string }> }) => JSON.parse(result.content[0].text);

describe('handleDomainOrderPreviewCli', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetSession.mockResolvedValue({ userId: 'user-1', mittwaldAccessToken: 'token-123' });
    mockBuildDomainOwnerHandle.mockResolvedValue({ data: { tld: 'de', fields: ownerHandle }, durationMs: 1 });
    mockPreviewDomainOrder.mockResolvedValue({
      data: { domainPrice: 1068, feePrice: 299, totalPrice: 1367, contractDurationInMonths: 12 },
      durationMs: 1,
    });
    mockStorePendingDomainOrder.mockResolvedValue('confirmation-token');
  });

  it('stores the previewed order for the current user and returns the overview', async () => {
    const result = await handleDomainOrderPreviewCli(
      { domain: 'Example.de', projectId: 'p-1', owner },
      'session-1'
    );

    expect(mockStorePendingDomainOrder).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', domain: 'example.de', tld: 'de', projectId: 'p-1', owner, ownerHandle })
    );
    expect(orderDomain).not.toHaveBeenCalled();

    const response = parse(result);
    expect(response.message).toContain('Nothing has been ordered yet');
    expect(response.data.confirmationToken).toBe('confirmation-token');
    expect(response.data.overview).toMatchObject({
      domain: 'example.de',
      orderType: 'registration',
      price: { domain: '10.68 EUR', fee: '2.99 EUR', total: '13.67 EUR' },
      contractDurationInMonths: 12,
      verificationEmail: expect.stringContaining('noreply@mittwald.de and must be confirmed within 7 days'),
    });
  });

  it('tells the user that the registrar sends the verification email for other TLDs', async () => {
    mockBuildDomainOwnerHandle.mockResolvedValue({ data: { tld: 'com', fields: ownerHandle }, durationMs: 1 });

    const result = await handleDomainOrderPreviewCli({ domain: 'example.com', projectId: 'p-1', owner }, 'session-1');

    const { verificationEmail } = parse(result).data.overview;
    expect(verificationEmail).toContain('our registrar sends a verification email');
    expect(verificationEmail).toContain('within the deadline stated in the email');
    expect(verificationEmail).not.toContain('noreply@mittwald.de');
  });

  it('returns owner validation errors without storing anything', async () => {
    mockBuildDomainOwnerHandle.mockRejectedValue(new LibraryError('Invalid domain owner: phone is invalid', 400));

    const result = await handleDomainOrderPreviewCli({ domain: 'example.de', projectId: 'p-1', owner }, 'session-1');

    expect(result.isError).toBe(true);
    expect(parse(result).message).toBe('Invalid domain owner: phone is invalid');
    expect(mockStorePendingDomainOrder).not.toHaveBeenCalled();
  });
});
