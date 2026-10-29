/**
 * Domain availability checks and domain orders
 */

import { Ajv2019 } from 'ajv/dist/2019.js';
import type { ErrorObject } from 'ajv/dist/2019.js';
import { executeApiCall } from './execute-api-call.js';
import { LibraryError } from '../contracts/functions.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

/**
 * Domain owner as entered in mStudio. Mapped onto the TLD-specific contact
 * schema by {@link buildDomainOwnerHandle}.
 */
export interface DomainOwner {
  type: 'person' | 'organization';
  /** Full name of the owner, or of the contact person for organizations */
  name: string;
  /** Company name; required for organizations */
  company?: string;
  email: string;
  /** Street and house number */
  street: string;
  postalCode: string;
  city: string;
  /** ISO 3166-1 alpha-2 country code */
  country: string;
  /** Phone number in international format, e.g. +49 5772 2930 */
  phone: string;
}

export interface DomainOwnerHandleField {
  name: string;
  value: string;
}

type ContactSchema = {
  properties?: Record<string, unknown>;
  required?: string[];
  allOf?: Array<{ then?: ContactSchema; else?: ContactSchema }>;
};

async function resolveTld(apiToken: string, domain: string): Promise<string> {
  const { data: tlds } = await executeApiCall<Array<{ tld: string }>>(apiToken, (client) =>
    client.domain.listTlds()
  );

  const match = tlds
    .map((t) => t.tld)
    .filter((tld) => domain.endsWith(`.${tld}`))
    .sort((a, b) => b.length - a.length)[0];

  if (!match) {
    throw new LibraryError(`Domains ending in "${domain.split('.').slice(1).join('.')}" cannot be ordered at mittwald`, 400);
  }
  return match;
}

async function getOwnerContactSchema(apiToken: string, tld: string): Promise<ContactSchema> {
  const { data } = await executeApiCall<{ jsonSchemaOwnerC: ContactSchema }>(apiToken, (client) =>
    client.domain.listTldContactSchemas({ tld })
  );
  return data.jsonSchemaOwnerC;
}

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/\.$/, '');
}

// Schema property name -> DomainOwner field, for the owner type at hand
function ownerFieldMapping(schema: ContactSchema, owner: DomainOwner): Record<string, keyof DomainOwner> {
  // TLDs with a "type" property (e.g. .de) put the company name into "name"
  // for organizations; all others keep the person in "name" and the company
  // in "organization".
  const companyInName = Boolean(schema.properties?.type) && owner.type === 'organization';

  return {
    ...(schema.properties?.type ? { type: 'type' as const } : {}),
    name: companyInName ? 'company' : 'name',
    ...(companyInName ? {} : { organization: 'company' as const }),
    email: 'email',
    street: 'street',
    zip: 'postalCode',
    city: 'city',
    country: 'country',
    phone: 'phone',
  };
}

function ownerFieldValue(owner: DomainOwner, field: keyof DomainOwner): string | undefined {
  if (field === 'type') {
    return owner.type === 'organization' ? 'ORG' : 'PERSON';
  }
  if (field === 'country') {
    return owner.country?.trim().toUpperCase();
  }
  const value = owner[field]?.trim();
  return value ? value : undefined;
}

