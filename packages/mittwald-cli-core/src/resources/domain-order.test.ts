import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListTlds = vi.fn();
const mockListTldContactSchemas = vi.fn();
const mockCheckDomainRegistrability = vi.fn();
const mockCheckDomainTransferability = vi.fn();
const mockOrderPreviewOrder = vi.fn();
const mockOrderCreateOrder = vi.fn();

vi.mock('@mittwald/api-client', () => ({
  MittwaldAPIV2Client: {
    newWithToken: vi.fn(() => ({
      domain: {
        listTlds: mockListTlds,
        listTldContactSchemas: mockListTldContactSchemas,
        checkDomainRegistrability: mockCheckDomainRegistrability,
        checkDomainTransferability: mockCheckDomainTransferability,
      },
      contract: {
        orderPreviewOrder: mockOrderPreviewOrder,
        orderCreateOrder: mockOrderCreateOrder,
      },
    })),
  },
}));

vi.mock('@mittwald/api-client-commons', () => ({
  assertStatus: vi.fn(),
}));

const { buildDomainOwnerHandle, checkDomain, orderDomain, previewDomainOrder } = await import('./domain-order.js');
const { LibraryError } = await import('../contracts/functions.js');

// Condensed versions of the real contact schemas: .de distinguishes persons
// and organizations via "type", .com only knows persons with an optional
// organization.
const $defs = {
  name: { type: 'string', minLength: 1, not: { pattern: 'GmbH' } },
  organization: { type: 'string', minLength: 1 },
  phone: { type: 'string', allOf: [{ pattern: '^\\+\\d{1,4}', title: 'hasToHavePhonePrefix' }] },
};
const commonProperties = {
  city: { type: 'string' },
  country: { type: 'string' },
  email: { type: 'string', format: 'email' },
  phone: { $ref: '#/$defs/phone' },
  street: { type: 'string' },
  zip: { type: 'string' },
};
const deSchema = {
  $schema: 'https://json-schema.org/draft/2019-09/schema',
  $defs,
  allOf: [
    {
      if: { properties: { type: { const: 'PERSON' } }, required: ['type'] },
      then: {
        properties: { name: { $ref: '#/$defs/name' }, organization: { $ref: '#/$defs/organization' } },
        required: ['type', 'name', 'email', 'street', 'zip', 'city', 'country', 'phone'],
      },
      else: {
        properties: { name: { $ref: '#/$defs/organization' } },
        required: ['type', 'name', 'email', 'street', 'zip', 'city', 'country', 'phone'],
      },
    },
  ],
  properties: { ...commonProperties, type: { enum: ['PERSON', 'ORG'] } },
  type: 'object',
  unevaluatedProperties: false,
};
const comSchema = {
  $schema: 'https://json-schema.org/draft/2019-09/schema',
  $defs,
  properties: {
    ...commonProperties,
    name: { $ref: '#/$defs/name' },
    organization: { $ref: '#/$defs/organization' },
  },
  required: ['name', 'email', 'phone', 'street', 'zip', 'city', 'country'],
  type: 'object',
  unevaluatedProperties: false,
};

const person = {
  type: 'person' as const,
  name: 'Max Mustermann',
  email: 'max@example.com',
  street: 'Musterstraße 12',
  postalCode: '32312',
  city: 'Espelkamp',
  country: 'de',
  phone: '+49 5772 2930',
};

