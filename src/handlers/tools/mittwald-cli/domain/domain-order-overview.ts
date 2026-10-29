import type { PendingDomainOrder } from '../../../../utils/pending-domain-orders.js';

export const VERIFICATION_EMAIL_NOTICE =
  "Registering a domain may require verifying the owner's email address. The verification email is sent " +
  'from noreply@mittwald.de and must be confirmed within 7 days, otherwise the domain will be suspended.';

function formatEuroCents(cents: number): string {
  return `${(cents / 100).toFixed(2)} EUR`;
}

export function buildDomainOrderOverview(order: Omit<PendingDomainOrder, 'userId' | 'ownerHandle'>) {
  const { owner, price } = order;
  return {
    domain: order.domain,
    orderType: order.authCode ? 'transfer' : 'registration',
    projectId: order.projectId,
    owner: {
      type: owner.type,
      ...(owner.company ? { company: owner.company } : {}),
      name: owner.name,
      email: owner.email,
      address: `${owner.street}, ${owner.postalCode} ${owner.city}, ${owner.country.toUpperCase()}`,
      phone: owner.phone,
    },
    price: {
      domain: formatEuroCents(price.domainPrice),
      fee: formatEuroCents(price.feePrice),
      total: formatEuroCents(price.totalPrice),
    },
    contractDurationInMonths: price.contractDurationInMonths,
    verificationEmail: VERIFICATION_EMAIL_NOTICE,
  };
}

/** Plain-text version of the overview, shown to the user in the confirmation dialog */
export function formatDomainOrderOverview(order: Omit<PendingDomainOrder, 'userId' | 'ownerHandle'>): string {
  const overview = buildDomainOrderOverview(order);
  return [
    `${overview.orderType === 'transfer' ? 'Transfer' : 'Register'} the domain ${overview.domain}?`,
    '',
    `Project: ${overview.projectId}`,
    `Owner: ${[overview.owner.company, overview.owner.name].filter(Boolean).join(', ')}`,
    `       ${overview.owner.address}`,
    `       ${overview.owner.email}, ${overview.owner.phone}`,
    '',
    `Domain: ${overview.price.domain} per ${overview.contractDurationInMonths} months`,
    `Fee: ${overview.price.fee}`,
    `Total: ${overview.price.total}`,
    '',
    overview.verificationEmail,
  ].join('\n');
}