function describeValidationError(error: ErrorObject, mapping: Record<string, keyof DomainOwner>): string | undefined {
  if (error.keyword === 'if') {
    return undefined;
  }
  if (error.keyword === 'required') {
    const property = String(error.params.missingProperty);
    return `${mapping[property] ?? property} is required`;
  }
  if (error.keyword === 'unevaluatedProperties') {
    const property = String(error.params.unevaluatedProperty);
    return `${mapping[property] ?? property} is not supported for this domain ending`;
  }

  const property = error.instancePath.replace(/^\//, '');
  const field = mapping[property] ?? property;
  if (property === 'name' && error.keyword === 'not') {
    return field === 'name'
      ? 'name must be the name of a person; put company names into company'
      : 'company must be a company name, not the name of a person';
  }
  const rule = (error.parentSchema as { title?: string } | undefined)?.title;
  return `${field} is invalid${rule ? ` (${rule})` : ''}`;
}

/**
 * Collects the owner fields a TLD requires, named like {@link DomainOwner}.
 */
function requiredOwnerFields(schema: ContactSchema): string[] {
  const mapping: Record<string, string> = { zip: 'postalCode', organization: 'company' };
  const required = new Set<string>(schema.required ?? []);
  for (const branch of schema.allOf ?? []) {
    for (const field of [...(branch.then?.required ?? []), ...(branch.else?.required ?? [])]) {
      required.add(field);
    }
  }
  return [...required].map((field) => mapping[field] ?? field);
}

export interface CheckDomainOptions extends LibraryFunctionBase {
  domain: string;
  /** Auth code from the current registrar, for domain transfers */
  authCode?: string;
}

export interface DomainCheckResult {
  domain: string;
  tld: string;
  registrable: boolean;
  isPremium: boolean;
  /** Only set if the domain is not registrable */
  transfer?: {
    /** Without an auth code: whether a transfer is possible once the auth code is known */
    transferable: boolean;
    authCodeRequired: boolean;
    /** Reasons reported by the API, e.g. transferLock, inRedemptionPeriod */
    blockers: string[];
  };
  requiredOwnerFields: string[];
}

export async function checkDomain(options: CheckDomainOptions): Promise<LibraryResult<DomainCheckResult>> {
  const startTime = performance.now();
  const domain = normalizeDomain(options.domain);
  const tld = await resolveTld(options.apiToken, domain);

  const { data: registrability } = await executeApiCall<{ registrable: boolean; isPremium: boolean }>(
    options.apiToken,
    (client) => client.domain.checkDomainRegistrability({ data: { domain } })
  );

  const result: DomainCheckResult = {
    domain,
    tld,
    registrable: registrability.registrable,
    isPremium: registrability.isPremium,
    requiredOwnerFields: requiredOwnerFields(await getOwnerContactSchema(options.apiToken, tld)),
  };

  if (!registrability.registrable) {
    const { data: transferability } = await executeApiCall<{
      transferable: boolean;
      reasons?: Record<string, boolean>;
    }>(options.apiToken, (client) =>
      client.domain.checkDomainTransferability({ data: { domain, authCode: options.authCode } })
    );

    // Without an auth code the API always reports wrongAuthCode; that is
    // expected and not a reason the transfer would fail.
    const blockers = Object.entries(transferability.reasons ?? {})
      .filter(([reason, applies]) => applies && (options.authCode || reason !== 'wrongAuthCode'))
      .map(([reason]) => reason);

    result.transfer = {
      transferable: options.authCode ? transferability.transferable : blockers.length === 0,
      authCodeRequired: !options.authCode,
      blockers,
    };
  }

  return { data: result, status: 200, durationMs: performance.now() - startTime };
}

export interface BuildDomainOwnerHandleOptions extends LibraryFunctionBase {
  domain: string;
  owner: DomainOwner;
}

/**
 * Maps the owner onto the contact schema of the domain's TLD and validates it,
 * so that invalid owner details are rejected before the order is placed.
 */
export async function buildDomainOwnerHandle(
  options: BuildDomainOwnerHandleOptions
): Promise<LibraryResult<DomainOwnerHandleField[]>> {
  const startTime = performance.now();
  const domain = normalizeDomain(options.domain);
  const { owner } = options;

  if (owner.type === 'organization' && !owner.company?.trim()) {
    throw new LibraryError('Invalid domain owner: company is required for organizations', 400);
  }

  const schema = await getOwnerContactSchema(options.apiToken, await resolveTld(options.apiToken, domain));
  const mapping = ownerFieldMapping(schema, owner);

  const handle: Record<string, string> = {};
  for (const [property, field] of Object.entries(mapping)) {
    const value = ownerFieldValue(owner, field);
    if (value !== undefined) {
      handle[property] = value;
    }
  }

  const ajv = new Ajv2019({ allErrors: true, strict: false, verbose: true });
  ajv.addFormat('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  const validate = ajv.compile(schema);

  if (!validate(handle)) {
    const problems = [
      ...new Set((validate.errors ?? []).map((e) => describeValidationError(e, mapping)).filter(Boolean)),
    ];
    throw new LibraryError(`Invalid domain owner: ${problems.join('; ')}`, 400, { problems });
  }

  return {
    data: Object.entries(handle).map(([name, value]) => ({ name, value })),
    status: 200,
    durationMs: performance.now() - startTime,
  };
}

export interface PreviewDomainOrderOptions extends LibraryFunctionBase {
  domain: string;
  projectId: string;
  authCode?: string;
}

export interface DomainOrderPreview {
  domainPrice: number;
  feePrice: number;
  totalPrice: number;
  contractDurationInMonths: number;
}

export async function previewDomainOrder(
  options: PreviewDomainOrderOptions
): Promise<LibraryResult<DomainOrderPreview>> {
  const result = await executeApiCall<{
    domainPrice: number;
    feePrice: number;
    totalPrice: number;
    domainContractDuration: number;
  }>(options.apiToken, (client) =>
    client.contract.orderPreviewOrder({
      data: {
        orderType: 'domain',
        orderData: {
          domain: normalizeDomain(options.domain),
          projectId: options.projectId,
          ...(options.authCode ? { authCode: options.authCode } : {}),
        },
      },
    })
  );

  return {
    ...result,
    data: {
      domainPrice: result.data.domainPrice,
      feePrice: result.data.feePrice,
      totalPrice: result.data.totalPrice,
      contractDurationInMonths: result.data.domainContractDuration,
    },
  };
}

export interface OrderDomainOptions extends LibraryFunctionBase {
  domain: string;
  projectId: string;
  authCode?: string;
  /** Output of {@link buildDomainOwnerHandle} */
  ownerHandle: DomainOwnerHandleField[];
}

export async function orderDomain(options: OrderDomainOptions): Promise<LibraryResult<{ orderId: string }>> {
  if (options.ownerHandle.length === 0) {
    throw new LibraryError('ownerHandle must not be empty', 400);
  }
  const [first, ...rest] = options.ownerHandle;

  return executeApiCall(
    options.apiToken,
    (client) =>
      client.contract.orderCreateOrder({
        data: {
          orderType: 'domain',
          orderData: {
            domain: normalizeDomain(options.domain),
            projectId: options.projectId,
            ...(options.authCode ? { authCode: options.authCode } : {}),
            handleData: { ownerC: [first, ...rest] },
          },
        },
      }),
    201
  );
}

export interface ResendDomainVerificationEmailOptions extends LibraryFunctionBase {
  domainId: string;
}

export async function resendDomainVerificationEmail(
  options: ResendDomainVerificationEmailOptions
): Promise<LibraryResult<void>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.domain.resendDomainEmail({ domainId: options.domainId }),
    204
  );
}