describe('domain orders', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockListTlds.mockResolvedValue({ data: [{ tld: 'de' }, { tld: 'com' }, { tld: 'uk' }, { tld: 'co.uk' }] });
    mockListTldContactSchemas.mockImplementation(({ tld }: { tld: string }) =>
      Promise.resolve({ data: { jsonSchemaOwnerC: tld === 'de' ? deSchema : comSchema } })
    );
  });

  describe('buildDomainOwnerHandle', () => {
    const build = (domain: string, owner: Record<string, unknown>) =>
      buildDomainOwnerHandle({ domain, owner: owner as never, apiToken: 'token' });

    it('maps a person for a TLD with owner types', async () => {
      const { data } = await build('example.de', person);

      expect(Object.fromEntries(data.fields.map((f) => [f.name, f.value]))).toEqual({
        type: 'PERSON',
        name: 'Max Mustermann',
        email: 'max@example.com',
        street: 'Musterstraße 12',
        zip: '32312',
        city: 'Espelkamp',
        country: 'DE',
        phone: '+49 5772 2930',
      });
    });

    it('puts the company into name for organizations on TLDs with owner types', async () => {
      const { data } = await build('example.de', { ...person, type: 'organization', company: 'Mustermann GmbH' });
      const fields = Object.fromEntries(data.fields.map((f) => [f.name, f.value]));

      expect(fields).toMatchObject({ type: 'ORG', name: 'Mustermann GmbH' });
      expect(fields).not.toHaveProperty('organization');
    });

    it('keeps the contact person in name and the company in organization on other TLDs', async () => {
      const { data } = await build('example.com', { ...person, type: 'organization', company: 'Mustermann GmbH' });
      const fields = Object.fromEntries(data.fields.map((f) => [f.name, f.value]));

      expect(fields).toMatchObject({ name: 'Max Mustermann', organization: 'Mustermann GmbH' });
      expect(fields).not.toHaveProperty('type');
    });

    it('uses the contact schema of the longest matching TLD', async () => {
      const { data } = await build('example.co.uk', person);

      expect(mockListTldContactSchemas).toHaveBeenCalledWith({ tld: 'co.uk' });
      expect(data.tld).toBe('co.uk');
    });

    it('rejects organizations without company', async () => {
      await expect(build('example.de', { ...person, type: 'organization' })).rejects.toThrow(
        'company is required for organizations'
      );
    });

    it('reports invalid owner details with the input field names', async () => {
      const error = await build('example.com', { ...person, postalCode: '', name: 'Mustermann GmbH', phone: '0577' }).catch(
        (e) => e
      );

      expect(error).toBeInstanceOf(LibraryError);
      expect(error.code).toBe(400);
      expect(error.details.problems).toHaveLength(3);
      expect(error.details.problems).toEqual(
        expect.arrayContaining([
          'postalCode is required',
          'name must be the name of a person; put company names into company',
          'phone is invalid (hasToHavePhonePrefix)',
        ])
      );
    });

    it('rejects domains whose TLD mittwald does not offer', async () => {
      await expect(build('example.invalid', person)).rejects.toThrow('Domains ending in "invalid" cannot be ordered');
    });
  });

  describe('checkDomain', () => {
    it('reports registrable domains with the required owner fields', async () => {
      mockCheckDomainRegistrability.mockResolvedValue({ data: { registrable: true, isPremium: false } });

      const { data } = await checkDomain({ domain: 'Example.DE', apiToken: 'token' });

      expect(data).toEqual({
        domain: 'example.de',
        tld: 'de',
        registrable: true,
        isPremium: false,
        requiredOwnerFields: ['type', 'name', 'email', 'street', 'postalCode', 'city', 'country', 'phone'],
      });
      expect(mockCheckDomainTransferability).not.toHaveBeenCalled();
    });

    it('ignores the missing auth code when checking transferability', async () => {
      mockCheckDomainRegistrability.mockResolvedValue({ data: { registrable: false, isPremium: false } });
      mockCheckDomainTransferability.mockResolvedValue({
        data: { transferable: false, reasons: { wrongAuthCode: true, transferLock: false } },
      });

      const { data } = await checkDomain({ domain: 'example.com', apiToken: 'token' });

      expect(data.transfer).toEqual({ transferable: true, authCodeRequired: true, blockers: [] });
    });

    it('reports transfer blockers', async () => {
      mockCheckDomainRegistrability.mockResolvedValue({ data: { registrable: false, isPremium: false } });
      mockCheckDomainTransferability.mockResolvedValue({
        data: { transferable: false, reasons: { wrongAuthCode: true, transferLock: true } },
      });

      const { data } = await checkDomain({ domain: 'example.com', authCode: 'abc', apiToken: 'token' });

      expect(data.transfer).toEqual({
        transferable: false,
        authCodeRequired: false,
        blockers: ['wrongAuthCode', 'transferLock'],
      });
    });
  });

  it('previewDomainOrder returns prices and contract duration', async () => {
    mockOrderPreviewOrder.mockResolvedValue({
      data: { domainPrice: 1068, feePrice: 299, totalPrice: 1367, domainContractDuration: 12 },
    });

    const { data } = await previewDomainOrder({ domain: 'example.de', projectId: 'p-1', apiToken: 'token' });

    expect(mockOrderPreviewOrder).toHaveBeenCalledWith({
      data: { orderType: 'domain', orderData: { domain: 'example.de', projectId: 'p-1' } },
    });
    expect(data).toEqual({ domainPrice: 1068, feePrice: 299, totalPrice: 1367, contractDurationInMonths: 12 });
  });

  it('orderDomain sends the owner handle', async () => {
    mockOrderCreateOrder.mockResolvedValue({ status: 201, data: { orderId: 'o-1' } });
    const ownerHandle = [{ name: 'name', value: 'Max Mustermann' }];

    const { data } = await orderDomain({
      domain: 'example.de',
      projectId: 'p-1',
      authCode: 'abc',
      ownerHandle,
      apiToken: 'token',
    });

    expect(mockOrderCreateOrder).toHaveBeenCalledWith({
      data: {
        orderType: 'domain',
        orderData: { domain: 'example.de', projectId: 'p-1', authCode: 'abc', handleData: { ownerC: ownerHandle } },
      },
    });
    expect(data).toEqual({ orderId: 'o-1' });
  });
});
